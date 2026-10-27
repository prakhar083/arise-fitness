import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { RANKS, rankOf, toNextRankLabel, type RankLetter } from '../game/rules';
import { useGame } from '../store/useGame';
import { alpha, colors, mix, radius } from '../theme/tokens';
import { Icon, type IconName } from './Icon';
import { Btn, BtnLabel, RadialBg, SystemWindow, T } from './ui';

const PERK_ICON: Record<string, IconName> = {
  badge: 'identification-badge', trend: 'trend-up', sword: 'sword', shield: 'shield-check', crown: 'crown', flag: 'flag-checkered',
};

export const LevelUpOverlay = () => {
  const ev = useGame(s => s.levelUp);
  const player = useGame(s => s.player);
  const dismiss = useGame(s => s.dismissLevelUp);
  useEffect(() => { if (ev) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); }, [ev]);
  if (!ev) return null;
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 50, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: alpha(colors.bg, 88) }]}>
      <SystemWindow
        from={mix(colors.section, 75, colors.surface)} fadeAt={1} glowPct={30} border={colors.accent}
        style={{ width: '100%', gap: 18, paddingTop: 26, paddingHorizontal: 20, paddingBottom: 20 }}
      >
        <View style={{ alignItems: 'center', gap: 6 }}>
          <T size={12} spacing={0.24} color={colors.a200}>[ SYSTEM ]</T>
          <T size={34} weight={500} spacing={0.06} color={colors.a100}>LEVEL UP!</T>
          <T size={14} color={colors.n300} style={{ textAlign: 'center' }}>{ev.reason}</T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <View style={{ alignItems: 'center' }}>
            <T size={36} color={colors.n400}>{ev.from}</T>
            <T size={10} spacing={0.14} color={colors.n500}>LV</T>
          </View>
          <Icon name="arrow-right" size={22} color={colors.accent} />
          <View style={{ alignItems: 'center' }}>
            <T size={56} weight={500} color={colors.a100} style={{ lineHeight: 58 }}>{ev.to}</T>
            <T size={10} spacing={0.14} color={colors.a300}>LV</T>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {Object.entries(player.stats).map(([k, v]) => (
            <View key={k} style={{ flex: 1, alignItems: 'center', gap: 2, paddingVertical: 8, borderRadius: radius.md, backgroundColor: alpha(colors.bg, 60) }}>
              <T size={10} spacing={0.12} color={colors.n500}>{k}</T>
              <T size={16}>{v}</T>
              <T size={11} color={colors.a300}>+{ev.gained}</T>
            </View>
          ))}
        </View>
        <T size={13} color={colors.n400} style={{ textAlign: 'center' }}>
          Hunter Rank: {rankOf(player.level)} · {toNextRankLabel(player.level)}
        </T>
        <Btn variant="primary" block height={44} onPress={dismiss}>Confirm</Btn>
      </SystemWindow>
    </View>
  );
};

export const RankUpOverlay = () => {
  const ru = useGame(s => s.rankUp);
  const dismiss = useGame(s => s.dismissRankUp);
  const insets = useSafeAreaInsets();
  useEffect(() => { if (ru) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); }, [ru]);
  if (!ru) return null;
  const to = RANKS[ru.to as RankLetter];
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 55, justifyContent: 'center', gap: 22, paddingHorizontal: 24, paddingTop: 60 + insets.top / 2, paddingBottom: 40 + insets.bottom / 2, backgroundColor: colors.bg }]}>
      <RadialBg rounded={0} cx="50%" cy="32%" rx="110%" ry="70%" stops={[[0, colors.sectionGlow], [0.45, colors.section], [1, colors.bg]]} />
      <View style={{ alignItems: 'center', gap: 6 }}>
        <T size={12} spacing={0.26} color={colors.a200}>[ SYSTEM ] · ALERT</T>
        <T size={28} weight={500} spacing={0.08}>HUNTER RANK UP</T>
        <T size={14} color={colors.n300}>Your re-evaluation is complete.</T>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <View style={{ width: 72, height: 72, borderRadius: 14, borderWidth: 1, borderColor: colors.n600, alignItems: 'center', justifyContent: 'center' }}>
          <T size={36} color={colors.n500}>{ru.from}</T>
        </View>
        <Icon name="caret-double-right" size={26} color={colors.accent} />
        <View style={{
          width: 116, height: 116, borderRadius: 20, borderWidth: 1, borderColor: colors.a300, alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 50px ${alpha(colors.accent, 55)}, inset 0 0 30px ${alpha(colors.accent, 35)}`,
        }}>
          <T size={68} weight={500} color={colors.a100}>{ru.to}</T>
        </View>
      </View>
      <View style={{ alignItems: 'center', gap: 2 }}>
        <T size={11} spacing={0.18} color={colors.n400}>{ru.to}-RANK HUNTER · {to.range}</T>
        <T size={20}>“{to.title}”</T>
      </View>
      <View style={{ gap: 8 }}>
        {to.perks.map(p => (
          <View key={p.title} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: alpha(colors.bg, 55), boxShadow: `inset 0 0 0 1px ${colors.sectionGhost}` }}>
            <Icon name={PERK_ICON[p.icon]} size={20} color={colors.a200} />
            <View style={{ gap: 2 }}>
              <T size={14}>{p.title}</T>
              <T size={12} color={colors.n300}>{p.description}</T>
            </View>
          </View>
        ))}
      </View>
      <Btn variant="primary" block height={48} onPress={dismiss} style={{ borderColor: colors.a300 }}>
        <BtnLabel color={colors.a100} size={15}>Accept</BtnLabel>
      </Btn>
    </View>
  );
};

export const Toast = ({ bottom = 100 }: { bottom?: number }) => {
  const toast = useGame(s => s.toast);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => {
      if (useGame.getState().toast?.at === toast.at) useGame.setState({ toast: null });
    }, 2600);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', bottom, left: 0, right: 0, alignItems: 'center', zIndex: 25 }}>
      <View style={{
        paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: colors.accent,
        backgroundColor: alpha(colors.bg, 85), boxShadow: `0 0 18px ${alpha(colors.accent, 35)}`,
      }}>
        <T size={13} color={colors.a200}>{toast.text}</T>
      </View>
    </View>
  );
};
