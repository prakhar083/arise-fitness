import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { goBack } from '../components/Chrome';
import { Field } from '../components/Field';
import { Icon } from '../components/Icon';
import { SubScreen } from '../components/SubScreen';
import { Btn, BtnLabel, ImageSlot, T } from '../components/ui';
import { dateKey } from '../game/rules';
import type { CheckIn } from '../game/types';
import { pad2 } from '../hooks/useNow';
import { MON3, useJourney } from '../store/derived';
import { useGame } from '../store/useGame';
import { colors, radius } from '../theme/tokens';

type Form = Record<'weight' | 'waist' | 'hip' | 'biceps' | 'thighs' | 'sleepH' | 'water' | 'workouts' | 'cal' | 'milestone' | 'support', string>
  & { sleepQ?: number; rate?: number; photos: CheckIn['photos'] };

const num = (s: string) => { const v = parseFloat(s.replace(',', '.')); return Number.isFinite(v) ? v : undefined; };

const Scale = ({ label, value, onChange }: { label: string; value?: number; onChange: (n: number) => void }) => (
  <View style={{ gap: 8 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <T size={13} color={colors.n300}>{label}</T>
      <T size={13} color={colors.danger70}>*</T>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
        const on = value === n;
        return (
          <Pressable key={n} onPress={() => onChange(n)} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${label} ${n}`}
            style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.a600, backgroundColor: on ? colors.a700 : 'transparent' }}>
            <T size={12} color={on ? colors.a100 : colors.a300}>{n}</T>
          </Pressable>
        );
      })}
    </View>
  </View>
);

export default function CheckInScreen() {
  const j = useJourney();
  const checkIns = useGame(s => s.checkIns);
  const submit = useGame(s => s.submitCheckIn);
  const last = checkIns[checkIns.length - 1];
  const now = new Date();
  const [f, setF] = useState<Form>({
    weight: '', waist: '', hip: '', biceps: '', thighs: '', sleepH: last?.sleepH != null ? String(last.sleepH) : '7',
    water: '', workouts: last?.workouts != null ? String(last.workouts) : '5', cal: '', milestone: '', support: '', photos: {},
  });
  const set = (k: keyof Form) => (v: string) => setF(s => ({ ...s, [k]: v }));
  const lastPh = (v?: number) => (v != null ? `Last: ${v}` : '');

  const pick = async (slot: 'front' | 'back' | 'side') => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [3, 4] });
    if (!res.canceled) setF(s => ({ ...s, photos: { ...s.photos, [slot]: res.assets[0].uri } }));
  };

  const onSubmit = () => {
    const ci: CheckIn = {
      date: dateKey(now), time: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`, weight: num(f.weight) ?? 0,
      waist: num(f.waist), hip: num(f.hip), biceps: num(f.biceps), thighs: num(f.thighs), sleepH: num(f.sleepH),
      sleepQuality: f.sleepQ, waterL: num(f.water), workouts: num(f.workouts), workoutRating: f.rate,
      calories: f.cal || undefined, milestones: f.milestone || undefined, support: f.support || undefined, photos: f.photos,
    };
    if (submit(ci)) goBack();
  };

  return (
    <SubScreen title="Weekly Check-in">
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.md, boxShadow: `inset 0 0 0 1px ${colors.a700}` }}>
        <Icon name="scales" size={16} color={colors.accent} style={{ marginTop: 2 }} />
        <T size={13} color={colors.n300} style={{ flex: 1, lineHeight: 19 }}>
          {j.next != null ? <>Weigh in at or below <T size={13} weight={500} color={colors.a200}>{j.next.toFixed(1)} kg</T> to clear the next Weight Gate and level up.</> : 'Every Weight Gate is cleared. Keep logging to hold the line.'}
        </T>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Field small label="Date" editable={false} value={`${now.getDate()} ${MON3[now.getMonth()]}, ${now.getFullYear()}`} style={{ flex: 1 }} />
        <Field small label="Time" editable={false} value={`${pad2(now.getHours())}:${pad2(now.getMinutes())}`} style={{ flex: 1 }} />
      </View>

      <Field label="Weight - kg" required keyboardType="decimal-pad" value={f.weight} onChangeText={set('weight')} placeholder={`Last: ${j.cur}`} />
      <Field label="Waist (abdomen) - cm" required keyboardType="decimal-pad" value={f.waist} onChangeText={set('waist')} placeholder={lastPh(last?.waist)} />
      <Field label="Hip - cm" required keyboardType="decimal-pad" value={f.hip} onChangeText={set('hip')} placeholder={lastPh(last?.hip)} />
      <Field label="Biceps - cm" keyboardType="decimal-pad" value={f.biceps} onChangeText={set('biceps')} placeholder={lastPh(last?.biceps)} />
      <Field label="Thighs - cm" keyboardType="decimal-pad" value={f.thighs} onChangeText={set('thighs')} placeholder={lastPh(last?.thighs)} />
      <Field label="Average hours of sleep per night" required keyboardType="decimal-pad" value={f.sleepH} onChangeText={set('sleepH')} />
      <Field label="Average water intake per day (L)" keyboardType="decimal-pad" value={f.water} onChangeText={set('water')} />
      <Field label="Workouts completed this week" required keyboardType="number-pad" value={f.workouts} onChangeText={set('workouts')} />

      <Scale label="Sleep quality (1-10)" value={f.sleepQ} onChange={n => setF(s => ({ ...s, sleepQ: n }))} />
      <Scale label="Rate your workouts (1-10)" value={f.rate} onChange={n => setF(s => ({ ...s, rate: n }))} />

      <Field label="Average daily calories & protein" required value={f.cal} onChangeText={set('cal')} placeholder="e.g. 1900 kcal, 130 g" />
      <Field label="Milestones reached this week?" value={f.milestone} onChangeText={set('milestone')} placeholder="Describe any wins" />
      <Field label="What would help you more?" value={f.support} onChangeText={set('support')} />

      <View style={{ gap: 8 }}>
        <T size={13} color={colors.n300}>Progress photos</T>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['front', 'back', 'side'] as const).map(slot => (
            <Pressable key={slot} onPress={() => pick(slot)} style={{ flex: 1, gap: 4 }} accessibilityRole="button" accessibilityLabel={`Add ${slot} photo`}>
              <ImageSlot height={120} width="100%">
                {f.photos[slot]
                  ? <Image source={{ uri: f.photos[slot] }} style={{ width: '100%', height: '100%' }} />
                  : <View style={{ alignItems: 'center', gap: 4 }}><Icon name="camera" size={20} color={colors.n600} /><T size={11} color={colors.n600}>{slot[0].toUpperCase() + slot.slice(1)}</T></View>}
              </ImageSlot>
              <T size={11} color={colors.n500}>{slot[0].toUpperCase() + slot.slice(1)}</T>
            </Pressable>
          ))}
        </View>
      </View>

      <Btn variant="primary" block height={48} onPress={onSubmit}>
        <BtnLabel size={15}>Submit check-in</BtnLabel>
      </Btn>
    </SubScreen>
  );
}
