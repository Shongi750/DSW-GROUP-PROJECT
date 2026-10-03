import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, display } from '../context/ThemeContext';

/**
 * Shared Nike/VA CTA — solid orange pill or outline.
 * Optional `icon` keeps workout screens on the same component.
 */
export default function PrimaryButton({
  title,
  onPress,
  disabled,
  variant = 'solid',
  icon,
  style,
}) {
  const { colors } = useTheme();
  const isOutline = variant === 'outline';
  const labelColor = isOutline ? colors.accent : '#FFFFFF';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isOutline
          ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.accent }
          : { backgroundColor: colors.accent, shadowColor: colors.accent },
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <View style={styles.row}>
        {icon ? <Ionicons name={icon} size={16} color={labelColor} /> : null}
        <Text style={[styles.text, { color: labelColor }]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.pill,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: display.letterSpacing,
    textTransform: 'uppercase',
  },
});
