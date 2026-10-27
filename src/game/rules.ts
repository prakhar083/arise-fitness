// Game rules — the source of truth from the handoff README ("Game Rules"). Pure functions only.
import type { Awarded, DailyQuestState, Goal, LevelUpEvent, Penalty, Player, Stats } from './types';

export const XP_PER_LEVEL = 1000;
export const REWARD = { steps: 50, water: 50, workout: 300, bonusWorkout: 150, fullClear: 100 } as const;
export const PENALTY_STEPS = 2000;
export const DAY_MS = 864e5;
export const WEEK_MS = 7 * DAY_MS;

export type RankLetter = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
export type Perk = { title: string; description: string; icon: 'badge' | 'trend' | 'sword' | 'shield' | 'crown' | 'flag' };

export const RANKS: Record<RankLetter, { title: string; range: string; perks: Perk[] }> = {
  E: { title: 'Awakened', range: 'Lv 1–9', perks: [] },
  D: { title: 'Gate Challenger', range: 'Lv 10–19', perks: [
    { title: 'New title', description: 'Gate Challenger', icon: 'badge' },
    { title: 'Quest EXP +10%', description: 'All daily quest rewards', icon: 'trend' },
    { title: 'Harder quests unlocked', description: '11K steps · 3.25 L water', icon: 'sword' }] },
  C: { title: 'Iron Body', range: 'Lv 20–29', perks: [
    { title: 'New title', description: 'Iron Body', icon: 'badge' },
    { title: 'Quest EXP +20%', description: 'All daily quest rewards', icon: 'trend' },
    { title: 'Harder quests unlocked', description: '12K steps · 3.5 L water', icon: 'sword' }] },
  B: { title: 'Relentless', range: 'Lv 30–39', perks: [
    { title: 'New title', description: 'Relentless', icon: 'badge' },
    { title: 'Quest EXP +30%', description: 'All daily quest rewards', icon: 'trend' },
    { title: 'Penalty shield', description: 'Skip one penalty quest a week', icon: 'shield' }] },
  A: { title: 'Elite Hunter', range: 'Lv 40–49', perks: [
    { title: 'New title', description: 'Elite Hunter', icon: 'badge' },
    { title: 'Quest EXP +40%', description: 'All daily quest rewards', icon: 'trend' },
    { title: 'Harder quests unlocked', description: '15K steps · 4 L water', icon: 'sword' }] },
  S: { title: 'Monarch', range: 'Lv 50', perks: [
    { title: 'New title', description: 'Monarch', icon: 'crown' },
    { title: 'Quest EXP +50%', description: 'All daily quest rewards', icon: 'trend' },
    { title: 'Gate mastered', description: 'Set your next goal', icon: 'flag' }] },
};

export const rankOf = (lv: number): RankLetter =>
  lv < 10 ? 'E' : lv < 20 ? 'D' : lv < 30 ? 'C' : lv < 40 ? 'B' : lv < 50 ? 'A' : 'S';

export const toNextRankLabel = (level: number) => {
  if (level >= 50) return 'Max rank';
  const t = Math.ceil((level + 1) / 10) * 10;
  return `${t - level} levels to Rank ${rankOf(t)}`;
};

// ── Dates ────────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0');
export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseDate = (key: string) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// ── Weight Gates ─────────────────────────────────────────────────────────
/** Gates from start − step down to target, every step kg. */
export const gatesFor = (g: Pick<Goal, 'startKg' | 'targetKg' | 'gateStepKg'>) => {
  const out: number[] = [];
  if (!(g.gateStepKg > 0) || !(g.startKg > g.targetKg)) return out;
  for (let v = g.startKg - g.gateStepKg; v >= g.targetKg - 1e-9; v -= g.gateStepKg) out.push(Math.round(v * 10) / 10);
  return out;
};
export const isCleared = (gate: number, kg: number) => kg <= gate + 1e-9;
export const nextGate = (gates: number[], kg: number) => gates.find(v => !isCleared(v, kg));

/**
 * Gates newly cleared by a weigh-in. Each gate is only ever rewarded once
 * (`claimed`), so bouncing back above a gate and re-crossing it does not re-award.
 */
export const newlyClearedGates = (gates: number[], kg: number, claimed: number[]) =>
  gates.filter(v => isCleared(v, kg) && !claimed.some(c => Math.abs(c - v) < 1e-6));

// ── EXP & levels ─────────────────────────────────────────────────────────
/** Rewards earned by the current daily state that have not been awarded yet. */
export const pendingAwards = (day: DailyQuestState, goal: Goal) => {
  const aw: Awarded = { ...day.awarded };
  let gain = 0;
  if (!aw.steps && day.steps >= goal.stepsGoal) { aw.steps = true; gain += REWARD.steps; }
  if (!aw.water && day.waterL >= goal.waterGoalL - 1e-9) { aw.water = true; gain += REWARD.water; }
  if (!aw.workout && day.workoutDone) { aw.workout = true; gain += REWARD.workout; }
  if (!aw.all && aw.steps && aw.water && aw.workout) { aw.all = true; gain += REWARD.fullClear; }
  return { awarded: aw, gain };
};

export const questsDone = (day: DailyQuestState, goal: Goal) =>
  Number(day.steps >= goal.stepsGoal) + Number(day.waterL >= goal.waterGoalL - 1e-9) + Number(day.workoutDone);

/** Add EXP (overflow carries) and bonus levels; every level gives +1 to each stat. */
export const applyProgress = (
  p: Player, gainXp: number, bonusLevels: number, reason?: string,
): { player: Player; levelUp: LevelUpEvent | null } => {
  let xp = p.xp + gainXp, level = p.level;
  while (xp >= XP_PER_LEVEL) { xp -= XP_PER_LEVEL; level++; }
  level += bonusLevels;
  if (level === p.level) return { player: { ...p, xp }, levelUp: null };
  const d = level - p.level;
  const stats = Object.fromEntries(Object.entries(p.stats).map(([k, v]) => [k, v + d])) as Stats;
  const from = rankOf(p.level), to = rankOf(level);
  return {
    player: { ...p, xp, level, stats },
    levelUp: {
      from: p.level, to: level, gained: d,
      reason: reason ?? (bonusLevels ? 'Weight Gate cleared' : 'EXP threshold reached'),
      rankUp: from !== to ? { from, to } : null,
    },
  };
};

// ── Penalty ──────────────────────────────────────────────────────────────
/** A penalty is issued for today if any of yesterday's quests were unfinished at midnight. */
export const penaltyFor = (yesterday: DailyQuestState | undefined, goal: Goal): Penalty | undefined => {
  if (!yesterday) return undefined;
  const failed: string[] = [];
  if (yesterday.steps < goal.stepsGoal) failed.push(`steps quest (${yesterday.steps.toLocaleString()} / ${goal.stepsGoal.toLocaleString()})`);
  if (yesterday.waterL < goal.waterGoalL - 1e-9) failed.push(`water quest (${fmtL(yesterday.waterL)} / ${goal.waterGoalL} L)`);
  if (!yesterday.workoutDone) failed.push('workout quest');
  if (!failed.length) return undefined;
  return { reason: `Yesterday's ${joinAnd(failed)} failed.`, target: PENALTY_STEPS };
};
export const penaltyProgress = (day: DailyQuestState, goal: Goal) =>
  Math.max(0, Math.min(PENALTY_STEPS, day.steps - goal.stepsGoal));

const joinAnd = (xs: string[]) => xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1];
export const fmtL = (l: number) => (Math.round(l * 100) / 100).toString();

// ── Countdown & pace ─────────────────────────────────────────────────────
export const gateCloseTime = (g: Pick<Goal, 'endDate'>) => addDays(parseDate(g.endDate), 1).getTime();

export const countdown = (g: Pick<Goal, 'endDate'>, now: number) => {
  const msLeft = Math.max(0, gateCloseTime(g) - now);
  return {
    msLeft,
    days: Math.floor(msLeft / DAY_MS),
    hours: Math.floor((msLeft % DAY_MS) / 36e5),
    minutes: Math.floor((msLeft % 36e5) / 6e4),
    seconds: Math.floor((msLeft % 6e4) / 1000),
  };
};

export const pace = (g: Goal, currentKg: number, now: number) => {
  const { msLeft } = countdown(g, now);
  const weeksLeft = msLeft / WEEK_MS;
  const weeksIn = Math.max(1 / 7, (now - parseDate(g.startDate).getTime()) / WEEK_MS);
  const lost = Math.max(0, g.startKg - currentKg);
  const required = weeksLeft > 0 ? Math.max(0, currentKg - g.targetKg) / weeksLeft : 0;
  const current = lost / weeksIn;
  const projected = currentKg - current * weeksLeft;
  const timePct = Math.min(100, Math.max(0, (now - parseDate(g.startDate).getTime()) / (gateCloseTime(g) - parseDate(g.startDate).getTime()) * 100));
  const span = g.startKg - g.targetKg;
  const weightPct = span > 0 ? Math.min(100, lost / span * 100) : 0;
  return { required, current, projected, lost, span, timePct, weightPct, weeksLeft };
};

export const paceAdvice = (p: ReturnType<typeof pace>, targetKg: number) =>
  p.projected <= targetKg
    ? 'You are ahead of the gate. Keep clearing your daily quests to stay on pace.'
    : `At your current pace you reach ${p.projected.toFixed(1)} kg. Lose ${(p.required - p.current).toFixed(2)} kg/week more, or clear the penalty quests, to close the gap.`;

// ── Streak ───────────────────────────────────────────────────────────────
/**
 * Consecutive days without a missed scheduled workout, counting back from yesterday
 * (today counts once its workout is done). Rest days keep the streak alive.
 */
export const streak = (
  today: Date,
  workoutDoneOn: (key: string) => boolean,
  isScheduled: (d: Date) => boolean,
  since: Date,
) => {
  let n = workoutDoneOn(dateKey(today)) ? 1 : 0;
  for (let d = addDays(today, -1); d >= since; d = addDays(d, -1)) {
    if (workoutDoneOn(dateKey(d))) n++;
    else if (!isScheduled(d)) n++;
    else break;
  }
  return n;
};
