import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Frost, TAB_BAR_HEIGHT } from '../../components/Chrome';
import { BlockCard, buildBlocks, InstructionsCard, PlanExercise, SectionTitle } from '../../components/Exercises';
import { Icon } from '../../components/Icon';
import { Btn, BtnLabel, T } from '../../components/ui';
import { countExercises, dayById, PLAN, scheduledDayFor } from '../../data/plan';
import { useGame } from '../../store/useGame';
import { alpha, colors, radius } from '../../theme/tokens';

export default function TrainScreen() {
  const insets = useSafeAreaInsets();
  const todayId = scheduledDayFor(new Date()).id;
  const [dayId, setDayId] = useState(todayId);
  const day = dayById(dayId);
  const secs = useMemo(() => buildBlocks(day), [day]);
  const startSession = useGame(s => s.startSession);
  const scrollRef = useRef<ScrollView>(null);
  const tabsRef = useRef<ScrollView>(null);

  const enter = () => {
    const active = useGame.getState().session;
    if (!active || active.dayId !== dayId) startSession(dayId);
    router.push('/logger');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 6, paddingBottom: 12, paddingHorizontal: 18 }}>
        <T size={20} weight={500} style={{ flex: 1 }}>{PLAN.name}</T>
        <Icon name="caret-down" size={14} color={colors.n400} />
        <Btn variant="ghost" icon accessibilityLabel="Calendar" onPress={() => router.navigate('/calendar')}>
          <Icon name="calendar-blank" size={20} color={colors.accent} />
        </Btn>
      </View>

      {/* Day tabs */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.n800 }}>
        <ScrollView ref={tabsRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4, paddingHorizontal: 12 }}>
          {PLAN.days.map(d => {
            const on = d.id === dayId;
            return (
              <Pressable key={d.id} onPress={() => { setDayId(d.id); scrollRef.current?.scrollTo({ y: 0, animated: false }); }}
                accessibilityRole="tab" accessibilityState={{ selected: on }}
                onLayout={e => {
                  // Bring today's tab into view on first layout.
                  if (d.id === todayId) tabsRef.current?.scrollTo({ x: Math.max(0, e.nativeEvent.layout.x - 12), animated: false });
                }}
                style={{ paddingTop: 10, paddingBottom: 9, paddingHorizontal: 8, borderBottomWidth: 2, borderBottomColor: on ? colors.accent : 'transparent', gap: 2 }}>
                <T size={13} color={on ? colors.a200 : colors.n400}>{d.name}</T>
                <T size={9} spacing={0.14} color={colors.a300}>{d.id === todayId ? 'TODAY' : ' '}</T>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 14, paddingTop: 14, paddingHorizontal: 16, paddingBottom: TAB_BAR_HEIGHT + 84 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.md, boxShadow: `inset 0 0 0 1px ${colors.a700}`, backgroundColor: alpha(colors.a900, 35) }}>
          <Icon name="door-open" size={16} color={colors.accent} />
          <T size={13} color={colors.n300} style={{ flex: 1 }}>Clear this dungeon</T>
          <T size={13} color={colors.a200}>+300 EXP · {countExercises(day)} exercises</T>
        </View>
        {secs.map(sec => (
          <View key={sec.title} style={{ gap: 8 }}>
            <SectionTitle>{sec.title}</SectionTitle>
            {sec.blocks.map(b => (
              <BlockCard key={b.items[0].key} block={b}>
                {b.items.map(it => <PlanExercise key={it.key} item={it} />)}
              </BlockCard>
            ))}
          </View>
        ))}
        {day.instructions ? <InstructionsCard text={day.instructions} /> : null}
      </ScrollView>

      {/* Sticky CTA */}
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: TAB_BAR_HEIGHT + 12 }}>
        <View style={{ borderRadius: radius.md, overflow: 'hidden', position: 'absolute', inset: 0 }}>
          <Frost tint={85} intensity={30} />
        </View>
        <Btn variant="primary" block height={48} glow onPress={enter}>
          <Icon name="sword" size={16} color={colors.accent} />
          <BtnLabel size={15}>Enter dungeon · Log this workout</BtnLabel>
        </Btn>
      </View>
    </View>
  );
}
