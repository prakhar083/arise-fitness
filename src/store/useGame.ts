import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { dayById, flattenSection, scheduledDayFor } from '../data/plan';
import { blankGoal, seedLastSets, START_PLAYER } from '../data/seed';
import {
  addDays, applyProgress, dateKey, gatesFor, isCleared, newlyClearedGates, pendingAwards, penaltyFor, REWARD,
} from '../game/rules';
import type {
  CardioRow, CheckIn, DailyQuestState, Goal, LevelUpEvent, Player, Session, SetRow, WeightEntry, WorkoutLog,
} from '../game/types';

export type WorkoutSummary = { dayId: string; name: string; time: string; sets: string; volume: string };

type Persisted = {
  goal: Goal;
  /** False until the user saves a goal for the first time (first-launch onboarding). */
  goalSet: boolean;
  player: Player;
  weights: WeightEntry[];
  checkIns: CheckIn[];
  days: Record<string, DailyQuestState>;
  logs: WorkoutLog[];
  lastSets: Record<string, { kg: string; reps: string }[]>;
  gatesClaimed: number[];
  session: Session | null;
  summary: WorkoutSummary | null;
  autoRest: boolean;
};

type Ephemeral = {
  hydrated: boolean;
  /** Where today's steps come from: Apple Health, the device pedometer, or manual entry. */
  stepSource: 'health' | 'motion' | 'manual';
  levelUp: LevelUpEvent | null;
  rankUp: { from: string; to: string } | null;
  toast: { text: string; at: number } | null;
};

type Actions = {
  ensureToday: (now?: Date) => void;
  setSensorSteps: (n: number) => void;
  addManualSteps: (n: number) => void;
  addWater: (deltaL: number) => void;

  startSession: (dayId: string) => void;
  discardSession: () => void;
  updateSet: (key: string, j: number, patch: Partial<Pick<SetRow, 'kg' | 'reps'>>) => void;
  toggleSetDone: (key: string, j: number, restSec: number) => void;
  addSet: (key: string) => void;
  toggleBodyweight: (key: string) => void;
  updateCardio: (key: string, patch: Partial<Omit<CardioRow, 'done'>>) => void;
  toggleCardioDone: (key: string) => void;
  togglePause: () => void;
  toggleAutoRest: () => void;
  adjustRest: (deltaSec: number) => void;
  skipRest: () => void;
  finishSession: () => void;
  claimRewards: () => void;

  submitCheckIn: (ci: CheckIn) => boolean;
  saveGoal: (goal: Goal) => void;
  dismissLevelUp: () => void;
  dismissRankUp: () => void;
  showToast: (text: string) => void;
  resetAll: () => void;
};

export type GameState = Persisted & Ephemeral & Actions;

const todayKey = () => dateKey(new Date());

const initial = (): Persisted => ({
  goal: blankGoal(),
  goalSet: false,
  player: START_PLAYER,
  weights: [],
  checkIns: [],
  days: {},
  logs: [],
  lastSets: seedLastSets(),
  gatesClaimed: [],
  session: null,
  summary: null,
  autoRest: true,
});

const emptyDay = (date: string): DailyQuestState =>
  ({ date, steps: 0, sensorSteps: 0, manualSteps: 0, waterL: 0, workoutDone: false, awarded: {} });

export const sessionElapsedMs = (s: Session, now = Date.now()) =>
  s.accumulatedMs + (s.runningSince != null ? now - s.runningSince : 0);

const fmtMin = (ms: number) => Math.max(1, Math.round(ms / 60000)) + ' min';

export const sessionTotals = (s: Session) => {
  const rows = Object.entries(s.sets).flatMap(([key, rs]) => rs.map(r => ({ key, r })));
  const done = rows.filter(x => x.r.done);
  const volume = done.reduce((a, { key, r }) =>
    a + (s.bodyweight[key] ? 0 : (parseFloat(r.kg) || 0)) * (parseFloat(r.reps) || 0), 0);
  return { totalSets: rows.length, doneSets: done.length, volume: Math.round(volume) };
};

export const useGame = create<GameState>()(persist((set, get) => {
  /** Merge level-up events that land before the overlay is dismissed. */
  const pushLevelUp = (prev: LevelUpEvent | null, ev: LevelUpEvent | null): LevelUpEvent | null => {
    if (!ev) return prev;
    if (!prev) return ev;
    const from = prev.from;
    const rf = prev.rankUp?.from ?? (ev.rankUp ? ev.rankUp.from : null);
    const rt = ev.rankUp?.to ?? prev.rankUp?.to ?? null;
    return { from, to: ev.to, gained: ev.to - from, reason: ev.reason, rankUp: rf && rt && rf !== rt ? { from: rf, to: rt } : null };
  };

  /** Apply quest rewards for today's state, plus any extra EXP / gate levels. */
  const settle = (
    s: GameState, day: DailyQuestState, extra: { xp?: number; levels?: number; reason?: string; statBonus?: Partial<Player['stats']> } = {},
  ): Partial<GameState> => {
    const { awarded, gain } = pendingAwards(day, s.goal);
    const totalXp = gain + (extra.xp ?? 0);
    const base: Player = extra.statBonus
      ? { ...s.player, stats: { ...s.player.stats, ...Object.fromEntries(Object.entries(extra.statBonus).map(([k, v]) => [k, s.player.stats[k as keyof Player['stats']] + (v ?? 0)])) } }
      : s.player;
    const { player, levelUp } = applyProgress(base, totalXp, extra.levels ?? 0, extra.reason);
    const out: Partial<GameState> = {
      player, days: { ...s.days, [day.date]: { ...day, awarded } }, levelUp: pushLevelUp(s.levelUp, levelUp),
    };
    if (totalXp > 0) out.toast = { text: `+${totalXp} EXP`, at: Date.now() };
    return out;
  };

  const today = (s: GameState) => s.days[todayKey()] ?? emptyDay(todayKey());

  const updSession = (fn: (s: Session) => Session) =>
    set(st => (st.session ? { session: fn(st.session) } : {}));

  return {
    ...initial(),
    hydrated: false,
    stepSource: 'manual',
    levelUp: null,
    rankUp: null,
    toast: null,

    ensureToday: (now = new Date()) => set(s => {
      const key = dateKey(now);
      if (s.days[key]) return {};
      const day = emptyDay(key);
      day.penalty = penaltyFor(s.days[dateKey(addDays(now, -1))], s.goal);
      return { days: { ...s.days, [key]: day } };
    }),

    setSensorSteps: n => set(s => {
      const d = today(s);
      if (d.sensorSteps === n) return {};
      return settle(s, { ...d, sensorSteps: n, steps: n + d.manualSteps });
    }),
    addManualSteps: n => set(s => {
      const d = today(s);
      return settle(s, { ...d, manualSteps: d.manualSteps + n, steps: d.sensorSteps + d.manualSteps + n });
    }),
    addWater: delta => set(s => {
      const d = today(s);
      return settle(s, { ...d, waterL: Math.max(0, Math.round((d.waterL + delta) * 100) / 100) });
    }),

    startSession: dayId => set(s => {
      const day = dayById(dayId);
      const sets: Record<string, SetRow[]> = {};
      day.sections.forEach((_, si) => flattenSection(day, si).forEach(({ key, ex }) => {
        if (ex.kind !== 'set') return;
        const prev = s.lastSets[ex.name] ?? [];
        sets[key] = Array.from({ length: ex.sets }, (_, j) =>
          ({ kg: '', reps: '', prevKg: prev[j]?.kg ?? '', prevReps: prev[j]?.reps ?? '', done: false }));
      }));
      const now = Date.now();
      return { session: { dayId, startedAt: now, accumulatedMs: 0, runningSince: now, sets, cardio: {}, bodyweight: {}, restEndsAt: null } };
    }),
    discardSession: () => set({ session: null }),

    updateSet: (key, j, patch) => updSession(se => ({
      ...se, sets: { ...se.sets, [key]: se.sets[key].map((r, k) => (k === j ? { ...r, ...patch } : r)) },
    })),
    toggleSetDone: (key, j, restSec) => set(st => {
      const se = st.session;
      if (!se) return {};
      const bw = !!se.bodyweight[key];
      const rows = se.sets[key].map((r, k) => {
        if (k !== j) return r;
        if (r.done) return { ...r, done: false };
        return { ...r, done: true, kg: bw ? '' : r.kg || r.prevKg, reps: r.reps || r.prevReps };
      });
      const nowDone = rows[j].done;
      const restEndsAt = nowDone && restSec > 0 && st.autoRest ? Date.now() + restSec * 1000 : se.restEndsAt;
      return { session: { ...se, sets: { ...se.sets, [key]: rows }, restEndsAt } };
    }),
    addSet: key => updSession(se => ({
      ...se, sets: { ...se.sets, [key]: [...se.sets[key], { kg: '', reps: '', prevKg: '', prevReps: '', done: false }] },
    })),
    toggleBodyweight: key => updSession(se => ({ ...se, bodyweight: { ...se.bodyweight, [key]: !se.bodyweight[key] } })),
    updateCardio: (key, patch) => updSession(se => ({
      ...se, cardio: { ...se.cardio, [key]: { ...(se.cardio[key] ?? { reps: '', time: '', bpm: '', done: false }), ...patch } },
    })),
    toggleCardioDone: key => updSession(se => {
      const c = se.cardio[key] ?? { reps: '', time: '', bpm: '', done: false };
      return { ...se, cardio: { ...se.cardio, [key]: { ...c, done: !c.done } } };
    }),
    togglePause: () => updSession(se => se.runningSince != null
      ? { ...se, accumulatedMs: sessionElapsedMs(se), runningSince: null }
      : { ...se, runningSince: Date.now() }),
    toggleAutoRest: () => set(s => ({
      autoRest: !s.autoRest,
      session: s.session ? { ...s.session, restEndsAt: null } : null,
      toast: { text: s.autoRest ? 'Auto rest timer off' : 'Auto rest timer on', at: Date.now() },
    })),
    adjustRest: delta => updSession(se => {
      if (!se.restEndsAt) return se;
      const next = se.restEndsAt + delta * 1000;
      return { ...se, restEndsAt: next <= Date.now() ? null : next };
    }),
    skipRest: () => updSession(se => ({ ...se, restEndsAt: null })),

    finishSession: () => set(s => {
      const se = s.session;
      if (!se) return {};
      const day = dayById(se.dayId);
      const ms = sessionElapsedMs(se);
      const t = sessionTotals(se);
      const entries: WorkoutLog['entries'] = [];
      const lastSets = { ...s.lastSets };
      day.sections.forEach((_, si) => flattenSection(day, si).forEach(({ key, ex }) => {
        const bw = !!se.bodyweight[key];
        if (ex.kind === 'set') {
          const rows = se.sets[key] ?? [];
          entries.push({ exerciseKey: key, name: ex.name, bodyweight: bw, sets: rows.map(r => ({
            kg: bw ? null : parseFloat(r.kg) || null, reps: parseFloat(r.reps) || null, done: r.done })) });
          const done = rows.filter(r => r.done);
          // The previous log for the same exercise supplies the next session's placeholders.
          if (done.length) lastSets[ex.name] = done.map(r => ({ kg: bw ? '0' : r.kg, reps: r.reps }));
        } else if (se.cardio[key]) {
          entries.push({ exerciseKey: key, name: ex.name, bodyweight: false, cardio: se.cardio[key] });
        }
      }));
      const log: WorkoutLog = {
        dayId: se.dayId, date: todayKey(), durationSec: Math.round(ms / 1000), volumeKg: t.volume,
        doneSets: t.doneSets, totalSets: t.totalSets, entries,
      };
      return {
        logs: [...s.logs, log], lastSets,
        summary: { dayId: se.dayId, name: day.name, time: fmtMin(ms), sets: `${t.doneSets}/${t.totalSets}`, volume: t.volume.toLocaleString() },
        session: null,
      };
    }),

    claimRewards: () => set(s => {
      const sum = s.summary;
      if (!sum) return {};
      const d = today(s);
      const isToday = sum.dayId === scheduledDayFor(new Date()).id;
      if (isToday) return { ...settle(s, { ...d, workoutDone: true }, { statBonus: { STR: 1 } }), summary: null };
      // A non-scheduled workout gives +150 EXP, once per day.
      const bonus = d.awarded.bonusWorkout ? 0 : REWARD.bonusWorkout;
      return {
        ...settle(s, { ...d, awarded: { ...d.awarded, bonusWorkout: true } }, { xp: bonus, statBonus: { STR: 1 } }),
        summary: null,
      };
    }),

    submitCheckIn: ci => {
      if (!(ci.weight > 0)) { get().showToast('Enter your weight to submit'); return false; }
      set(s => {
        const gates = gatesFor(s.goal);
        const fresh = newlyClearedGates(gates, ci.weight, s.gatesClaimed);
        const weights = [...s.weights.filter(w => w.date !== ci.date), { date: ci.date, kg: ci.weight }]
          .sort((a, b) => a.date.localeCompare(b.date));
        const base = { weights, checkIns: [...s.checkIns, ci], gatesClaimed: [...s.gatesClaimed, ...fresh] };
        if (!fresh.length) return { ...base, toast: { text: 'Check-in recorded', at: Date.now() } };
        const lowest = Math.min(...fresh);
        const { player, levelUp } = applyProgress(s.player, 0, fresh.length, `Weight Gate cleared: ${lowest.toFixed(1)} kg`);
        return { ...base, player, levelUp: pushLevelUp(s.levelUp, levelUp) };
      });
      return true;
    },

    saveGoal: goal => set(s => {
      const first = !s.goalSet;
      const today = dateKey(new Date());
      const next = first ? { ...goal, startDate: today } : goal;
      // The starting weight is the first weigh-in.
      const weights = s.weights.length ? s.weights : [{ date: today, kg: next.startKg }];
      const cur = weights[weights.length - 1].kg;
      // Gates already below the current weight count as passed but grant no levels.
      const passed = gatesFor(next).filter(g => isCleared(g, cur) && !s.gatesClaimed.some(c => Math.abs(c - g) < 1e-6));
      return {
        goal: next, goalSet: true, weights, gatesClaimed: [...s.gatesClaimed, ...passed],
        toast: { text: first ? 'The gate is open. Arise.' : 'Goal saved', at: Date.now() },
      };
    }),

    dismissLevelUp: () => set(s => ({ levelUp: null, rankUp: s.levelUp?.rankUp ?? null })),
    dismissRankUp: () => set({ rankUp: null }),
    showToast: text => set({ toast: { text, at: Date.now() } }),
    resetAll: () => set({ ...initial(), levelUp: null, rankUp: null, toast: null }),
  };
}, {
  name: 'arise-game-v2',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: ({ goal, goalSet, player, weights, checkIns, days, logs, lastSets, gatesClaimed, session, summary, autoRest }) =>
    ({ goal, goalSet, player, weights, checkIns, days, logs, lastSets, gatesClaimed, session, summary, autoRest }),
  onRehydrateStorage: () => () => useGame.setState({ hydrated: true }),
}));

// Selectors / derived helpers
const emptyCache: Record<string, DailyQuestState> = {};
/** Today's quest state (a stable empty record until `ensureToday` creates it). */
export const useToday = () => useGame(s => {
  const k = todayKey();
  return s.days[k] ?? (emptyCache[k] ??= emptyDay(k));
});
export const currentWeight = (w: WeightEntry[], fallback = 0) => w[w.length - 1]?.kg ?? fallback;
