import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LevelUpOverlay, RankUpOverlay } from '../components/Overlays';
import { useQuestNotifications } from '../hooks/useQuestNotifications';
import { useStepSync } from '../hooks/useStepSync';
import { useGame } from '../store/useGame';
import { colors } from '../theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Creates today's quest record (and its penalty) on launch, on foreground and at midnight. */
const useDayRollover = () => {
  const hydrated = useGame(s => s.hydrated);
  const ensureToday = useGame(s => s.ensureToday);
  useEffect(() => {
    if (!hydrated) return;
    ensureToday();
    const iv = setInterval(() => ensureToday(), 30_000);
    const sub = AppState.addEventListener('change', st => { if (st === 'active') ensureToday(); });
    return () => { clearInterval(iv); sub.remove(); };
  }, [hydrated, ensureToday]);
};

const Services = () => {
  useDayRollover();
  useStepSync();
  useQuestNotifications();
  return null;
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  const hydrated = useGame(s => s.hydrated);
  const ready = fontsLoaded && hydrated;

  useEffect(() => { if (ready) SplashScreen.hideAsync().catch(() => {}); }, [ready]);
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <SafeAreaProvider style={{ backgroundColor: '#0b0c12' }}>
      <StatusBar style="light" />
      <Services />
      <View style={Platform.OS === 'web'
        ? { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', backgroundColor: colors.bg, overflow: 'hidden', boxShadow: `0 0 0 1px ${colors.n800}` }
        : { flex: 1, backgroundColor: colors.bg }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="checkin" />
          <Stack.Screen name="progress" />
          <Stack.Screen name="goal" />
          <Stack.Screen name="logger" options={{ gestureEnabled: false }} />
          <Stack.Screen name="complete" options={{ gestureEnabled: false, animation: 'fade' }} />
        </Stack>
        <LevelUpOverlay />
        <RankUpOverlay />
      </View>
    </SafeAreaProvider>
  );
}
