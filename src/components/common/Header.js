import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { fonts, spacing, radius } from '../../utils/theme';
import { useAppTheme } from '../../context/ThemeContext';

export default function Header({
  title,
  subtitle,
  showUser = false,
  userName,
  onUserPress,
  showBack = false,
  onBackPress,
}) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBackPress}
            style={styles.backButton}
          >
            <Text style={[styles.backText, { color: theme.primary }]}>‹</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text>
          ) : null}
        </View>

        {showUser ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={onUserPress}
            style={styles.rightSection}
          >
            <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
              <Text style={[styles.avatarText, { color: theme.primary }]}>
                {(userName || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.rightSection} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: spacing.sm, paddingVertical: spacing.xs, paddingRight: spacing.sm },
  backText: { fontSize: 28, lineHeight: 30, fontWeight: fonts.weights.bold },
  titleWrap: { flex: 1 },
  title: { fontSize: fonts.sizes.xl, fontWeight: fonts.weights.bold },
  subtitle: { fontSize: fonts.sizes.sm, marginTop: 2 },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: spacing.md,
    minWidth: 36,
  },
  avatar: { width: 36, height: 36, borderRadius: radius.full, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: fonts.sizes.base, fontWeight: fonts.weights.bold },
});
