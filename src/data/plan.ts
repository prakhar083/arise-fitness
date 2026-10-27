// The workout plan transcribed from the user's current app (the DAYS constant in the prototype).

export type SetExercise = {
  kind: 'set';
  name: string;
  sets: number;
  repsScheme: string;
  restSec: number;
  note: string;
  /** Previous session as "kg/reps kg/reps …" — seeds the logger placeholders. */
  seedLog: string;
};
export type CardioExercise = { kind: 'cardio'; name: string; time: string; note: string };
export type Exercise = SetExercise | CardioExercise;
export type Superset = { kind: 'superset'; items: Exercise[] };
export type PlanItem = Exercise | Superset;
export type Section = { title: 'Warm Up' | 'Workout' | 'Cool Down'; items: PlanItem[] };
export type Day = { id: string; name: string; instructions: string; sections: Section[] };
export type Plan = { name: string; days: Day[] };

const S = (name: string, sets: number, repsScheme: string, restSec = 0, note = '', seedLog = ''): SetExercise => ({
  kind: 'set', name, sets, repsScheme, restSec, note, seedLog,
});
const C = (name: string, time: string, note = ''): CardioExercise => ({ kind: 'cardio', name, time, note });
const SS = (...items: Exercise[]): Superset => ({ kind: 'superset', items });
const H30 = '0/30 0/30';

export const PLAN: Plan = {
  name: 'Fat Loss & Strength Building',
  days: [
    { id: 'warm', name: 'Everyday Warm Up', instructions: "Don't start the workout without this on any single day", sections: [
      { title: 'Warm Up', items: [
        C('Walking On Treadmill', '06 min', 'Brisk walking (slightly inclined and fast walk)'),
        S('Neck Rotation', 1, '20', 0, '10 reps clockwise and 10 reps anti-clockwise', '0/20'),
        S('Arm Circle', 1, '30', 0, '15 reps clockwise and 15 reps anti-clockwise', '0/30'),
        S('Arm Crossover Chest Out', 1, '20', 0, 'Full stretch of the chest and full squeeze', '0/20'),
        S('Back Forward Leg Swings', 1, '30', 0, '15-15 reps with each leg, focus on lengthening the hamstrings', '0/30'),
        S('Dynamic Leg Swing', 1, '30', 0, '15-15 reps with each leg, sideways and focus on glutes', '0/30'),
        S('Bird Dog', 2, '12', 20, 'Slow and controlled, 6 reps with each side in every set', '0/12 0/12'),
        S('Scapula Push Up', 2, '10', 0, 'Slow and controlled, stretch at the top and squeeze at the bottom.', '0/10 0/10'),
      ] },
    ] },
    { id: 'legs', name: 'Beginners Legs', instructions: 'Do good leg stretches after the workout', sections: [
      { title: 'Warm Up', items: [S('Crossover Kneeling Hip Flexor Stretch', 2, '5', 0, '', '0/5 0/5'), S('90 To 90 Stretch', 2, '15', 0, '', '0/15 0/15')] },
      { title: 'Workout', items: [
        S('Bodyweight Squat', 3, '15-20 reps', 90, '', '0/15 0/15 0/15'),
        S('Smith Machine Chair Squat', 4, '15-12-10-8', 120, '', '5/15 10/12 10/7 15/7'),
        S('Incline 45 Degree Leg Press Machine', 4, '15-12-10-10', 90, '', '50/15 60/10'),
        S('Dumbbell Walking Lunges', 4, '12-10-8-8', 90, 'Try to increase weight in every set. Go till failure', '5/8 10/8'),
        S('Standing Calf Raises Smith Machine', 4, '15-15-12-12', 90, 'Focus on depth and reps. Do more reps but go till failure', '15/15 25/15 35/12 35/12'),
        S('Lying Leg Curl Machine', 4, '12-10-8-8', 90, '', '20/12 25/10 30/8 35/8'),
        S('High Plank With Hip Extension Stretch', 3, '60-90 sec hold', 60, '', '0/15 0/15'),
      ] },
      { title: 'Cool Down', items: [S('Hamstring Lying Straight Leg Stretch', 2, 'Hold 30 sec', 0, '', H30), S('Seated Cross Leg Glute Stretch', 2, 'Hold 30 sec', 0, '', H30)] },
    ] },
    { id: 'chest', name: 'Beginner Chest & Triceps', instructions: 'Do stretching at the end.', sections: [
      { title: 'Warm Up', items: [
        S('Dumbbell External Rotation', 2, '15-15', 60, 'Do this with cable or resistance band', '2/15 2/15'),
        S('Dumbbell Upright Shoulder External Rotation', 2, '15-15', 60, 'Do this with cable or resistance band', '2/15 2/15'),
      ] },
      { title: 'Workout', items: [
        S('Machine Chest Press Flat', 4, '15-12-12-10', 90, 'Focus on form and scapula retraction', '25/15 30/12 35/12 40/10'),
        S('Smith Machine Incline Bench Press', 4, '15-12-12-10', 90, 'Elbows tucked in, 30 degree incline, scapula retracted', '10/15 15/12 20/12 25/10'),
        S('Pec Deck Fly', 4, '15-12-10-10', 90, '', '25/15 27.5/12 32.5/10 37.5/10'),
        S('EZ-bar Skull Crushers', 4, '15-12-12-10', 90, '', '10/15 15/12 15/12 20/6'),
        S('Cable Pushdown', 4, '12-12-10-10', 90, '', '25/12 30/12 35/10 40/6'),
        S('Lying Straight Leg Raises', 3, '20-20-15', 30, 'Blow out completely on crunch', '0/20 0/12 0/10'),
        S('Cable Kneeling Crunch', 4, '20-20-15-15', 30, '', '20/20 25/20 30/15 35/15'),
        S('Incline Push-ups', 3, 'Till failure', 60, '', '0/10 0/10 0/8'),
      ] },
      { title: 'Cool Down', items: [
        S('Above Head Chest Stretch', 2, '30 sec hold', 0, '', H30),
        S('Across Chest Shoulder Stretch', 2, '30 sec hold', 0, '', H30),
        S('Bent Arm Chest Stretch', 2, '30 sec hold', 0, '', H30),
        C('Treadmill Running', '10 min', 'Run on incline treadmill'),
      ] },
    ] },
    { id: 'back', name: 'Beginner - Back, Biceps & Traps', instructions: '', sections: [
      { title: 'Warm Up', items: [
        S('Scapular Pull Ups', 2, '10', 30, 'Slow, controlled', '0/5 0/5'),
        S('Seated Cable Row V Bar Machine', 2, '15-20', 60, 'Light weight warm up, stretch and squeeze', '10/15 10/20'),
      ] },
      { title: 'Workout', items: [
        S('Lat Pulldown Shoulder Width', 4, '15-12-12-10', 90, '', '40/15 45/12 50/12 55/10'),
        S('Dumbbell One Arm Row (rack Support)', 4, '15-12-12-10', 90, '', '7.5/15 10/12 12.5/12 15/6'),
        S('Assisted Pull Up', 3, '10-10-10', 90, '', '70/10 60/10 55/8'),
        S('Seated Cable Row V Bar Machine', 4, '12-10-8-8', 90, "Slow controlled, don't drop scapula", '10/15 10/20'),
        S('Reverse Machine Fly', 4, '15-12-12-10', 90, '', '15/15 20/12 25/12 27.5/10'),
        S('Dumbbell Rear Full Shrugs', 4, '10-10-8-8', 90, '', '15/15 15/10 20/8 20/8'),
        S('Barbell Bicep Curl Normal Grip', 3, '15-12-10', 0, '30-40 reps with 10-15 kg rod', '15/15 15/12 15/7'),
      ] },
      { title: 'Cool Down', items: [
        C('Walking On Treadmill', '10 min', 'Incline walk on treadmill or any other place with decent pace'),
        S('Cobra Full Push Up', 2, '5-10', 0, '', '0/5'),
        S('Child Pose Up', 2, '5-10', 0, '', '0/5'),
        S('Hamstring Lying Straight Leg Stretch', 2, '5-10', 0, '', '0/5 0/5'),
      ] },
    ] },
    { id: 'circuit', name: 'Beginner Circuit + Mobility Training', instructions: 'Keep breathing while stretching and try stretching a little bit extra every time you exhale.', sections: [
      { title: 'Workout', items: [SS(
        S('Sit-ups', 3, '15', 0, '', '0/15 0/15 0/15'),
        S('Lying Leg Raise', 3, '15-20', 0, '', '0/12 0/10 0/12'),
        S('High Plank With Hip Extension Stretch', 3, '60 sec hold', 0, '', '0/30 0/30 0/30'),
        C('Jumping Jack', '20 sec'),
        S('Brazilian Crunches', 3, '15-20 reps', 0, '1 circuit has all five exercises with no rest in between', '0/15 0/15 0/15'),
      )] },
      { title: 'Cool Down', items: [
        S('Across Chest Shoulder Stretch', 2, '30 sec hold', 0, '', H30),
        S('Adductor Stretch', 2, '30 sec hold', 0, '', H30),
        S('All Fours Quad Stretch', 2, '30 sec hold', 0, '', H30),
        S('Butterfly Yoga Pose', 2, '30 sec hold', 0, '', H30),
        S('Feet And Ankles Stretch', 2, '30 sec hold', 0, '', H30),
        S('Kneeling Back Rotation Stretch', 2, '15 each side', 0, '', '0/15 0/15'),
        S('Plyo Side Lunge', 2, '10 reps, 10 sec hold', 0, '', '0/10 0/10'),
        S('90 To 90 Stretch', 2, '15 each side', 0, '', '0/15 0/15'),
        C('Cross Trainer', '15 min'),
      ] },
    ] },
    { id: 'shoulders', name: 'Beginners Shoulders', instructions: 'Do shoulder stretching', sections: [
      { title: 'Warm Up', items: [
        S('Scapular Pull Ups', 2, '10', 30, 'Slow, controlled', '0/6 0/3'),
        S('Dumbbell External Rotation', 2, '10-15', 0, 'Do with cables or resistance band', '2.5/15 2.5/15'),
        S('Dumbbell Upright Shoulder External Rotation', 2, '10-15', 0, 'Do with cables or resistance band', '2.5/15 2.5/15'),
      ] },
      { title: 'Workout', items: [
        S('Smith Machine Seated Shoulder Press', 4, '15-12-10-10', 90, 'Slow, controlled and can be done on shoulder press machine as well', '10/15 15/12 20/5 20/5'),
        S('Dumbbell Seated Shoulder Press', 4, '12-10-10-8', 90, 'Full power, full range of motion, bring the dumbbells near the shoulders', '7.5/12 10/10 10/10 12.5/8'),
        SS(S('Dumbbell Lateral Raises', 3, '15-12-10', 0, '', '2.5/15 3/12 3/10'), S('Cable Front Raise', 3, '12-10-10', 90, '', '10/12 10/10 10/8')),
        S('Cable Upright Row With Ez Bar', 3, '15-12-10', 90, '', '10/15 15/12 15/10'),
        C('Treadmill Running', '07 min, 30 sec', 'EPOC: 20 seconds of sprint at full speed, then walk to recover. Repeat.'),
      ] },
      { title: 'Cool Down', items: [
        S('Front Shoulder Stretch With Bar', 2, '15-20', 30, '', '0/15 0/15'),
        S('Shoulder Stretch', 2, '15-20', 30, '', '0/15 0/15'),
      ] },
    ] },
    { id: 'arms', name: 'Beginners Arms - Build those GUNS!', instructions: '', sections: [
      { title: 'Warm Up', items: [C('Circle Elbow Arm', '02 min', 'Reps 30')] },
      { title: 'Workout', items: [
        S('Dumbbell Seated Triceps Extension', 4, '15-12-12-10', 90, '', '7.5/15 10/12 12.5/12 15/10'),
        S('EZ-bar Skull Crushers', 4, '15-12-12-10', 90, '', '10/15 10/12 15/12 15/7'),
        S('Cable Triceps Pushdown', 3, '12-10-10-8', 90, '', '30/12 30/10 35/10'),
        S('Dumbbell Incline Alternate Bicep Curl', 4, '12-10-8-8', 90, '', '5/15 7.5/10 10/8 10/8'),
        S('Alternate Hammer Curl Standing Dumbbells', 4, '12-10-10-8', 0, '', '7.5/12 7.5/10 7.5/10 10/8'),
        S('Cable Single Arm Curl', 3, 'Till Failure', 0, 'No rest in between', '5/22 10/10 15/5'),
        S('Abdominal Crunches With Hold', 4, '15', 30, 'Focus on breathing and breathe out when you go up', '0/15 0/15'),
        S('Lying Leg Raise', 4, '20-15-15-15', 30, ''),
        C('Walking On Treadmill', '10 min', 'Brisk walk'),
      ] },
      { title: 'Cool Down', items: [
        S('Triceps Light Stretch', 2, '30 sec hold', 30, '', '0/1 0/1'),
        S('Kneeling Triceps Extension Stretch', 2, '30 sec hold', 30, '', '0/1 0/1'),
      ] },
    ] },
  ],
};

/** Weekday (0 = Sun) → scheduled day id. Sunday is a rest day (the Everyday Warm Up is today's quest). */
export const SCHEDULE: Record<number, string> = { 1: 'legs', 2: 'chest', 3: 'back', 4: 'circuit', 5: 'shoulders', 6: 'arms' };

export const dayById = (id: string) => PLAN.days.find(d => d.id === id)!;

/** The day the "Today's workout" quest points at (warm-up on rest days). */
export const scheduledDayFor = (date: Date) => dayById(SCHEDULE[date.getDay()] ?? 'warm');
export const isScheduledWorkoutDay = (date: Date) => SCHEDULE[date.getDay()] != null;

export const shortDayName = (d: Day) =>
  d.name.replace('Beginners ', '').replace('Beginner - ', '').replace('Beginner ', '');

/** Stable key for an exercise position within a day. */
export const exerciseKey = (dayId: string, sectionIdx: number, itemIdx: number) => `${dayId}-${sectionIdx}-${itemIdx}`;

/** Flatten a section into exercises with their keys (superset members get consecutive indices). */
export const flattenSection = (day: Day, si: number) => {
  const out: { key: string; ex: Exercise }[] = [];
  let i = 0;
  for (const it of day.sections[si].items) {
    for (const ex of it.kind === 'superset' ? it.items : [it]) out.push({ key: exerciseKey(day.id, si, i++), ex });
  }
  return out;
};

export const countExercises = (day: Day) =>
  day.sections.reduce((a, _s, si) => a + flattenSection(day, si).length, 0);

export const fmtRest = (s: number) => {
  if (!s) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const m = Math.floor(s / 60), r = s % 60;
  if (!m) return r + ' sec';
  return pad(m) + ' min' + (r ? ', ' + r + ' sec' : '');
};

/** Parse a seed log string into per-set previous values. */
export const parseSeedLog = (log: string) =>
  log ? log.split(' ').map(p => { const [kg = '', reps = ''] = p.split('/'); return { kg, reps }; }) : [];
