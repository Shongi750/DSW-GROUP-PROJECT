import { palettes, spacing as baseSpacing, radius as baseRadius, display as baseDisplay } from '../../../context/ThemeContext';

const dark = palettes.dark;

/** Thin alias of app ThemeContext — keep workout import paths stable. */
export const colors = {
  background: dark.background,
  card: dark.card,
  cardElevated: dark.cardElevated,
  text: dark.text,
  muted: dark.muted,
  accent: dark.accent,
  accentDark: dark.accentSoft,
  teal: dark.accent,
  white: '#FFFFFF',
  black: '#000000',
  today: dark.accent,
  tabBar: dark.tabBar,
  search: dark.input,
  badge: '#EF4444',
  lightBg: dark.background,
  lightMuted: dark.muted,
  lightText: dark.text,
  lightCard: dark.card,
  blue: dark.accent,
  highlight: dark.accentBright,
  green: '#4ADE80',
  orange: dark.accent,
  border: dark.border,
};

export const lightColors = {
  background: palettes.light.background,
  text: palettes.light.text,
  muted: palettes.light.muted,
  blue: palettes.light.accent,
};

export const spacing = { ...baseSpacing };

export const radius = {
  ...baseRadius,
  pill: baseRadius.pill,
  circle: baseRadius.circle,
};

export const display = { ...baseDisplay };
