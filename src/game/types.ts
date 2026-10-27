export type StatKey = 'STR' | 'AGI' | 'VIT' | 'END';
export type Stats = Record<StatKey, number>;

export type Goal = {
  startKg: number;
  targetKg: number;
  /** Goal start date, YYYY-MM-DD (the journey's x-axis origin). */
  startDate: string;
  /** End date, YYYY-MM-DD. The gate closes at the end of this day. */
  endDate: string;
  eventName: string;
  gateStepKg: 1 | 2 | 5;
  stepsGoal: number;
  waterGoalL: number;
};

export type Player = { name: string; level: number; xp: number; stats: Stats };

export type WeightEntry = { date: string; kg: number };

export type CheckIn = {
  date: string;
  time: string;
  weight: number;
  waist?: number;
  hip?: number;
  biceps?: number;
  thighs?: number;
  sleepH?: number;
  sleepQuality?: number;
  waterL?: number;
  workouts?: number;
  workoutRating?: number;
  calories?: string;
  milestones?: string;
  support?: string;
  photos: { front?: string; back?: string; side?: string };
};

export type SetRow = { kg: string; reps: string; prevKg: string; prevReps: string; done: boolean };
export type CardioRow = { reps: string; time: string; bpm: string; done: boolean };

export type WorkoutLogEntry = {
  exerciseKey: string;
  name: string;
  bodyweight: boolean;
  sets?: { kg: number | null; reps: number | null; done: boolean }[];
  cardio?: CardioRow;
};

export type WorkoutLog = {
  dayId: string;
  date: string;
  durationSec: number;
  volumeKg: number;
  doneSets: number;
  totalSets: number;
  entries: WorkoutLogEntry[];
};

export type Penalty = { reason: string; target: number };

export type Awarded = { steps?: boolean; water?: boolean; workout?: boolean; bonusWorkout?: boolean; all?: boolean };

export type DailyQuestState = {
  date: string;
  /** Total = sensorSteps + manualSteps. */
  steps: number;
  sensorSteps: number;
  manualSteps: number;
  waterL: number;
  workoutDone: boolean;
  awarded: Awarded;
  penalty?: Penalty;
};

/** Active workout session (persisted so the logger survives backgrounding). */
export type Session = {
  dayId: string;
  startedAt: number;
  /** Accumulated ms before the current running segment. */
  accumulatedMs: number;
  /** Start of the current running segment, null while paused. */
  runningSince: number | null;
  sets: Record<string, SetRow[]>;
  cardio: Record<string, CardioRow>;
  bodyweight: Record<string, boolean>;
  restEndsAt: number | null;
};

export type LevelUpEvent = {
  from: number;
  to: number;
  gained: number;
  reason: string;
  rankUp: { from: string; to: string } | null;
};
