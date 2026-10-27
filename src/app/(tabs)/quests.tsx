import { View } from 'react-native';
import { TabScreen } from '../../components/Chrome';
import { Icon } from '../../components/Icon';
import { QuestIcon, useQuestViews } from '../../components/QuestRows';
import { Bar, Btn, Kicker, ScreenTitle, SystemWindow, T } from '../../components/ui';
import { addDays, dateKey, penaltyProgress, PENALTY_STEPS, questsDone } from '../../game/rules';
import { hhmmss, useNow } from '../../hooks/useNow';
import { DOW, MON3 } from '../../store/derived';
import { useGame, useToday } from '../../store/useGame';
import { colors, mix, radius } from '../../theme/tokens';

export default function QuestsScreen() {
  const quests = useQuestViews();
  const today = useToday();
  const goal = useGame(s => s.goal);
  const days = useGame(s => s.days);
  const now = useNow();
  const d = new Date(now);
  const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
  const pen = penaltyProgress(today, goal);

  const week = Array.from({ length: 7 }, (_, i) => {
    const dt = addDays(d, i - 6);
    const isToday = i === 6;
    const rec = days[dateKey(dt)];
    const q = rec ? questsDone(rec, goal) : 0;
    return {
      key: dateKey(dt), label: DOW[dt.getDay()][0],
      bars: [0, 1, 2].map(k => (k < q ? colors.accent : isToday || !rec ? colors.n800 : colors.danger60)),
    };
  });

  return (
    <TabScreen contentStyle={{ paddingHorizontal: 18, gap: 16 }}>
      <ScreenTitle kicker={`[ SYSTEM ] · ${DOW[d.getDay()].toUpperCase()} ${d.getDate()} ${MON3[d.getMonth()].toUpperCase()}`} title="Daily Quests" />

      <SystemWindow fadeAt={0.8} glowPct={20} style={{ paddingVertical: 18, paddingHorizontal: 16, gap: 16 }}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <T size={12} spacing={0.2} color={colors.a200}>QUEST INFO</T>
          <T size={14} color={colors.n300} style={{ textAlign: 'center' }}>Daily Quest: Train to Grow Stronger has arrived.</T>
        </View>
        <View style={{ gap: 14 }}>
          {quests.map(q => (
            <View key={q.id} style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <QuestIcon q={q} />
                <T size={15} style={{ flex: 1 }}>{q.title}</T>
                <T size={14} color={colors.n300} tabular>[{q.prog}]</T>
              </View>
              <Bar pct={q.pct} height={4} glow />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 26 }}>
                <T size={12} color={colors.n500} style={{ flex: 1 }} numberOfLines={1}>{q.sub}</T>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {q.actions.map(a => (
                    <Btn key={a.label} variant="secondary" onPress={a.onPress} style={{ paddingVertical: 4, paddingHorizontal: 10 }}>
                      <T size={12} weight={500}>{a.label}</T>
                    </Btn>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>
        <View style={{ gap: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.n800 }}>
          <T size={12} color={colors.n400}>Rewards: +50 EXP per quest · +300 EXP workout · +100 EXP full clear</T>
          <T size={12} color={colors.danger75}>Warning: an unfinished quest at midnight issues a Penalty Quest.</T>
        </View>
      </SystemWindow>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.surface }}>
        <T size={13} color={colors.n400}>Quests reset in</T>
        <T size={18} tabular>{hhmmss(midnight - now)}</T>
      </View>

      {today.penalty ? (
        <View style={{ gap: 10, paddingVertical: 14, paddingHorizontal: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.danger50, backgroundColor: mix(colors.danger50, 12, colors.bg) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="skull" size={16} weight="fill" color={colors.danger75} />
            <Kicker size={12} spacing={0.16} color={colors.danger80}>PENALTY QUEST</Kicker>
            <T size={12} color={colors.n400} style={{ marginLeft: 'auto' }}>
              {pen >= PENALTY_STEPS ? 'Cleared' : `${pen.toLocaleString()} / ${PENALTY_STEPS.toLocaleString()}`}
            </T>
          </View>
          <T size={15}>Walk 2,000 extra steps</T>
          <T size={12} color={colors.n400}>
            Issued because {today.penalty.reason.replace(/^Yesterday's/, "yesterday's").replace(/\.$/, '')}. Counts steps above your {goal.stepsGoal.toLocaleString()} goal.
          </T>
          <Bar pct={(pen / PENALTY_STEPS) * 100} height={4} color={colors.danger68} />
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        <Kicker>LAST 7 DAYS</Kicker>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {week.map(w => (
            <View key={w.key} style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.surface }}>
              <T size={11} color={colors.n500}>{w.label}</T>
              <View style={{ gap: 3 }}>
                {w.bars.map((b, k) => <View key={k} style={{ width: 18, height: 4, borderRadius: 2, backgroundColor: b }} />)}
              </View>
            </View>
          ))}
        </View>
      </View>
    </TabScreen>
  );
}
