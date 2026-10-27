import { Pedometer } from 'expo-sensors';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useGame } from '../store/useGame';

type StepSource = 'health' | 'motion' | 'manual';
type Sub = { remove: () => unknown };

const midnight = (now: Date) => new Date(now.getFullYear(), now.getMonth(), now.getDate());

/** Today's steps from Apple Health: the same deduplicated iPhone + Apple Watch total the Health app shows. */
const healthKitReader = async (): Promise<{ read: () => Promise<number>; subscribe: (cb: () => void) => Sub } | null> => {
  const HK = await import('@kingstinct/react-native-healthkit');
  if (!HK.isHealthDataAvailable()) return null;
  await HK.requestAuthorization({ toRead: ['HKQuantityTypeIdentifierStepCount'] });
  return {
    read: async () => {
      const now = new Date();
      const r = await HK.queryStatisticsForQuantity('HKQuantityTypeIdentifierStepCount', ['cumulativeSum'], {
        filter: { date: { startDate: midnight(now), endDate: now } }, unit: 'count',
      });
      return Math.round(r.sumQuantity?.quantity ?? 0);
    },
    subscribe: cb => HK.subscribeToChanges('HKQuantityTypeIdentifierStepCount', cb),
  };
};

/** Today's steps from CoreMotion (iPhone only, no Watch). */
const motionReader = async () => {
  if (!(await Pedometer.isAvailableAsync())) return null;
  if (!(await Pedometer.requestPermissionsAsync()).granted) return null;
  return async () => {
    const now = new Date();
    return (await Pedometer.getStepCountAsync(midnight(now), now)).steps;
  };
};

/**
 * Keeps today's step count in sync with the device.
 * iOS: Apple Health (HealthKit) first, CoreMotion as a fallback. Takes the larger of the two, since
 * HealthKit hides a denied read permission behind an empty result. Refreshed on HealthKit changes,
 * every 30 s and on foreground.
 * Android: live `watchStepCount` deltas since the app opened (no history API without Health Connect).
 * Falls back to manual entry when nothing is available (web, simulators).
 */
export const useStepSync = () => {
  const setSensorSteps = useGame(s => s.setSensorSteps);

  useEffect(() => {
    let cancelled = false;
    const subs: Sub[] = [];
    let iv: ReturnType<typeof setInterval> | undefined;
    const setSource = (stepSource: StepSource) => useGame.setState({ stepSource });

    (async () => {
      if (Platform.OS === 'web') return;

      if (Platform.OS === 'ios') {
        const health = await healthKitReader().catch(() => null);
        const motion = await motionReader().catch(() => null);
        if (cancelled || (!health && !motion)) return;
        const pull = async () => {
          const [h, m] = await Promise.all([
            health ? health.read().catch(() => 0) : 0,
            motion ? motion().catch(() => 0) : 0,
          ]);
          if (cancelled) return;
          setSource(health && h >= m ? 'health' : 'motion');
          setSensorSteps(Math.max(h, m));
        };
        await pull();
        iv = setInterval(pull, 30_000);
        subs.push(AppState.addEventListener('change', st => { if (st === 'active') pull(); }));
        if (health) {
          try { subs.push(health.subscribe(() => { pull(); })); } catch { /* polling still covers it */ }
        }
        return;
      }

      try {
        if (!(await Pedometer.isAvailableAsync())) return;
        if (!(await Pedometer.requestPermissionsAsync()).granted || cancelled) return;
        setSource('motion');
        const base = useGame.getState();
        const key = Object.keys(base.days).sort().pop();
        const startSteps = key ? base.days[key].sensorSteps : 0;
        subs.push(Pedometer.watchStepCount(r => setSensorSteps(startSteps + r.steps)));
      } catch {
        // No motion data — stay on manual entry.
      }
    })();

    return () => { cancelled = true; if (iv) clearInterval(iv); subs.forEach(s => s.remove()); };
  }, [setSensorSteps]);
};
