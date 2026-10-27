import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { TabScreen } from '../../components/Chrome';
import { Icon } from '../../components/Icon';
import { Btn, Card, Kicker, Segmented, T } from '../../components/ui';
import { dayById, SCHEDULE, shortDayName, type Day } from '../../data/plan';
import { dateKey, parseDate, questsDone, startOfDay } from '../../game/rules';
import { DOW, MON3, MONTHS } from '../../store/derived';
import { useGame } from '../../store/useGame';
import { colors, mix } from '../../theme/tokens';

type Status = 'pre' | 'done' | 'missed' | 'rest' | 'today' | 'planned';
type Info = { date: Date; key: string; isToday: boolean; past: boolean; isEvent: boolean; status: Status; q: number; wd: Day | null; short: string };

const useDayInfo = () => {
  const days = useGame(s => s.days);
  const logs = useGame(s => s.logs);
  const goal = useGame(s => s.goal);
  return useMemo(() => {
    const logged = new Set(logs.map(l => l.date));
    const today = startOfDay(new Date());
    const start = parseDate(goal.startDate);
    return (date: Date): Info => {
      const key = dateKey(date);
      const sch = SCHEDULE[date.getDay()];
      const wd = sch ? dayById(sch) : null;
      const rec = days[key];
      const isToday = date.getTime() === today.getTime();
      const past = date < today;
      const worked = !!rec?.workoutDone || logged.has(key);
      let status: Status;
      if (date < start) status = 'pre';
      else if (past) status = worked ? 'done' : wd ? 'missed' : 'rest';
      else if (isToday) status = worked ? 'done' : wd ? 'today' : 'rest';
      else status = wd ? 'planned' : 'rest';
      return {
        date, key, isToday, past, isEvent: key === goal.endDate, status,
        q: rec ? questsDone(rec, goal) : 0, wd, short: wd ? shortDayName(wd) : '',
      };
    };
  }, [days, logs, goal]);
};

export default function CalendarScreen() {
  const goal = useGame(s => s.goal);
  const info = useDayInfo();
  const now = new Date();
  const first = parseDate(goal.startDate), last = parseDate(goal.endDate);
  const minM = first.getFullYear() * 12 + first.getMonth();
  const maxM = Math.max(minM, last.getFullYear() * 12 + last.getMonth());
  const [month, setMonth] = useState(() => Math.min(maxM, Math.max(minM, now.getFullYear() * 12 + now.getMonth())));
  const [mode, setMode] = useState<'month' | 'list'>('month');
  const [sel, setSel] = useState(() => dateKey(now));
  const y = Math.floor(month / 12), m = month % 12;

  const cells = useMemo(() => {
    const off = new Date(y, m, 1).getDay(), dim = new Date(y, m + 1, 0).getDate();
    const total = Math.ceil((off + dim) / 7) * 7;
    return Array.from({ length: total }, (_, i) => new Date(y, m, 1 - off + i));
  }, [y, m]);

  const si = info(parseDate(sel));
  const eventName = goal.eventName || 'Goal';
  const sub: Record<Status, string> = {
    done: `Workout logged · ${si.q}/3 quests cleared`, missed: 'No workout logged · Penalty issued', rest: 'Rest day',
    today: `Scheduled today · ${si.q}/3 quests so far`, planned: 'Scheduled', pre: 'Before your goal started',
  };

  const list = useMemo(() => {
    const dim = new Date(y, m + 1, 0).getDate(), out: Info[] = [];
    for (let d = dim; d >= 1; d--) {
      const i = info(new Date(y, m, d));
      if ((i.status === 'done' && (i.past || i.isToday)) || i.status === 'missed' || i.isEvent) out.push(i);
    }
    return out;
  }, [info, y, m]);

  return (
    <TabScreen contentStyle={{ paddingHorizontal: 16, gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <T size={22} weight={500}>Calendar</T>
        <Segmented options={[{ label: 'Month', value: 'month' }, { label: 'List', value: 'list' }]} value={mode} onChange={setMode} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Btn variant="secondary" icon accessibilityLabel="Previous month" disabled={month <= minM} onPress={() => setMonth(v => Math.max(minM, v - 1))} style={month <= minM && { opacity: 0.45 }}>
          <Icon name="caret-left" size={16} color={colors.text} />
        </Btn>
        <T size={16}>{MONTHS[m]} {y}</T>
        <Btn variant="secondary" icon accessibilityLabel="Next month" disabled={month >= maxM} onPress={() => setMonth(v => Math.min(maxM, v + 1))} style={month >= maxM && { opacity: 0.45 }}>
          <Icon name="caret-right" size={16} color={colors.text} />
        </Btn>
      </View>

      {mode === 'month' ? (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 3 }}>
            {DOW.map(d => (
              <View key={d} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingBottom: 4 }}>
                <T size={11} color={colors.n500}>{d[0]}</T>
              </View>
            ))}
            {cells.map(dt => {
              const c = info(dt);
              const inMonth = dt.getMonth() === m;
              let chip = '', chipBg = 'transparent', chipC: string = colors.n400;
              if (c.isEvent) { chip = eventName; chipBg = colors.section; chipC = colors.a100; }
              else if (c.status === 'done') { chip = c.short || 'Bonus'; chipBg = colors.a800; chipC = colors.a100; }
              else if (c.status === 'missed') { chip = 'Missed'; chipC = colors.danger75; }
              else if (c.status === 'today' || c.status === 'planned') { chip = c.short; chipC = colors.n500; }
              const showQ = (c.past || c.isToday) && c.status !== 'pre';
              const selected = sel === c.key;
              return (
                <View key={c.key} style={{ width: `${100 / 7}%`, paddingHorizontal: 1.5 }}>
                  <Pressable onPress={() => setSel(c.key)} accessibilityLabel={`${dt.getDate()} ${MON3[dt.getMonth()]}`}
                    style={{
                      height: 56, padding: 4, borderRadius: 6, gap: 3, opacity: inMonth ? 1 : 0.3, borderWidth: 1,
                      backgroundColor: c.isToday ? mix(colors.a900, 60, colors.surface) : colors.surface,
                      borderColor: selected ? colors.accent : c.isEvent ? colors.a600 : 'transparent',
                    }}>
                    <T size={12} color={c.isToday ? colors.a200 : colors.text}>{dt.getDate()}</T>
                    {chip ? (
                      <View style={{ paddingVertical: 2, paddingHorizontal: 3, borderRadius: 3, backgroundColor: chipBg }}>
                        <T size={8.5} color={chipC} numberOfLines={1} style={{ lineHeight: 10 }}>{chip}</T>
                      </View>
                    ) : null}
                    <View style={{ flexDirection: 'row', gap: 2, marginTop: 'auto' }}>
                      {showQ ? [0, 1, 2].map(k => (
                        <View key={k} style={{ flex: 1, height: 3, borderRadius: 1, backgroundColor: k < c.q ? colors.accent : c.isToday ? colors.n800 : colors.danger60 }} />
                      )) : null}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            {([[colors.a800, 6, 'Workout logged'], [colors.accent, 3, 'Quest cleared'], [colors.danger60, 3, 'Missed']] as const).map(([c, h, l]) => (
              <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 10, height: h, borderRadius: h > 3 ? 2 : 0, backgroundColor: c }} />
                <T size={11} color={colors.n500}>{l}</T>
              </View>
            ))}
          </View>
          <Card style={{ gap: 6 }}>
            <Kicker>{DOW[si.date.getDay()].toUpperCase()} · {si.date.getDate()} {MON3[si.date.getMonth()].toUpperCase()}</Kicker>
            <T size={15}>{si.isEvent ? `${eventName} · Gate closes` : si.status === 'done' && !si.wd ? 'Bonus dungeon' : si.wd ? si.wd.name : 'Rest day'}</T>
            <T size={13} color={colors.n400}>{si.isEvent ? `Target ${goal.targetKg} kg` : sub[si.status]}</T>
          </Card>
        </View>
      ) : (
        <View style={{ gap: 6 }}>
          {list.length === 0 ? <T size={13} color={colors.n500}>Nothing logged this month yet.</T> : null}
          {list.map(r => (
            <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.surface }}>
              <View style={{ alignItems: 'center', minWidth: 36 }}>
                <T size={17}>{r.date.getDate()}</T>
                <T size={10} color={colors.n500}>{DOW[r.date.getDay()]}</T>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <T size={14}>{r.isEvent ? eventName : r.status === 'missed' ? `Missed · ${r.short}` : r.wd?.name ?? 'Bonus dungeon'}</T>
                <T size={12} color={colors.n400}>{r.isEvent ? `Gate closes · ${goal.targetKg} kg` : r.status === 'missed' ? 'Penalty quest issued' : `${r.q}/3 quests cleared`}</T>
              </View>
            </View>
          ))}
        </View>
      )}
    </TabScreen>
  );
}
