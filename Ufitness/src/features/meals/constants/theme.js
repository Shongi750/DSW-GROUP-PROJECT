import { palettes, spacing as baseSpacing, radius as baseRadius, display as baseDisplay } from '../../../context/ThemeContext';

const dark = palettes.dark;

/** Thin alias of app ThemeContext — keep meals import paths + semantic meal keys. */
export const colors = {
  background: dark.background,
  page: dark.background,
  surface: dark.card,
  text: dark.text,
  muted: dark.muted,
  faint: '#6E6E6E',
  border: dark.border,
  cardBorder: dark.border,
  primary: dark.accent,
  primaryDark: '#FFB27A',
  primarySoft: dark.accentSoft,
  proteinBg: 'rgba(255,106,0,0.14)',
  proteinText: '#FFB27A',
  balancedBg: 'rgba(255,106,0,0.16)',
  balancedText: '#FFB27A',
  prepBg: dark.input,
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.72)',
};

export const spacing = {
  ...baseSpacing,
  card: 14,
};

export const radius = {
  ...baseRadius,
};

export const display = { ...baseDisplay };
