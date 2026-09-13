import { Platform, StyleSheet } from 'react-native';

export const colors = {
  primary: '#A04100',
  primaryLight: '#FF6B00',
  primaryDark: '#572000',
  secondary: '#00AB9E',
  secondaryLight: 'rgba(0,171,158,0.1)',
  secondaryDark: '#138B6D',
  navy: '#476083',
  white: '#FFFFFF',
  black: '#181C1E',
  gray: '#5A4136',
  lightGray: '#F7FAFC',
  borderGray: 'rgba(226,191,176,0.5)',
  darkGray: '#181C1E',
  success: '#00AB9E',
  error: '#E74C3C',
  warning: '#F59642',
  info: '#476083',
  text: '#181C1E',
  textSecondary: '#5A4136',
  textLight: 'rgba(90,65,54,0.7)',
  background: '#F7FAFC',
  backgroundLight: '#FFFFFF',
};

export const fonts = {
  family: { regular: 'System', bold: 'System', semibold: 'System' },
  sizes: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, xxl: 24, xxxl: 28 },
  weights: { light: '300', regular: '400', medium: '500', semibold: '600', bold: '700' },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 4, md: 8, lg: 12, xl: 16, full: 999 };

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  shadow: Platform.select({
    web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' },
    default: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  }),
});
