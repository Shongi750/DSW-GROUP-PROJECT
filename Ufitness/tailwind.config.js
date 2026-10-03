/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx}',
    './index.{js,jsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background, #0E0A08)',
        surface: 'var(--color-surface, #1E1612)',
        glass: 'var(--color-glass, rgba(26,22,18,0.92))',
        accent: '#FF6A00',
        accentBright: '#FF8A1A',
        accentDark: '#2A1A0E',
        teal: '#FF6A00',
        muted: 'var(--color-muted, #9A9A9A)',
        ink: 'var(--color-ink, #FFFFFF)',
      },
      fontFamily: {
        display: ['Anton_400Regular'],
      },
      borderRadius: {
        glass: '6px',
        // Editorial: flatten Tailwind's soft defaults app-wide.
        sm: '3px',
        DEFAULT: '4px',
        md: '4px',
        lg: '4px',
        xl: '6px',
        '2xl': '6px',
        '3xl': '8px',
      },
    },
  },
  plugins: [],
};
