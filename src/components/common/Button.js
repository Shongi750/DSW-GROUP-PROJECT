import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { fonts, spacing, radius } from '../../utils/theme';
import { useAppTheme } from '../../context/ThemeContext';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  style,
}) {
  const { theme } = useAppTheme();
  const isOutline = variant === 'outline';
  const isLarge = size === 'lg';
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        isOutline
          ? [styles.outline, { backgroundColor: theme.surface, borderColor: theme.primary }]
          : [styles.primary, { backgroundColor: theme.primary }],
        isLarge && styles.large,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? theme.primary : theme.onPrimary} />
      ) : (
        <Text style={[styles.label, isOutline ? { color: theme.primary } : { color: theme.onPrimary }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  large: { minHeight: 54, paddingVertical: spacing.lg },
  fullWidth: { width: '100%' },
  primary: {},
  outline: { borderWidth: 1 },
  disabled: { opacity: 0.6 },
  label: { fontSize: fonts.sizes.base, fontWeight: fonts.weights.semibold },
});
