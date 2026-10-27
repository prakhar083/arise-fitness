import { router } from 'expo-router';
import { View } from 'react-native';
import { scheduledDayFor } from '../data/plan';
import { fmtL } from '../game/rules';
import { useGame, useToday } from '../store/useGame';
import { colors } from '../theme/tokens';
import { Icon, type IconName } from './Icon';

export type QuestView = {
  id: 'steps' | 'workout' | 'water';
  icon: IconName;
  done: boolean;
  title: string;
  prog: string;
  pct: number;
  sub: string;
  actions: { label: string; onPress: () => void }[];
};

/** The three daily quests, shared by Status and Quests. */
export const useQuestViews = (): QuestView[] => {
  const stepSource = useGame(s => s.stepSource);
  const d = useToday();
  const goal = useGame(s => s.goal);
  const addManualSteps = useGame(s => s.addManualSteps);
  const addWater = useGame(s => s.addWater);
  const startSession = useGame(s => s.startSession);
  const todayDay = scheduledDayFor(new Date());
  const stepsDone = d.steps >= goal.stepsGoal;
  const waterDone = d.waterL >= goal.waterGoalL - 1e-9;
  return [
    {
      id: 'steps', icon: stepsDone ? 'check-circle' : 'footprints', done: stepsDone,
      title: `${goal.stepsGoal / 1000}K Steps`,
      prog: `${Math.min(d.steps, goal.stepsGoal).toLocaleString()}/${goal.stepsGoal.toLocaleString()}`,
      pct: (d.steps / goal.stepsGoal) * 100,
      sub: stepSource === 'health' ? 'Synced from Apple Health' : stepSource === 'motion' ? 'Synced from Motion & Fitness' : 'Add steps manually',
      actions: [{ label: '+1,500', onPress: () => addManualSteps(1500) }],
    },
    {
      id: 'workout', icon: d.workoutDone ? 'check-circle' : 'barbell', done: d.workoutDone,
      title: "Today's workout", prog: `${d.workoutDone ? 1 : 0}/1`, pct: d.workoutDone ? 100 : 0, sub: todayDay.name,
      actions: d.workoutDone ? [] : [{
        label: 'Start',
        onPress: () => {
          const active = useGame.getState().session;
          if (!active || active.dayId !== todayDay.id) startSession(todayDay.id);
          router.push('/logger');
        },
      }],
    },
    {
      id: 'water', icon: waterDone ? 'check-circle' : 'drop', done: waterDone,
      title: `${goal.waterGoalL}L Water`, prog: `${fmtL(d.waterL)}/${goal.waterGoalL} L`,
      pct: (d.waterL / goal.waterGoalL) * 100, sub: '250 ml per glass',
      actions: [{ label: '−', onPress: () => addWater(-0.25) }, { label: '+ Glass', onPress: () => addWater(0.25) }],
    },
  ];
};

export const QuestIcon = ({ q, size = 18 }: { q: QuestView; size?: number }) => (
  <View>
    <Icon name={q.icon} size={size} color={q.done ? colors.accent : colors.n500} weight={q.done ? 'fill' : 'regular'} />
  </View>
);
