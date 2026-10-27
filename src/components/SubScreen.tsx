import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/tokens';
import { SubHeader } from './Chrome';
import { Toast } from './Overlays';

/** Pushed screen (Check-in, Progress, Goal): sticky blurred header with back chevron + scroll body. */
export const SubScreen = ({ title, children, hideBack }: { title: string; children: ReactNode; hideBack?: boolean }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHeader title={title} hideBack={hideBack} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 14, paddingTop: 14, paddingHorizontal: 18, paddingBottom: 28 + insets.bottom }}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast bottom={40 + insets.bottom} />
    </View>
  );
};
