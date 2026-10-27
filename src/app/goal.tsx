import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { goBack } from '../components/Chrome';
import { Field, Input } from '../components/Field';
import { Icon, type IconName } from '../components/Icon';
import { SubScreen } from '../components/SubScreen';
import { Btn, BtnLabel, Segmented, T } from '../components/ui';
import { dateKey, gatesFor, parseDate, startOfDay } from '../game/rules';
import type { Goal } from '../game/types';
import { longDate } from '../store/derived';
import { useGame } from '../store/useGame';
import { colors, radius } from '../theme/tokens';

const QuestRow = ({ icon, label, children }: { icon: IconName; label: string; children: React.ReactNode }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: colors.surface }}>
    <Icon name={icon} size={18} color={colors.accent} />
    <T size={14} style={{ flex: 1 }}>{label}</T>
    {children}
  </View>
);

export default function GoalScreen() {
  const goal = useGame(s => s.goal);
  const goalSet = useGame(s => s.goalSet);
  const saveGoal = useGame(s => s.saveGoal);
  const showToast = useGame(s => s.showToast);
  const [f, setF] = useState({
    start: goalSet ? String(goal.startKg) : '', target: goalSet ? String(goal.targetKg) : '', date: goal.endDate, event: goal.eventName,
    step: goal.gateStepKg, steps: String(goal.stepsGoal), water: String(goal.waterGoalL),
  });
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');
  const startKg = parseFloat(f.start), targetKg = parseFloat(f.target);
  const gateCount = gatesFor({ startKg, targetKg, gateStepKg: f.step }).length;

  const onSave = () => {
    const steps = parseInt(f.steps, 10), water = parseFloat(f.water);
    if (!(startKg > 0) || !(targetKg > 0) || targetKg >= startKg) return showToast('Target must be below your starting weight');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date) || parseDate(f.date) <= startOfDay(new Date())) return showToast('Pick an end date in the future');
    if (!(steps > 0) || !(water > 0)) return showToast('Set your daily step and water targets');
    const next: Goal = { ...goal, startKg, targetKg, endDate: f.date, eventName: f.event.trim(), gateStepKg: f.step, stepsGoal: steps, waterGoalL: water };
    saveGoal(next);
    if (goalSet) goBack();
    else router.replace('/');
  };

  return (
    <SubScreen title={goalSet ? 'Goal Setup' : 'Set your gate'} hideBack={!goalSet}>
      <T size={13} color={colors.n400} style={{ lineHeight: 19 }}>
        Set the gate: a target weight, a closing date and the event it leads to. The System builds your Weight Gates and daily quests from this.
      </T>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Field small label="Starting weight (kg)" keyboardType="decimal-pad" placeholder="e.g. 94" value={f.start} onChangeText={v => setF(s => ({ ...s, start: v }))} style={{ flex: 1 }} />
        <Field small label="Target weight (kg)" keyboardType="decimal-pad" placeholder="e.g. 84" value={f.target} onChangeText={v => setF(s => ({ ...s, target: v }))} style={{ flex: 1 }} />
      </View>

      <View style={{ gap: 4 }}>
        <T size={12} color={colors.n400}>End date</T>
        {Platform.OS === 'web' ? (
          <Input value={f.date} placeholder="YYYY-MM-DD" onChangeText={v => setF(s => ({ ...s, date: v }))} />
        ) : (
          <>
            {Platform.OS === 'android' ? (
              <Pressable onPress={() => setShowPicker(true)}>
                <Input editable={false} pointerEvents="none" value={longDate(f.date)} />
              </Pressable>
            ) : null}
            {showPicker ? (
              <View style={Platform.OS === 'ios' ? { alignItems: 'flex-start', paddingVertical: 4, paddingHorizontal: 4, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider } : undefined}>
                <DateTimePicker
                  value={parseDate(f.date)} mode="date" display={Platform.OS === 'ios' ? 'compact' : 'default'}
                  themeVariant="dark" accentColor={colors.accent} minimumDate={new Date()}
                  onValueChange={(_e, d) => {
                    if (Platform.OS === 'android') setShowPicker(false);
                    setF(s => ({ ...s, date: dateKey(d) }));
                  }}
                  onDismiss={() => setShowPicker(Platform.OS === 'ios')}
                />
              </View>
            ) : null}
          </>
        )}
      </View>

      <Field small label="Event on that date (optional)" value={f.event} placeholder="e.g. Birthday" onChangeText={v => setF(s => ({ ...s, event: v }))} />

      <View style={{ gap: 6 }}>
        <T size={12} color={colors.n400}>Weight Gate every</T>
        <Segmented stretch options={[1, 2, 5].map(n => ({ label: `${n} kg`, value: n as 1 | 2 | 5 }))} value={f.step} onChange={v => setF(s => ({ ...s, step: v }))} />
        <T size={12} color={colors.n500}>{gateCount ? `${gateCount} gates between ${f.start} and ${f.target} kg · each clears +1 level` : 'Enter your weights to see your Weight Gates'}</T>
      </View>

      <View style={{ gap: 8 }}>
        <T size={12} color={colors.n400}>Daily quests</T>
        <QuestRow icon="footprints" label="Steps">
          <Input keyboardType="number-pad" value={f.steps} onChangeText={v => setF(s => ({ ...s, steps: v }))} style={{ width: 90, textAlign: 'right' }} />
        </QuestRow>
        <QuestRow icon="drop" label="Water (L)">
          <Input keyboardType="decimal-pad" value={f.water} onChangeText={v => setF(s => ({ ...s, water: v }))} style={{ width: 90, textAlign: 'right' }} />
        </QuestRow>
        <QuestRow icon="barbell" label="Today's workout">
          <T size={13} color={colors.n400}>From plan</T>
        </QuestRow>
      </View>

      <Btn variant="primary" block height={48} onPress={onSave}>
        <BtnLabel size={15}>{goalSet ? 'Save goal' : 'Open the gate'}</BtnLabel>
      </Btn>
    </SubScreen>
  );
}
