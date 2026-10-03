import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';

const STORAGE_KEY = 'ufitness.theme.v1';

// Nike + Virgin Active + UJ: dark charcoal product look, warm cream light (secondary).
export const palettes = {
  light: {
    background: '#F7F2EC',
    card: '#FFFFFF',
    cardElevated: '#FFF8F2',
    text: '#14110E',
    muted: '#6B635C',
    border: '#E8DFD6',
    brand: '#FF6A00',
    accent: '#FF6A00',
    accentBright: '#FF8A1A',
    accentSoft: 'rgba(255,106,0,0.10)',
    tabBar: '#FFFFFF',
    tabInactive: '#9A9088',
    signOut: '#C2410C',
    overlay: '#F0E8E0',
    input: '#FFFFFF',
    status: 'dark',
  },
  dark: {
    background: '#0A0A0A',
    card: '#141414',
    cardElevated: '#1C1C1C',
    text: '#FFFFFF',
    muted: '#9C9C9C',
    border: '#242424',
    brand: '#FF6A00',
    accent: '#FF6A00',
    accentBright: '#FF8A1A',
    accentSoft: 'rgba(255,106,0,0.16)',
    tabBar: '#0A0A0A',
    tabInactive: '#7A7A7A',
    signOut: '#FF8A1A',
    overlay: '#161616',
    input: '#161616',
    status: 'light',
  },
};

/** 1px editorial rule — section dividers and card outlines. */
export const hairline = 'rgba(255,255,255,0.10)';

/**
 * One glass recipe for photo tabs — do not nest glass-in-glass.
 * Use PHOTO_GLASS / GlassSurface; avoid inventing new rgba stacks.
 */
export const glass = {
  fill: 'rgba(255,255,255,0.1)',
  border: 'rgba(255,255,255,0.14)',
  borderWidth: 1,
  softFill: 'rgba(255,255,255,0.06)',
  softBorder: 'rgba(255,255,255,0.1)',
};

/** Shared layout tokens — Nike/VA surfaces across Home, Workout, Meals, Community. */
export const spacing = {
  screen: 20,
  section: 24,
  card: 16,
  gap: 12,
};

export const radius = {
  card: 6,
  image: 6,
  input: 6,
  pill: 999,
  circle: 999,
  checkbox: 4,
};

/** Anton — heroes only (name, TODAY, screen titles). Body stays system sans. */
export const display = {
  fontFamily: 'Anton_400Regular',
  letterSpacing: 0.8,
  textTransform: 'uppercase',
};

/** Tight type scale — prefer these sizes over one-offs. */
export const type = {
  kicker: 11,
  body: 14,
  title: 17,
  hero: 28,
  display: 34,
  kickerWeight: '700',
  kickerTracking: 1.4,
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [scheme, setScheme] = useState('dark');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') setScheme(saved);
      } catch (error) {
        console.warn('Could not restore theme', error);
      }
    })();
  }, []);

  const setTheme = async (next) => {
    setScheme(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (error) {
      console.warn('Could not save theme', error);
    }
  };

  const toggleTheme = () => setTheme(scheme === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const palette = palettes[scheme];
    const root = document.documentElement;
    root.classList.toggle('uf-dark', scheme === 'dark');
    root.classList.toggle('uf-light', scheme === 'light');
    root.style.setProperty('--color-background', palette.background);
    root.style.setProperty('--color-surface', palette.overlay);
    root.style.setProperty('--color-ink', palette.text);
    root.style.setProperty('--color-muted', palette.muted);
    root.style.setProperty(
      '--color-glass',
      scheme === 'dark' ? '#141414' : '#FFFFFF'
    );
    root.style.background = palette.background;
    document.body.style.background = palette.background;
  }, [scheme]);

  const value = useMemo(() => {
    const colors = palettes[scheme];
    const isDark = scheme === 'dark';
    const navigationTheme = {
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        primary: colors.accent,
        background: 'transparent',
        card: colors.tabBar,
        text: colors.text,
        border: colors.border,
        notification: colors.accent,
      },
    };
    return {
      scheme,
      isDark,
      colors,
      spacing,
      radius,
      display,
      type,
      glass,
      setTheme,
      toggleTheme,
      navigationTheme,
    };
  }, [scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
