// Nocturne design tokens (from the design handoff's _ds/.../styles.css).

const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};
const toHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

/** Equivalent of `color-mix(in srgb, a pct%, b)`. */
export const mix = (a: string, pct: number, b: string) => {
  const [ar, ag, ab] = hex(a);
  const [br, bg, bb] = hex(b);
  const t = pct / 100;
  return toHex(ar * t + br * (1 - t), ag * t + bg * (1 - t), ab * t + bb * (1 - t));
};

/** Equivalent of `color-mix(in srgb, c pct%, transparent)`. */
export const alpha = (c: string, pct: number) => {
  const [r, g, b] = hex(c);
  return `rgba(${r},${g},${b},${pct / 100})`;
};

export const colors = {
  bg: '#161826',
  surface: '#232532',
  text: '#e9e9ed',
  accent: '#9184d9',
  divider: 'rgba(233,233,237,0.16)',

  n100: '#f3f5fe',
  n200: '#e4e7f5',
  n300: '#cfd3e5',
  n400: '#b2b6ca',
  n500: '#9397ab',
  n600: '#75798c',
  n700: '#595d6c',
  n800: '#3f424d',
  n900: '#292b31',

  a100: '#f5f4ff',
  a200: '#e7e5fe',
  a300: '#d2cefd',
  a400: '#b5abfc',
  a500: '#968ae0',
  a600: '#796cbf',
  a700: '#5d5294',
  a800: '#423a6a',
  a900: '#2b2741',

  section: '#262a60',
  sectionGlow: '#353b80',
  sectionGhost: '#4c5397',

  // Danger / penalty — sRGB approximations of oklch(L 0.1–0.13 25)
  danger50: '#a23c37', // oklch(0.5 0.12 25)
  danger60: '#c25750', // oklch(0.6 0.12 25)
  danger68: '#dc6b62', // oklch(0.68 0.13 25)
  danger70: '#dc756c', // oklch(0.7 0.12 25)
  danger75: '#e78a80', // oklch(0.75 0.1–0.12 25)
  danger78: '#ef978e', // oklch(0.78 0.1 25)
  danger80: '#f39f97', // oklch(0.8 0.1 25)
} as const;

export const radius = { sm: 4, md: 8, lg: 14, pill: 999 } as const;

export const space = { 1: 2.8, 2: 5.6, 3: 8.4, 4: 11.2, 6: 16.8, 8: 22.4 } as const;

export const shadow = {
  sm: '0 0 0 1px #3f424d',
  md: '0 0 0 1px #595d6c, 0 6px 18px rgba(0,0,0,0.55)',
  lg: '0 0 0 1px #9397ab, 0 16px 40px rgba(0,0,0,0.65)',
  /** The "System" window glow. */
  system: `0 0 28px ${alpha(colors.accent, 22)}`,
} as const;

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;

/** Letter-spacing in em → RN points for a given font size. */
export const ls = (em: number, size: number) => em * size;
