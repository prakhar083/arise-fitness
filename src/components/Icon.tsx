import {
  ArrowRight, Barbell, CalendarBlank, Camera, CaretDoubleRight, CaretDown, CaretLeft, CaretRight, CaretUp, ChartLineUp,
  Check, CheckCircle, ClipboardText, Clock, Crown, DoorOpen, Drop, FlagCheckered, Flame, Footprints, HourglassMedium,
  IdentificationBadge, Lightning, LockSimple, Pause, PencilSimple, Play, Plus, Scales, Scroll, SealCheck, ShieldCheck,
  Skull, Sword, Target, Timer, TrendUp, UserCircle, Warning, X, type IconProps, type IconWeight,
} from 'phosphor-react-native';
import type { FC } from 'react';
import { colors } from '../theme/tokens';

const ICONS = {
  'arrow-right': ArrowRight, barbell: Barbell, 'calendar-blank': CalendarBlank, camera: Camera,
  'caret-double-right': CaretDoubleRight, 'caret-down': CaretDown, 'caret-left': CaretLeft, 'caret-right': CaretRight,
  'caret-up': CaretUp, 'chart-line-up': ChartLineUp, check: Check, 'check-circle': CheckCircle, 'clipboard-text': ClipboardText,
  clock: Clock, crown: Crown, 'door-open': DoorOpen, drop: Drop, 'flag-checkered': FlagCheckered, flame: Flame,
  footprints: Footprints, 'hourglass-medium': HourglassMedium, 'identification-badge': IdentificationBadge,
  lightning: Lightning, 'lock-simple': LockSimple, pause: Pause, 'pencil-simple': PencilSimple, play: Play, plus: Plus,
  scales: Scales, scroll: Scroll, 'seal-check': SealCheck, 'shield-check': ShieldCheck, skull: Skull, sword: Sword,
  target: Target, timer: Timer, 'trend-up': TrendUp, 'user-circle': UserCircle, warning: Warning, x: X,
} satisfies Record<string, FC<IconProps>>;

export type IconName = keyof typeof ICONS;

export const Icon = ({ name, size = 18, color = colors.text, weight = 'regular', style }:
  { name: IconName; size?: number; color?: string; weight?: IconWeight; style?: IconProps['style'] }) => {
  const C = ICONS[name];
  return <C size={size} color={color} weight={weight} style={style} />;
};
