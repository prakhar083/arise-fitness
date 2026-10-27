import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Frost, SubHeader } from '../components/Chrome';
import { BlockCard, buildBlocks, ExerciseHeader, InstructionsCard, SectionTitle, type BlockItem } from '../components/Exercises';
import { Input } from '../components/Field';
import { Icon } from '../components/Icon';
import { Toast } from '../components/Overlays';
import { Btn, BtnLabel, T } from '../components/ui';
import { dayById } from '../data/plan';
import { mmss, pad2, useNow } from '../hooks/useNow';
import { MON3 } from '../store/derived';
import { sessionElapsedMs, sessionTotals, useGame } from '../store/useGame';
import { alpha, colors, font, mix, radius, shadow } from '../theme/tokens';

const CheckButton = ({ done, onPress, label }: { done: boolean; onPress: () => void; label: string }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="checkbox"
    accessibilityState={{ checked: done }}
    accessibilityLabel={label}
    hitSlop={4}
    style={{
      width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
      borderColor: done ? colors.accent : colors.n700,
      backgroundColor: done ? alpha(colors.accent, 25) : 'transparent',
      boxShadow: done ? `0 0 10px ${alpha(colors.accent, 50)}` : undefined,
    }}
  >
    <Icon name="check" size={16} weight="bold" color={done ? colors.a100 : colors.n600} />
  </Pressable>
);

/** 40px field with a right-aligned value and a unit suffix; previous value shows as the placeholder. */
const UnitField = ({ value, placeholder, unit, onChangeText, disabled, numeric }:
  { value: string; placeholder: string; unit: string; onChangeText: (v: string) => void; disabled?: boolean; numeric?: boolean }) => (
  <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', height: 40, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.n800 }}>
    <TextInput
      value={value}
      placeholder={placeholder}
      placeholderTextColor={colors.n600}
      onChangeText={onChangeText}
      editable={!disabled}
      keyboardType={numeric ? 'number-pad' : 'decimal-pad'}
      keyboardAppearance="dark"
      selectionColor={colors.accent}
      style={{ flex: 1, minWidth: 0, textAlign: 'right', fontFamily: font.regular, fontSize: 14, color: colors.text, padding: 0 }}
    />
    {unit ? <T size={12} color={colors.n500} style={{ marginLeft: 6 }}>{unit}</T> : null}
  </View>
);

const LogExercise = ({ item }: { item: BlockItem }) => {
  const { key, ex } = item;
  const rows = useGame(s => s.session?.sets[key]);
  const bw = useGame(s => !!s.session?.bodyweight[key]);
  const cardio = useGame(s => s.session?.cardio[key]);
  const a = useGame.getState();

  return (
    <View style={{ gap: 8, paddingVertical: 12, borderTopWidth: 1, borderTopColor: item.first ? 'transparent' : colors.n800 }}>
      <ExerciseHeader item={item} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <T size={12} color={colors.n400} style={{ flex: 1, lineHeight: 17 }}>{ex.note}</T>
        {ex.kind === 'set' ? (
          <Pressable onPress={() => a.toggleBodyweight(key)} accessibilityRole="checkbox" accessibilityState={{ checked: bw }} accessibilityLabel="Bodyweight"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} hitSlop={6}>
            <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: bw ? colors.accent : colors.n600, backgroundColor: bw ? colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {bw ? <Icon name="check" size={12} weight="bold" color={colors.bg} /> : null}
            </View>
            <T size={12} color={colors.n400}>BW</T>
          </Pressable>
        ) : null}
      </View>

      {ex.kind === 'set' && rows ? (
        <View style={{ gap: 8 }}>
          {rows.map((r, j) => (
            <View key={j} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: r.done ? 0.65 : 1 }}>
              <T size={12} color={colors.n400} tabular style={{ width: 20 }}>{pad2(j + 1)}</T>
              <UnitField
                value={bw ? '' : r.kg} placeholder={bw ? 'BW' : r.prevKg || '—'} unit={bw ? '' : 'kg'} disabled={bw}
                onChangeText={v => a.updateSet(key, j, { kg: v })}
              />
              <UnitField value={r.reps} placeholder={r.prevReps || '—'} unit="Reps" numeric onChangeText={v => a.updateSet(key, j, { reps: v })} />
              <CheckButton done={r.done} label={`Set ${j + 1} done`} onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                a.toggleSetDone(key, j, ex.restSec);
              }} />
            </View>
          ))}
          <Btn variant="secondary" block height={40} onPress={() => a.addSet(key)}>
            <Icon name="plus" size={14} color={colors.text} />
            <T size={14} weight={500}>Add set</T>
          </Btn>
        </View>
      ) : null}

      {ex.kind === 'cardio' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Input placeholder="Reps" keyboardType="number-pad" value={cardio?.reps ?? ''} onChangeText={v => a.updateCardio(key, { reps: v })}
            style={{ flex: 1, minWidth: 0, height: 40, textAlign: 'center', fontSize: 13, borderColor: colors.n800 }} />
          <Input placeholder={'00:' + ((ex.time.match(/\d+/) ?? ['00'])[0]).padStart(2, '0') + ':00'} value={cardio?.time ?? ''} onChangeText={v => a.updateCardio(key, { time: v })}
            keyboardType="numbers-and-punctuation" style={{ flex: 1.2, minWidth: 0, height: 40, textAlign: 'center', fontSize: 13, borderColor: colors.n800 }} />
          <Input placeholder="BPM" keyboardType="number-pad" value={cardio?.bpm ?? ''} onChangeText={v => a.updateCardio(key, { bpm: v })}
            style={{ flex: 1, minWidth: 0, height: 40, textAlign: 'center', fontSize: 13, borderColor: colors.n800 }} />
          <CheckButton done={!!cardio?.done} label={`${ex.name} done`} onPress={() => a.toggleCardioDone(key)} />
        </View>
      ) : null}
    </View>
  );
};

const RestBar = () => {
  const insets = useSafeAreaInsets();
  const restEndsAt = useGame(s => s.session?.restEndsAt ?? null);
  const a = useGame.getState();
  const now = useNow(250);
  const left = restEndsAt ? Math.ceil((restEndsAt - now) / 1000) : 0;
  const fired = useRef<number | null>(null);
  useEffect(() => {
    if (restEndsAt && left <= 0 && fired.current !== restEndsAt) {
      fired.current = restEndsAt;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      a.skipRest();
    }
  }, [left, restEndsAt, a]);
  if (!restEndsAt || left <= 0) return null;
  return (
    <View style={{
      position: 'absolute', left: 14, right: 14, bottom: 28 + insets.bottom / 2, zIndex: 20, flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.a700, overflow: 'hidden',
      boxShadow: `${shadow.md}, 0 0 24px ${alpha(colors.accent, 25)}`,
    }}>
      <Frost tint={92} style={{ backgroundColor: 'transparent' }} />
      <View style={{ position: 'absolute', inset: 0, backgroundColor: alpha(colors.surface, 92) }} />
      <View style={{ flex: 1, gap: 2 }}>
        <T size={10} spacing={0.16} color={colors.a300}>REST · RECOVERING MP</T>
        <T size={24} tabular>{mmss(left)}</T>
      </View>
      <Btn variant="secondary" height={34} onPress={() => a.adjustRest(-15)}><T size={14} weight={500}>−15</T></Btn>
      <Btn variant="secondary" height={34} onPress={() => a.adjustRest(15)}><T size={14} weight={500}>+15</T></Btn>
      <Btn variant="primary" height={34} onPress={a.skipRest} style={{ paddingHorizontal: 12 }}>Skip</Btn>
    </View>
  );
};

export default function LoggerScreen() {
  const insets = useSafeAreaInsets();
  const session = useGame(s => s.session);
  const autoRest = useGame(s => s.autoRest);
  const a = useGame.getState();
  const now = useNow();
  const day = session ? dayById(session.dayId) : null;
  const secs = useMemo(() => (day ? buildBlocks(day) : []), [day]);

  useEffect(() => { if (!session && !useGame.getState().summary) router.replace('/train'); }, [session]);
  if (!session || !day) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const paused = session.runningSince == null;
  const elapsed = Math.floor(sessionElapsedMs(session, now) / 1000);
  const totals = sessionTotals(session);
  const d = new Date(now);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHeader
        title={day.name}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/train'))}
        right={(
          <>
            <Pressable onPress={a.togglePause} accessibilityRole="button" accessibilityLabel={paused ? 'Resume timer' : 'Pause timer'}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.surface, boxShadow: shadow.sm }}>
              <T size={14} tabular>{mmss(elapsed)}</T>
              <Icon name={paused ? 'play' : 'pause'} size={14} weight="fill" color={colors.text} />
            </Pressable>
            <Btn variant="ghost" icon accessibilityLabel="Auto rest timer" onPress={a.toggleAutoRest}>
              <Icon name="timer" size={20} color={colors.accent} weight={autoRest ? 'fill' : 'regular'} />
            </Btn>
          </>
        )}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 16, paddingTop: 14, paddingHorizontal: 14, paddingBottom: 110 + insets.bottom }}>
          {secs.map(sec => (
            <View key={sec.title} style={{ gap: 10 }}>
              <SectionTitle>{sec.title}</SectionTitle>
              {sec.blocks.map(b => (
                <BlockCard key={b.items[0].key} block={b} bg={mix(colors.surface, 70, colors.bg)}>
                  {b.items.map(it => <LogExercise key={it.key} item={it} />)}
                </BlockCard>
              ))}
            </View>
          ))}
          {day.instructions ? <InstructionsCard text={day.instructions} /> : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}><Icon name="calendar-blank" size={12} color={colors.n400} /><T size={12} color={colors.n400}>Date</T></View>
              <Input editable={false} value={`${d.getDate()} ${MON3[d.getMonth()]}, ${d.getFullYear()}`} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}><Icon name="clock" size={12} color={colors.n400} /><T size={12} color={colors.n400}>Time</T></View>
              <Input editable={false} value={`${pad2(d.getHours())}:${pad2(d.getMinutes())}`} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 }}>
            <T size={12} color={colors.n400}>{totals.doneSets} / {totals.totalSets} sets cleared</T>
            <T size={12} color={colors.n400}>{totals.volume.toLocaleString()} kg volume</T>
          </View>
          <Btn variant="primary" block height={48} glow onPress={() => { a.finishSession(); router.replace('/complete'); }}>
            <BtnLabel size={15}>Complete workout</BtnLabel>
          </Btn>
        </ScrollView>
      </KeyboardAvoidingView>
      <RestBar />
      <Toast bottom={110} />
    </View>
  );
}
