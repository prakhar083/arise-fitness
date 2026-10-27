import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import { View } from 'react-native';
import { TabBar } from '../../components/Chrome';
import { Toast } from '../../components/Overlays';
import { useGame } from '../../store/useGame';
import { colors } from '../../theme/tokens';

export default function TabsLayout() {
  const goalSet = useGame(s => s.goalSet);
  // First launch: the user sets their own goal before anything else.
  if (!goalSet) return <Redirect href="/goal" />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Tabs
        tabBar={props => <TabBar {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="quests" />
        <Tabs.Screen name="train" />
        <Tabs.Screen name="calendar" />
        <Tabs.Screen name="dday" />
      </Tabs>
      <Toast />
    </View>
  );
}
