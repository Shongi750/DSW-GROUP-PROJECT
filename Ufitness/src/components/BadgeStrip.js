import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, spacing, type } from '../context/ThemeContext';
import { PHOTO_GLASS } from './PhotoShell';

/** Compact badge strip for Insights / Profile / Finish. */
export default function BadgeStrip({ badges = [], title = 'Milestones', summary = '' }) {
  const { colors } = useTheme();
  if (!badges.length) return null;
  const earned = badges.filter((b) => b.earned || b.unlockedAt);
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.copy}>
        {earned.length
          ? `${earned.length} of ${badges.length} unlocked`
          : 'Finish sessions to unlock milestones.'}
        {summary ? ` · ${summary}` : ''}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {badges.map((badge) => {
          const on = Boolean(badge.earned || badge.unlockedAt);
          return (
            <View
              key={badge.id}
              style={[styles.chip, PHOTO_GLASS, !on && styles.chipDim]}
            >
              <View style={[styles.icon, on && { backgroundColor: 'rgba(255,106,0,0.2)' }]}>
                <Ionicons
                  name={badge.icon || 'trophy-outline'}
                  size={18}
                  color={on ? colors.brand : 'rgba(255,255,255,0.35)'}
                />
              </View>
              <Text style={[styles.label, !on && styles.labelDim]} numberOfLines={2}>
                {badge.title}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.gap },
  title: {
    fontSize: type.kicker,
    fontWeight: type.kickerWeight,
    letterSpacing: type.kickerTracking,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 4,
  },
  copy: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 10 },
  row: { gap: 10, paddingRight: 8 },
  chip: {
    width: 108,
    borderRadius: radius.card,
    padding: 12,
    alignItems: 'center',
  },
  chipDim: { opacity: 0.55 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 16,
  },
  labelDim: { color: 'rgba(255,255,255,0.45)' },
});
