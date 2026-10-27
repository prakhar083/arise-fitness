import { useMemo } from 'react';
import { dateKey, gatesFor, isCleared, nextGate, parseDate, questsDone, streak } from '../game/rules';
import { isScheduledWorkoutDay, scheduledDayFor } from '../data/plan';
import { currentWeight, useGame, useToday } from './useGame';

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MON3 = MONTHS.map(m => m.slice(0, 3));
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const shortDate = (key: string) => { const d = parseDate(key); return `${d.getDate()} ${MON3[d.getMonth()]}`; };
export const longDate = (key: string) => {
  const d = parseDate(key);
  return `${DOW[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/** Weight journey: gates, current weight, next gate, progress. */
export const useJourney = () => {
  const goal = useGame(s => s.goal);
  const weights = useGame(s => s.weights);
  return useMemo(() => {
    const gates = gatesFor(goal);
    const cur = currentWeight(weights, goal.startKg);
    const next = nextGate(gates, cur);
    const span = goal.startKg - goal.targetKg;
    const lost = Math.max(0, goal.startKg - cur);
    return {
      goal, gates, cur, next, span, lost,
      cleared: gates.filter(g => isCleared(g, cur)).length,
      pct: span > 0 ? Math.min(100, (lost / span) * 100) : 0,
    };
  }, [goal, weights]);
};

export const useStreak = () => {
  const days = useGame(s => s.days);
  const startDate = useGame(s => s.goal.startDate);
  const todayK = dateKey(new Date());
  return useMemo(() => streak(parseDate(todayK), k => !!days[k]?.workoutDone, isScheduledWorkoutDay, parseDate(startDate)),
    [days, startDate, todayK]);
};

export const useTodayQuests = () => {
  const today = useToday();
  const goal = useGame(s => s.goal);
  return { today, goal, done: questsDone(today, goal), todayDay: scheduledDayFor(new Date()) };
};
