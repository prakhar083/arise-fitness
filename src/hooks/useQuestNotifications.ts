import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useGame, useToday } from '../store/useGame';
import { questsDone } from '../game/rules';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

const REMINDER_ID = 'arise-quest-reminder';
const RESET_ID = 'arise-quest-reset';

/**
 * Local notifications for the daily-quest loop:
 * - 21:00 reminder while any quest is unfinished (cancelled once all three clear)
 * - 00:00 "quests reset" alert, warning that unfinished quests issued a Penalty Quest
 */
export const useQuestNotifications = () => {
  const today = useToday();
  const goal = useGame(s => s.goal);
  const done = questsDone(today, goal);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      const { granted } = await Notifications.requestPermissionsAsync();
      if (!granted) return;
      await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
      await Notifications.cancelScheduledNotificationAsync(RESET_ID).catch(() => {});

      const now = new Date();
      const nine = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21);
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      if (done < 3 && nine > now) {
        await Notifications.scheduleNotificationAsync({
          identifier: REMINDER_ID,
          content: { title: '[ SYSTEM ] Daily Quest incomplete', body: `${3 - done} quest${done === 2 ? '' : 's'} left before midnight. Finish them or face a Penalty Quest.` },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: nine },
        });
      }
      await Notifications.scheduleNotificationAsync({
        identifier: RESET_ID,
        content: done < 3
          ? { title: '[ SYSTEM ] PENALTY QUEST ISSUED', body: 'An unfinished quest triggered a penalty: walk 2,000 extra steps today.' }
          : { title: '[ SYSTEM ] Daily Quests reset', body: 'New quests have arrived. Train to grow stronger.' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: midnight },
      });
    })().catch(() => {});
  }, [done]);
};
