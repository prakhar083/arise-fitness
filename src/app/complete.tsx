import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Btn, BtnLabel, Kicker, SystemWindow, T } from '../components/ui';
import { scheduledDayFor } from '../data/plan';
import { REWARD } from '../game/rules';
import { useGame, useToday } from '../store/useGame';
import { alpha, colors, mix, radius } from '../theme/tokens';

export default function CompleteScreen() {
  const insets = useSafeAreaInsets();
  const summary = useGame(s => s.summary);
  const claim = useGame(s => s.claimRewards);
  const today = useToday();
  const claimed = useRef(false);

  useEffect(() => { if (!summary && !claimed.current) router.replace('/'); }, [summary]);
  if (!summary) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const isToday = summary.dayId === scheduledDayFor(new Date()).id;
  const exp = isToday ? (today.awarded.workout ? 0 : REWARD.workout) : (today.awarded.bonusWorkout ? 0 : REWARD.bonusWorkout);
  const rewards: [string, string][] = [
    ['EXP', `+${exp}`],
    ['STR', '+1'],
    ['Daily quest', isToday ? "Today's workout ✓" : 'Bonus dungeon'],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', gap: 16, paddingHorizontal: 22, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }}>
      <SystemWindow from={mix(colors.a900, 60, colors.surface)} fadeAt={1} glowPct={30} border={colors.accent}
        style={{ paddingVertical: 24, paddingHorizontal: 18, gap: 18, boxShadow: `0 0 40px ${alpha(colors.accent, 30)}` }}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <T size={12} spacing={0.22} color={colors.a200}>[ SYSTEM ]</T>
          <T size={26} weight={500} spacing={0.04}>QUEST COMPLETE</T>
          <T size={14} color={colors.n300} style={{ textAlign: 'center' }}>Dungeon cleared: {summary.name}</T>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {([[summary.time, 'TIME'], [summary.sets, 'SETS'], [summary.volume, 'KG MOVED']] as const).map(([v, l]) => (
            <View key={l} style={{ flex: 1, alignItems: 'center', gap: 2, paddingVertical: 10, paddingHorizontal: 4, borderRadius: radius.md, backgroundColor: alpha(colors.bg, 60) }}>
              <T size={18}>{v}</T>
              <T size={10} spacing={0.12} color={colors.n500}>{l}</T>
            </View>
          ))}
        </View>
        <View style={{ gap: 8 }}>
          <Kicker>REWARDS</Kicker>
          {rewards.map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T size={14}>{k}</T>
              <T size={14} color={colors.a200}>{v}</T>
            </View>
          ))}
        </View>
      </SystemWindow>
      <Btn variant="primary" block height={48} onPress={() => { claimed.current = true; router.dismissTo('/'); claim(); }}>
        <BtnLabel size={15}>Claim rewards</BtnLabel>
      </Btn>
    </View>
  );
}
