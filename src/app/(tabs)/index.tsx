import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { TabScreen } from '../../components/Chrome';
import { Icon, type IconName } from '../../components/Icon';
import { QuestIcon, useQuestViews } from '../../components/QuestRows';
import { Bar, Btn, Card, Kicker, SystemWindow, T, Tag } from '../../components/ui';
import { RANKS, countdown, parseDate, rankOf, XP_PER_LEVEL } from '../../game/rules';
import { useNow } from '../../hooks/useNow';
import { MON3, useJourney, useStreak, useTodayQuests } from '../../store/derived';
import { useGame } from '../../store/useGame';
import { alpha, colors, mix, radius, shadow } from '../../theme/tokens';

// Inter's vertical metrics (hhea, per em). Used to sit the 64 pt level number on the same
// baseline as the 13 pt "Title" line next to it, independent of each platform's line-box logic.
const INTER_DESCENT = 0.242, INTER_ASCENT_GAP = 0.18; // ascender space above digit cap height
const LEVEL_SIZE = 64, LABEL_SIZE = 13, LABEL_PAD = 2;
// iOS clips text shadows to the Text frame, so the glow gets GLOW px of padding, cancelled by margins.
const GLOW = 24;
const levelNumberStyle = {
  includeFontPadding: false,
  padding: GLOW,
  marginHorizontal: -GLOW,
  // Pull the natural line box down so the digits' baseline meets the Title line's baseline…
  marginBottom: -(INTER_DESCENT * LEVEL_SIZE - INTER_DESCENT * LABEL_SIZE - LABEL_PAD) - GLOW,
  // …and trim the empty ascender space above the digits.
  marginTop: -INTER_ASCENT_GAP * LEVEL_SIZE - GLOW,
} as const;

export default function StatusScreen() {
  const player = useGame(s => s.player);
  const j = useJourney();
  const { today, done, todayDay } = useTodayQuests();
  const quests = useQuestViews();
  const streak = useStreak();
  const now = useNow(60_000);
  const cd = countdown(j.goal, now);
  const end = parseDate(j.goal.endDate);
  const rank = rankOf(player.level);

  return (
    <TabScreen contentStyle={{ paddingHorizontal: 18, gap: 14 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ gap: 2 }}>
          <Kicker color={colors.a300} spacing={0.16}>[ SYSTEM ] · STATUS</Kicker>
          <T size={22} weight={500}>{player.name}</T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, boxShadow: shadow.sm }}>
          <Icon name="flame" size={14} weight="fill" color={colors.accent} />
          <T size={13} color={colors.n300}>{streak} day streak</T>
        </View>
      </View>

      {/* Penalty banner */}
      {today.penalty ? (
        <Pressable onPress={() => router.navigate('/quests')} style={{
          flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: 14,
          borderRadius: radius.md, borderWidth: 1, borderColor: colors.danger50, backgroundColor: mix(colors.danger50, 14, colors.bg),
        }}>
          <Icon name="warning" size={18} weight="fill" color={colors.danger75} style={{ marginTop: 1 }} />
          <View style={{ flex: 1, gap: 2 }}>
            <Kicker color={colors.danger78}>PENALTY QUEST ISSUED</Kicker>
            <T size={13} color={colors.n200} style={{ lineHeight: 18 }}>{today.penalty.reason} Walk 2,000 extra steps before midnight.</T>
          </View>
          <Icon name="caret-right" size={14} color={colors.n500} style={{ marginTop: 4 }} />
        </Pressable>
      ) : null}

      {/* Status window */}
      <SystemWindow style={{ paddingTop: 18, paddingHorizontal: 16, paddingBottom: 16, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            <T size={64} weight={500} spacing={-0.03} style={[levelNumberStyle, { textShadowColor: alpha(colors.accent, 60), textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 22 }]}>{player.level}</T>
            <View style={{ gap: 2, paddingBottom: 2 }}>
              <Kicker color={colors.n400} spacing={0.16}>LEVEL</Kicker>
              <T size={13} color={colors.n300}>Title: {RANKS[rank].title}</T>
            </View>
          </View>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <View style={{
              width: 46, height: 46, borderRadius: 10, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 16px ${alpha(colors.accent, 35)}, inset 0 0 12px ${alpha(colors.accent, 25)}`,
            }}>
              <T size={24} weight={500} color={colors.a200}>{rank}</T>
            </View>
            <Kicker size={10} color={colors.n400}>RANK</Kicker>
          </View>
        </View>
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T size={12} color={colors.n400}>EXP</T>
            <T size={12} color={colors.n400}>{player.xp} / {XP_PER_LEVEL}</T>
          </View>
          <Bar pct={(player.xp / XP_PER_LEVEL) * 100} height={6} glow />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {Object.entries(player.stats).map(([k, v]) => (
            <View key={k} style={{ flex: 1, gap: 2, padding: 8, borderRadius: radius.md, backgroundColor: alpha(colors.bg, 70), boxShadow: shadow.sm }}>
              <Kicker size={10} color={colors.n500}>{k}</Kicker>
              <T size={18} weight={500}>{v}</T>
            </View>
          ))}
        </View>
      </SystemWindow>

      {/* Weight Gate */}
      <Card onPress={() => router.push('/progress')} style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ gap: 4 }}>
            <Kicker>WEIGHT GATE</Kicker>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <T size={28} weight={500}>{j.cur.toFixed(1)}</T>
              <T size={13} color={colors.n400}>kg</T>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <T size={12} color={colors.n400}>Next gate</T>
            <T size={15} color={colors.a200}>{j.next != null ? `${j.next.toFixed(1)} kg` : 'All cleared'}</T>
            {j.next != null ? <T size={12} color={colors.n500}>{(j.cur - j.next).toFixed(1)} kg to go</T> : null}
          </View>
        </View>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.n900 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${j.pct}%`, borderRadius: 3, backgroundColor: colors.accent }} />
          {j.gates.map(g => (
            <View key={g} style={{
              position: 'absolute', top: -3, width: 2, height: 12, borderRadius: 1, marginLeft: -1,
              left: `${((j.goal.startKg - g) / j.span) * 100}%`, backgroundColor: j.cur <= g + 1e-9 ? colors.a200 : colors.n700,
            }} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <T size={12} color={colors.n500}>{j.goal.startKg} kg</T>
          <T size={12} color={colors.n500}>{j.cleared} gates cleared · +1 Lv each</T>
          <T size={12} color={colors.n500}>{j.goal.targetKg} kg</T>
        </View>
      </Card>

      {/* D-Day mini */}
      <Card onPress={() => router.navigate('/dday')} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ alignItems: 'center', minWidth: 56 }}>
          <T size={30} weight={500} style={{ lineHeight: 32 }}>{cd.days}</T>
          <Kicker size={10}>DAYS</Kicker>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <T size={15}>until {j.goal.eventName || 'Goal'}</T>
          <T size={12} color={colors.n400}>Gate closes {end.getDate()} {MON3[end.getMonth()]}</T>
        </View>
        <Icon name="hourglass-medium" size={22} color={colors.accent} />
      </Card>

      {/* Daily quest summary */}
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Kicker>DAILY QUEST · {done}/3</Kicker>
          <Btn variant="ghost" onPress={() => router.navigate('/quests')} style={{ paddingVertical: 2, paddingHorizontal: 6 }}>
            <T size={12} weight={500} color={colors.accent}>Open</T>
          </Btn>
        </View>
        {quests.map(q => (
          <View key={q.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: colors.surface }}>
            <QuestIcon q={q} />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T size={13}>{q.title}</T>
                <T size={13} color={colors.n400}>{q.prog}</T>
              </View>
              <Bar pct={q.pct} height={3} />
            </View>
          </View>
        ))}
      </View>

      {/* Today's workout */}
      <Card onPress={() => router.navigate('/train')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon name="barbell" size={22} color={colors.accent} />
        <View style={{ flex: 1, gap: 2 }}>
          <T size={12} color={colors.n400}>{"Today's dungeon · Fat Loss & Strength"}</T>
          <T size={16}>{todayDay.name}</T>
        </View>
        <Tag tone="accent">{today.workoutDone ? 'Cleared' : '+300 EXP'}</Tag>
      </Card>

      {/* Secondary actions */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {([['clipboard-text', 'Check-in', '/checkin'], ['chart-line-up', 'Progress', '/progress'], ['target', 'Goal', '/goal']] as [IconName, string, '/checkin' | '/progress' | '/goal'][]).map(([ic, label, href]) => (
          <Btn key={label} variant="secondary" onPress={() => router.push(href)} style={{ flex: 1, flexDirection: 'column', gap: 4, paddingVertical: 12, paddingHorizontal: 4 }}>
            <Icon name={ic} size={20} color={colors.text} />
            <T size={12} weight={500}>{label}</T>
          </Btn>
        ))}
      </View>
    </TabScreen>
  );
}
