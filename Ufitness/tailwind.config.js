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
        background: 'var(--color-background, #FAFAFA)',
        surface: 'var(--color-surface, #F8F9FA)',
        glass: 'var(--color-glass, rgba(255,255,255,0.86))',
        accent: '#BA4A0C',
        accentDark: '#FCEFE9',
        teal: '#006B63',
        muted: 'var(--color-muted, #666666)',
        ink: 'var(--color-ink, #1A1A1A)',
      },
      borderRadius: {
        glass: '22px',
      },
    },
  },
  plugins: [],
};
