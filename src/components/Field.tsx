import { useState } from 'react';
import { TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { colors } from '../theme/tokens';
import { T, styles } from './ui';

/** Text input with the Nocturne `.input` look; border turns accent on focus. */
export const Input = ({ style, ...rest }: TextInputProps) => {
  const [focus, setFocus] = useState(false);
  return (
    <TextInput
      placeholderTextColor={colors.n600}
      selectionColor={colors.accent}
      keyboardAppearance="dark"
      {...rest}
      onFocus={e => { setFocus(true); rest.onFocus?.(e); }}
      onBlur={e => { setFocus(false); rest.onBlur?.(e); }}
      style={[styles.input, focus && { borderColor: colors.accent }, rest.editable === false && { color: colors.n300 }, style]}
    />
  );
};

/** Labelled field; `required` adds the red asterisk on the right of the label. */
export const Field = ({ label, required, small, style, ...input }:
  TextInputProps & { label: string; required?: boolean; small?: boolean; style?: StyleProp<ViewStyle> }) => (
  <View style={[{ gap: 4 }, style]}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <T size={small ? 12 : 13} color={small ? colors.n400 : colors.n300}>{label}</T>
      {required ? <T size={13} color={colors.danger70}>*</T> : null}
    </View>
    <Input {...input} />
  </View>
);
