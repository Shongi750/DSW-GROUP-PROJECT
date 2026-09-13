import React, { createContext, useContext, useMemo, useState } from 'react';

export const light = {
  mode: 'light',
  background: '#F7FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F7FAFC',
  text: '#181C1E',
  muted: '#5A4136',
  lightText: 'rgba(90,65,54,0.7)',
  border: 'rgba(226,191,176,0.5)',
  primary: '#A04100',
  primarySoft: 'rgba(255,107,0,0.2)',
  accent: '#FF6B00',
  navy: '#476083',
  teal: '#00AB9E',
  tealSoft: 'rgba(0,171,158,0.1)',
  onPrimary: '#FFFFFF',
};

export const ThemeContext = createContext({
  theme: light,
  isDark: false,
  setIsDark: () => {},
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const value = useMemo(
    () => ({ theme: light, isDark, setIsDark }),
    [isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useAppTheme = () => useContext(ThemeContext);
