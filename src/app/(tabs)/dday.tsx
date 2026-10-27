import { router } from 'expo-router';
import { View } from 'react-native';
import { TabScreen } from '../../components/Chrome';
import { Icon } from '../../components/Icon';
import { Bar, Btn, Card, Kicker, RadialBg, ScreenTitle, T } from '../../components/ui';
import { countdown, pace, paceAdvice } from '../../game/rules';
import { pad2, useNow } from '../../hooks/useNow';
import { longDate, useJourney } from '../../store/derived';
import { alpha, colors, radius, shadow } from '../../theme/tokens';

export default function DDayScreen() {
  const j = useJourney();
  const now = useNow();
  const cd = countdown(j.goal, now);
  const p = pace(j.goal, j.cur, now);

  return (
    <TabScreen contentStyle={{ paddingHorizontal: 18, gap: 18 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ScreenTitle kicker="[ SYSTEM ] · RED GATE" title={`${j.goal.eventName || 'Goal'} Gate`} />
        <Btn variant="secondary" icon accessibilityLabel="Edit goal" onPress={() => router.push('/goal')}>
          <Icon name="pencil-simple" size={16} color={colors.text} />
        </Btn>
      </View>

      <View style={{
        alignItems: 'center', gap: 6, paddingTop: 36, paddingBottom: 28, paddingHorizontal: 16, borderRadius: radius.lg,
        borderWidth: 1, borderColor: colors.a700, backgroundColor: colors.surface, boxShadow: `0 0 36px ${alpha(colors.accent, 22)}`,
      }}>
        <RadialBg stops={[[0, alpha(colors.section, 80)], [0.75, colors.surface], [1, colors.surface]]} />
        <T size={12} spacing={0.22} color={colors.n300}>GATE CLOSES IN</T>
        <T size={112} weight={500} spacing={-0.04} style={{ lineHeight: 116, padding: 36, margin: -36, textShadowColor: alpha(colors.accent, 70), textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 36 }} tabular>
          {cd.days}
        </T>
        <T size={14} spacing={0.18} color={colors.n300}>DAYS</T>
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 12 }}>
          {([[cd.hours, 'HRS'], [cd.minutes, 'MIN'], [cd.seconds, 'SEC']] as const).map(([v, l]) => (
            <View key={l} style={{ alignItems: 'center', gap: 2, minWidth: 58, paddingVertical: 8, borderRadius: radius.md, backgroundColor: alpha(colors.bg, 65), boxShadow: shadow.sm }}>
              <T size={22} tabular>{pad2(v)}</T>
              <Kicker size={10}>{l}</Kicker>
            </View>
          ))}
        </View>
        <T size={13} color={colors.n400} style={{ marginTop: 12 }}>{longDate(j.goal.endDate)} · {j.goal.targetKg} kg</T>
      </View>

      <Card style={{ gap: 14, padding: 16 }}>
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T size={13} color={colors.n400}>Time elapsed</T>
            <T size={13}>{Math.round(p.timePct)}%</T>
          </View>
          <Bar pct={p.timePct} height={5} color={colors.n500} />
        </View>
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T size={13} color={colors.n400}>Weight cleared</T>
            <T size={13}>{Math.round(p.weightPct)}% · {p.lost.toFixed(1)} of {p.span} kg</T>
          </View>
          <Bar pct={p.weightPct} height={5} glow />
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card elevated={false} style={{ flex: 1, gap: 4, padding: 14 }}>
          <Kicker>REQUIRED PACE</Kicker>
          <T size={20}>{p.required.toFixed(2)}</T>
          <T size={12} color={colors.n400}>kg / week to {j.goal.targetKg} kg</T>
        </Card>
        <Card elevated={false} style={{ flex: 1, gap: 4, padding: 14 }}>
          <Kicker>CURRENT PACE</Kicker>
          <T size={20}>{p.current.toFixed(2)}</T>
          <T size={12} color={colors.n400}>Projected {p.projected.toFixed(1)} kg</T>
        </Card>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.md, boxShadow: `inset 0 0 0 1px ${colors.a700}` }}>
        <Icon name="lightning" size={16} color={colors.accent} style={{ marginTop: 2 }} />
        <T size={13} color={colors.n300} style={{ flex: 1, lineHeight: 19 }}>{paceAdvice(p, j.goal.targetKg)}</T>
      </View>
    </TabScreen>
  );
}
