// First-launch state: a fresh Level 1 hunter. The goal is entered by the user in Goal Setup.
import { PLAN, parseSeedLog } from './plan';
import { addDays, dateKey } from '../game/rules';
import type { Goal, Player } from '../game/types';

export const START_PLAYER: Player = {
  name: 'Prakhar Vijay', level: 1, xp: 0, stats: { STR: 10, AGI: 10, VIT: 10, END: 10 },
};

/** Placeholder until the user saves a goal (`goalSet` stays false until then). */
export const blankGoal = (): Goal => ({
  startKg: 0, targetKg: 0, startDate: dateKey(new Date()), endDate: dateKey(addDays(new Date(), 84)),
  eventName: '', gateStepKg: 1, stepsGoal: 10000, waterGoalL: 3,
});

/** Previous set values per exercise name, from the sessions transcribed out of Kahunas. */
export const seedLastSets = () => {
  const out: Record<string, { kg: string; reps: string }[]> = {};
  for (const day of PLAN.days)
    for (const sec of day.sections)
      for (const it of sec.items)
        for (const ex of it.kind === 'superset' ? it.items : [it])
          if (ex.kind === 'set' && ex.seedLog && !out[ex.name]) out[ex.name] = parseSeedLog(ex.seedLog);
  return out;
};
