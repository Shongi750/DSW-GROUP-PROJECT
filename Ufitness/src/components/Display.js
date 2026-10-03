import { Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const SIZES = { xl: 40, lg: 32, md: 26, sm: 20, xs: 16 };
const LINE_HEIGHTS = { xl: 44, lg: 36, md: 30, sm: 24, xs: 20 };

export default function Display({ children, size = 'md', color, style, numberOfLines }) {
  const { colors } = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        styles.base,
        {
          fontSize: SIZES[size] || SIZES.md,
          lineHeight: LINE_HEIGHTS[size] || LINE_HEIGHTS.md,
          color: color || colors.text,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'Anton_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
