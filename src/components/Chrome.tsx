// App chrome: blurred tab bar, sticky sub-header, screen scroll container.
import type { BottomTabBarProps } from 'expo-router/tabs';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, View, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { alpha, colors } from '../theme/tokens';
import { Icon, type IconName } from './Icon';
import { Btn, T } from './ui';

export const TAB_BAR_HEIGHT = 84;

/** Back if there is history, otherwise to Status (e.g. after a deep link or web reload). */
export const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Status', icon: 'user-circle' },
  quests: { label: 'Quests', icon: 'scroll' },
  train: { label: 'Train', icon: 'barbell' },
  calendar: { label: 'Calendar', icon: 'calendar-blank' },
  dday: { label: 'D-Day', icon: 'hourglass-medium' },
};

/** Translucent blurred background (blur on native, colour-mix fallback everywhere). */
export const Frost = ({ tint = 88, intensity = 40, style }: { tint?: number; intensity?: number; style?: StyleProp<ViewStyle> }) => (
  <View pointerEvents="none" style={[{ position: 'absolute', inset: 0, overflow: 'hidden' }, style]}>
    {Platform.OS !== 'android' ? <BlurView intensity={intensity} tint="dark" style={{ position: 'absolute', inset: 0 }} /> : null}
    <View style={{ position: 'absolute', inset: 0, backgroundColor: alpha(colors.bg, tint) }} />
  </View>
);

export const TabBar = ({ state, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, height: Math.max(TAB_BAR_HEIGHT, 50 + insets.bottom),
      flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8, paddingHorizontal: 6,
      borderTopWidth: 1, borderTopColor: colors.n800,
    }}>
      <Frost tint={88} intensity={50} />
      {state.routes.map((route, i) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const on = state.index === i;
        const color = on ? colors.a200 : colors.n500;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={tab.label}
            onPress={() => {
              const ev = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!on && !ev.defaultPrevented) navigation.navigate(route.name);
            }}
            style={{ alignItems: 'center', gap: 3, minWidth: 60, height: 46 }}
          >
            <Icon name={tab.icon} size={24} color={color} weight={on ? 'fill' : 'regular'} />
            <T size={10.5} color={color}>{tab.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
};

/** Sticky blurred header with an accent back chevron (pushed screens + logger). */
export const SubHeader = ({ title, onBack, right, hideBack }: { title: string; onBack?: () => void; right?: ReactNode; hideBack?: boolean }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top, borderBottomWidth: 1, borderBottomColor: colors.n800, zIndex: 5 }}>
      <Frost tint={92} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 6, paddingBottom: 10, paddingHorizontal: 14 }}>
        {hideBack ? <View style={{ width: 8 }} /> : (
          <Btn variant="ghost" icon accessibilityLabel="Back" onPress={onBack ?? goBack}>
            <Icon name="caret-left" size={22} color={colors.accent} />
          </Btn>
        )}
        <T size={17} weight={500} numberOfLines={1} style={{ flex: 1, minWidth: 0 }}>{title}</T>
        {right}
      </View>
    </View>
  );
};

/** Root scroll container for a tab screen: safe-area top, room for the tab bar at the bottom. */
export const TabScreen = ({ children, contentStyle, scrollRef, ...rest }:
  ScrollViewProps & { children: ReactNode; contentStyle?: StyleProp<ViewStyle>; scrollRef?: React.Ref<ScrollView> }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[{ paddingTop: 6, paddingBottom: TAB_BAR_HEIGHT + 28 }, contentStyle]}
        {...rest}
      >
        {children}
      </ScrollView>
    </View>
  );
};
