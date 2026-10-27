import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { alpha, colors, font, ls, mix, radius, shadow } from '../theme/tokens';

// ── Text ─────────────────────────────────────────────────────────────────
type TProps = TextProps & { size?: number; color?: string; weight?: 400 | 500 | 600; spacing?: number; tabular?: boolean };
export const T = ({ size = 15, color = colors.text, weight = 400, spacing, tabular, style, ...rest }: TProps) => (
  <Text
    {...rest}
    style={[{
      fontFamily: weight === 500 ? font.medium : weight === 600 ? font.semibold : font.regular,
      fontSize: size, color,
      letterSpacing: spacing != null ? ls(spacing, size) : undefined,
      fontVariant: tabular ? ['tabular-nums'] : undefined,
    }, style]}
  />
);

/** Uppercase kicker label, e.g. "[ SYSTEM ] · STATUS". */
export const Kicker = ({ children, color = colors.n500, size = 11, spacing = 0.14, style }:
  { children: ReactNode; color?: string; size?: number; spacing?: number; style?: StyleProp<TextStyle> }) => (
  <T size={size} color={color} spacing={spacing} style={style}>{children}</T>
);

export const ScreenTitle = ({ kicker, title }: { kicker?: string; title: string }) => (
  <View style={{ gap: 2 }}>
    {kicker ? <Kicker color={colors.a300} spacing={0.16}>{kicker}</Kicker> : null}
    <T size={22} weight={500}>{title}</T>
  </View>
);

// ── Surfaces ─────────────────────────────────────────────────────────────
export const Card = ({ children, style, onPress, elevated = true }:
  { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; elevated?: boolean }) => {
  const s = [styles.card, elevated && { boxShadow: shadow.sm }, style];
  return onPress
    ? <Pressable onPress={onPress} style={({ pressed }) => [s, pressed && { opacity: 0.85 }]}>{children}</Pressable>
    : <View style={s}>{children}</View>;
};

/** The "System" window: accent border, vertical accent→surface gradient, soft outer glow. */
export const SystemWindow = ({ children, style, fadeAt = 0.7, glowPct = 22, from = mix(colors.a900, 55, colors.surface), border = colors.a700 }:
  { children: ReactNode; style?: StyleProp<ViewStyle>; fadeAt?: number; glowPct?: number; from?: string; border?: string }) => (
  <View style={[styles.system, { borderColor: border, boxShadow: `0 0 28px ${alpha(colors.accent, glowPct)}` }, style]}>
    <LinearGradient colors={[from, colors.surface]} locations={[0, fadeAt]} style={[StyleSheet.absoluteFill, { borderRadius: radius.lg - 1 }]} />
    {children}
  </View>
);

/** Radial glow background (CSS radial-gradient stand-in). Place as first child of a relative container. */
export const RadialBg = ({ stops, cx = '50%', cy = '30%', rx = '90%', ry = '70%', rounded = radius.lg }:
  { stops: [number, string][]; cx?: string; cy?: string; rx?: string; ry?: string; rounded?: number }) => (
  <View style={[StyleSheet.absoluteFill, { borderRadius: rounded, overflow: 'hidden' }]} pointerEvents="none">
    <Svg width="100%" height="100%">
      <Defs>
        <RadialGradient id="g" cx={cx} cy={cy} rx={rx} ry={ry} fx={cx} fy={cy} gradientUnits="objectBoundingBox">
          {stops.map(([o, c], i) => <Stop key={i} offset={o} stopColor={c} />)}
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#g)" />
    </Svg>
  </View>
);

// ── Progress bar ─────────────────────────────────────────────────────────
export const Bar = ({ pct, height = 4, color = colors.accent, glow = false, track = colors.n900, style }:
  { pct: number; height?: number; color?: string; glow?: boolean; track?: string; style?: StyleProp<ViewStyle> }) => (
  <View style={[{ height, borderRadius: height / 2, backgroundColor: track }, style]}>
    <View style={{
      height: '100%', width: `${Math.max(0, Math.min(100, pct))}%`, borderRadius: height / 2, backgroundColor: color,
      boxShadow: glow ? `0 0 ${height >= 6 ? 10 : 8}px ${color}` : undefined,
    }} />
  </View>
);

// ── Buttons ──────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost';
type BtnProps = Omit<PressableProps, 'style' | 'children'> & {
  variant?: BtnVariant; block?: boolean; icon?: boolean; height?: number; style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>; children: ReactNode; glow?: boolean;
};
export const Btn = ({ variant = 'secondary', block, icon, height, style, textStyle, children, glow, ...rest }: BtnProps) => {
  const fg = variant === 'secondary' ? colors.text : colors.accent;
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && { borderColor: colors.accent },
        variant === 'secondary' && { borderColor: colors.divider },
        variant === 'ghost' && { paddingHorizontal: 2.8 },
        icon && { width: 36, height: 36, paddingHorizontal: 0, paddingVertical: 0 },
        block && { alignSelf: 'stretch' },
        height != null && { height },
        glow && { boxShadow: `0 0 22px ${alpha(colors.accent, 30)}` },
        pressed && { backgroundColor: variant === 'secondary' ? alpha(colors.text, 14) : alpha(colors.accent, 22) },
        style,
      ]}
    >
      {typeof children === 'string'
        ? <T size={14} weight={500} color={fg} style={textStyle}>{children}</T>
        : children}
    </Pressable>
  );
};
/** Row content for a button with icon + label in the button's colour. */
export const BtnLabel = ({ children, color = colors.accent, size = 14 }: { children: ReactNode; color?: string; size?: number }) => (
  <T size={size} weight={500} color={color}>{children}</T>
);

// ── Tags ─────────────────────────────────────────────────────────────────
export const Tag = ({ children, tone = 'neutral', style }: { children: ReactNode; tone?: 'neutral' | 'accent'; style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.tag, { backgroundColor: tone === 'accent' ? colors.a800 : colors.n800 }, style]}>
    {typeof children === 'string' ? <T size={11} spacing={0.02} color={tone === 'accent' ? colors.a100 : colors.n100}>{children}</T> : children}
  </View>
);

/** Segmented control (Month / List, 1 / 2 / 5 kg). */
export function Segmented<V extends string | number>({ options, value, onChange, stretch }:
  { options: { label: string; value: V }[]; value: V; onChange: (v: V) => void; stretch?: boolean }) {
  return (
    <View style={styles.seg}>
      {options.map(o => {
        const on = o.value === value;
        return (
          <Pressable key={String(o.value)} onPress={() => onChange(o.value)} accessibilityRole="button" accessibilityState={{ selected: on }}
            style={[styles.segOpt, stretch && { flex: 1, alignItems: 'center', paddingVertical: 8 }, on && { backgroundColor: colors.a800 }]}>
            <T size={13} color={on ? colors.a100 : colors.n400}>{o.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Exercise / photo image placeholder (the prototype's image-slot). */
export const ImageSlot = ({ label = 'Image', width, height, style, children }:
  { label?: string; width?: number | `${number}%`; height: number; style?: StyleProp<ViewStyle>; children?: ReactNode }) => (
  <View style={[styles.slot, { width, height }, style]}>
    {children ?? <T size={11} color={colors.n600}>{label}</T>}
  </View>
);

export const Divider = ({ style }: { style?: StyleProp<ViewStyle> }) => (
  <View style={[{ height: 1, backgroundColor: colors.n800 }, style]} />
);

export const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 16 },
  system: { borderRadius: radius.lg, borderWidth: 1, overflow: 'visible' },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: 'transparent', borderRadius: radius.md, paddingVertical: 5.6, paddingHorizontal: 10,
  },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 6 },
  seg: { flexDirection: 'row', padding: 3, borderRadius: radius.md, backgroundColor: colors.surface },
  segOpt: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  slot: {
    borderRadius: radius.md, backgroundColor: mix(colors.surface, 60, colors.bg), borderWidth: 1, borderColor: colors.n800,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  input: {
    minHeight: 40, paddingVertical: 6, paddingHorizontal: 10, fontFamily: font.regular, fontSize: 14, color: colors.text,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider, borderRadius: radius.md,
  },
});
