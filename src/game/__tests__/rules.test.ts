/// <reference types="jest" />
import {
  applyProgress, countdown, gatesFor, newlyClearedGates, nextGate, pace, pendingAwards, penaltyFor,
  penaltyProgress, rankOf, streak, toNextRankLabel, dateKey, addDays,
} from '../rules';
import type { DailyQuestState, Goal, Player } from '../types';

const goal: Goal = {
  startKg: 94, targetKg: 84, startDate: '2026-09-01', endDate: '2026-12-31', eventName: 'New Year',
  gateStepKg: 1, stepsGoal: 10000, waterGoalL: 3,
};
const player: Player = { name: 'P', level: 12, xp: 780, stats: { STR: 18, AGI: 14, VIT: 16, END: 15 } };
const day = (p: Partial<DailyQuestState> = {}): DailyQuestState => ({
  date: '2026-10-09', steps: 0, sensorSteps: 0, manualSteps: 0, waterL: 0, workoutDone: false, awarded: {}, ...p,
});

describe('weight gates', () => {
  it('generates gates from start − step down to target', () => {
    expect(gatesFor(goal)).toEqual([93, 92, 91, 90, 89, 88, 87, 86, 85, 84]);
    expect(gatesFor({ ...goal, gateStepKg: 2 })).toEqual([92, 90, 88, 86, 84]);
    expect(gatesFor({ ...goal, gateStepKg: 5 })).toEqual([89, 84]);
  });
  it('finds the next gate and newly cleared gates once', () => {
    const g = gatesFor(goal);
    expect(nextGate(g, 91.2)).toBe(91);
    expect(newlyClearedGates(g, 90.8, [93, 92])).toEqual([91]);
    expect(newlyClearedGates(g, 90.8, [93, 92, 91])).toEqual([]);
  });
});

describe('EXP and levels', () => {
  it('awards each quest once, plus the full-clear bonus', () => {
    const r = pendingAwards(day({ steps: 10000, waterL: 3, workoutDone: true }), goal);
    expect(r.gain).toBe(50 + 50 + 300 + 100);
    expect(pendingAwards(day({ steps: 12000, waterL: 3, workoutDone: true, awarded: r.awarded }), goal).gain).toBe(0);
  });
  it('carries overflow and adds +1 per stat per level', () => {
    const { player: p, levelUp } = applyProgress(player, 450, 0);
    expect(p.level).toBe(13);
    expect(p.xp).toBe(230);
    expect(p.stats.STR).toBe(19);
    expect(levelUp?.rankUp).toBeNull();
  });
  it('adds gate levels and detects rank change', () => {
    const { player: p, levelUp } = applyProgress({ ...player, level: 19 }, 0, 1, 'Weight Gate cleared: 91.0 kg');
    expect(p.level).toBe(20);
    expect(levelUp).toMatchObject({ from: 19, to: 20, rankUp: { from: 'D', to: 'C' } });
  });
  it('maps ranks', () => {
    expect([1, 9, 10, 19, 20, 30, 40, 50].map(rankOf)).toEqual(['E', 'E', 'D', 'D', 'C', 'B', 'A', 'S']);
    expect(toNextRankLabel(12)).toBe('8 levels to Rank C');
    expect(toNextRankLabel(20)).toBe('10 levels to Rank B');
  });
});

describe('penalty', () => {
  it('issues a penalty when any quest was unfinished yesterday', () => {
    const p = penaltyFor(day({ steps: 11000, waterL: 2.1, workoutDone: true }), goal);
    expect(p?.reason).toBe("Yesterday's water quest (2.1 / 3 L) failed.");
    expect(penaltyFor(day({ steps: 11000, waterL: 3, workoutDone: true }), goal)).toBeUndefined();
  });
  it('counts steps above the step goal', () => {
    expect(penaltyProgress(day({ steps: 6420 }), goal)).toBe(0);
    expect(penaltyProgress(day({ steps: 11500 }), goal)).toBe(1500);
    expect(penaltyProgress(day({ steps: 15000 }), goal)).toBe(2000);
  });
});

describe('countdown and pace', () => {
  it('counts down to the end of the end date', () => {
    const now = new Date(2026, 9, 9, 12, 0, 0).getTime();
    expect(countdown(goal, now)).toMatchObject({ days: 83, hours: 12, minutes: 0, seconds: 0 });
  });
  it('computes required and current pace', () => {
    const now = new Date(2026, 9, 9, 12).getTime();
    const p = pace(goal, 91.2, now);
    expect(p.lost).toBeCloseTo(2.8);
    expect(p.required).toBeGreaterThan(p.current);
    expect(p.projected).toBeCloseTo(91.2 - p.current * p.weeksLeft);
  });
});

describe('streak', () => {
  it('counts back to the last missed scheduled workout, rest days included', () => {
    const today = new Date(2026, 9, 9);
    const done = new Set(['2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'].filter(k => k !== '2026-10-04'));
    const isSched = (d: Date) => d.getDay() !== 0;
    // Oct 4 is a Sunday (rest), Oct 3 missed.
    expect(streak(today, k => done.has(k), isSched, new Date(2026, 8, 1))).toBe(5);
    expect(dateKey(addDays(today, -6))).toBe('2026-10-03');
  });
});
