import { View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { Icon } from '../components/Icon';
import { SubScreen } from '../components/SubScreen';
import { Card, Kicker, T } from '../components/ui';
import { addDays, dateKey, gateCloseTime, isCleared, parseDate } from '../game/rules';
import type { CheckIn } from '../game/types';
import { DOW, MON3, shortDate, useJourney } from '../store/derived';
import { useGame, useToday } from '../store/useGame';
import { colors, font, radius } from '../theme/tokens';

const W = 320, H = 150;

const WeightChart = () => {
  const j = useJourney();
  const weights = useGame(s => s.weights);
  const t0 = parseDate(j.goal.startDate).getTime(), t1 = gateCloseTime(j.goal);
  const X = (key: string) => ((parseDate(key).getTime() - t0) / (t1 - t0)) * W;
  const lo = Math.min(j.goal.targetKg, ...weights.map(w => w.kg)) - 1;
  const hi = Math.max(j.goal.startKg, ...weights.map(w => w.kg)) + 0.5;
  const Y = (kg: number) => 8 + ((hi - kg) / (hi - lo)) * 122;
  const pts = weights.filter(w => parseDate(w.date).getTime() >= t0).map(w => ({ x: X(w.date), y: Y(w.kg), key: w.date }));
  const months: { x: number; label: string }[] = [];
  for (let d = parseDate(j.goal.startDate); d.getTime() < t1; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    const x = X(dateKey(d));
    if (x <= W - 16) months.push({ x: Math.max(0, x), label: MON3[d.getMonth()] });
  }
  const ty = Y(j.goal.targetKg);
  return (
    <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={undefined} style={{ aspectRatio: W / H, overflow: 'visible' }}>
      <Line x1={0} x2={W} y1={ty} y2={ty} stroke={colors.a700} strokeDasharray="3 4" />
      <SvgText x={W} y={ty + 13} textAnchor="end" fontSize={10} fontFamily={font.regular} fill={colors.a300}>Goal {j.goal.targetKg} kg</SvgText>
      <Path d={`M0 ${Y(j.goal.startKg)} L${W} ${ty}`} stroke={colors.n700} strokeDasharray="4 4" fill="none" />
      {pts.length > 1 ? (
        <>
          <Path d={'M' + pts.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L')} stroke={colors.accent} strokeOpacity={0.35} strokeWidth={6} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <Path d={'M' + pts.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L')} stroke={colors.accent} strokeWidth={2} fill="none" strokeLinejoin="round" />
        </>
      ) : null}
      {pts.map(p => <Circle key={p.key} cx={p.x} cy={p.y} r={3} fill={colors.bg} stroke={colors.accent} strokeWidth={1.5} />)}
      {months.map(mo => <SvgText key={mo.label + mo.x} x={mo.x} y={148} fontSize={10} fontFamily={font.regular} fill={colors.n500}>{mo.label}</SvgText>)}
    </Svg>
  );
};

const MEASURES: [string, keyof CheckIn][] = [['Waist', 'waist'], ['Hip', 'hip'], ['Biceps', 'biceps'], ['Thighs', 'thighs']];

export default function ProgressScreen() {
  const j = useJourney();
  const days = useGame(s => s.days);
  const checkIns = useGame(s => s.checkIns);
  const today = useToday();
  const stepsGoal = j.goal.stepsGoal;

  const bars = Array.from({ length: 7 }, (_, i) => {
    const dt = addDays(new Date(), i - 6);
    const n = i === 6 ? today.steps : days[dateKey(dt)]?.steps ?? 0;
    return { key: dateKey(dt), n, label: DOW[dt.getDay()][0] };
  });
  const maxSteps = Math.max(stepsGoal * 1.3, ...bars.map(b => b.n));

  const measures = MEASURES.map(([label, k]) => {
    const withVal = checkIns.filter(c => typeof c[k] === 'number');
    if (!withVal.length) return null;
    const a = withVal[0][k] as number, b = withVal[withVal.length - 1][k] as number;
    const d = Math.round((b - a) * 10) / 10;
    return { label, a, b, d: (d > 0 ? '+' : '') + d };
  }).filter(Boolean) as { label: string; a: number; b: number; d: string }[];

  return (
    <SubScreen title="Progress">
      <Card style={{ gap: 10, padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Kicker>WEIGHT</Kicker>
          <T size={13} color={colors.n400}>{j.cur.toFixed(1)} kg · −{j.lost.toFixed(1)} kg</T>
        </View>
        <WeightChart />
        <T size={12} color={colors.n500}>Dashed line: the pace needed to reach {j.goal.targetKg} kg by {shortDate(j.goal.endDate)}</T>
      </Card>

      <Card style={{ gap: 10, padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Kicker>STEPS · 7 DAYS</Kicker>
          <T size={13} color={colors.n400}>{today.steps.toLocaleString()} today</T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 90 }}>
          {bars.map(b => (
            <View key={b.key} style={{ flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <View style={{ width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4, borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
                height: `${Math.max(2, (b.n / maxSteps) * 80)}%`, backgroundColor: b.n >= stepsGoal ? colors.accent : colors.n700 }} />
              <T size={10} color={colors.n500}>{b.label}</T>
            </View>
          ))}
        </View>
      </Card>

      {measures.length ? (
        <Card style={{ gap: 2, paddingVertical: 12 }}>
          <Kicker style={{ paddingTop: 4, paddingBottom: 6 }}>MEASUREMENTS · START → NOW</Kicker>
          {measures.map(m => (
            <View key={m.label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.n800 }}>
              <T size={14} color={colors.n300}>{m.label}</T>
              <T size={14}>{m.a} → {m.b} cm <T size={14} color={colors.a300}>  {m.d}</T></T>
            </View>
          ))}
        </Card>
      ) : null}

      <View style={{ gap: 8 }}>
        <Kicker>WEIGHT GATES</Kicker>
        {j.gates.map((g, i) => {
          const c = isCleared(g, j.cur), nx = g === j.next;
          return (
            <View key={g} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: nx ? colors.a600 : 'transparent', opacity: c || nx ? 1 : 0.6 }}>
              <Icon name={c ? 'seal-check' : nx ? 'door-open' : 'lock-simple'} size={16} weight={c ? 'fill' : 'regular'} color={c || nx ? colors.accent : colors.n600} />
              <T size={14} style={{ flex: 1 }}>Gate {i + 1} · {g.toFixed(1)} kg</T>
              <T size={12} color={colors.n400}>{c ? 'Cleared · +1 Lv' : nx ? `${(j.cur - g).toFixed(1)} kg to go` : 'Locked'}</T>
            </View>
          );
        })}
      </View>
    </SubScreen>
  );
}
