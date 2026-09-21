import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';

const STORAGE_KEY = 'ufitness.theme.v1';

export const palettes = {
  light: {
    background: '#F9F9FB',
    card: '#FFFFFF',
    text: '#1F2933',
    muted: '#6B7280',
    border: '#EEF1F3',
    brand: '#8C3A12',
    accent: '#E8722C',
    tabBar: '#FFFFFF',
    tabInactive: '#6C6C70',
    signOut: '#1F3A5F',
    overlay: '#F5F7F8',
    input: '#FFFFFF',
    status: 'dark',
  },
  dark: {
    background: '#141210',
    card: '#1E1C1B',
    text: '#F4F1EE',
    muted: '#A8A29E',
    border: '#2E2A28',
    brand: '#E8722C',
    accent: '#E8722C',
    tabBar: '#1A1817',
    tabInactive: '#8A8580',
    signOut: '#E8C9A8',
    overlay: '#252220',
    input: '#252220',
    status: 'light',
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [scheme, setScheme] = useState('light');

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
    root.style.setProperty('--color-background', palette.background);
    root.style.setProperty('--color-surface', palette.overlay);
    root.style.setProperty('--color-ink', palette.text);
    root.style.setProperty('--color-muted', palette.muted);
    root.style.setProperty('--color-glass', scheme === 'dark' ? 'rgba(30,28,27,0.94)' : 'rgba(255,255,255,0.86)');
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
        background: colors.background,
        card: colors.tabBar,
        text: colors.text,
        border: colors.border,
        notification: colors.accent,
      },
    };
    return { scheme, isDark, colors, setTheme, toggleTheme, navigationTheme };
  }, [scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
