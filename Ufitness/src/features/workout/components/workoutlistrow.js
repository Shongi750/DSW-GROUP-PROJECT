import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';

// Inspo difficulty chips: Easy orange, Medium yellow, Hard red.
function levelTone(level) {
  const n = (level || '').toLowerCase();
  if (n.includes('begin') || n.includes('easy')) {
    return { label: 'Easy', bg: 'rgba(255,106,0,0.22)', color: '#FF8A1A' };
  }
  if (n.includes('inter') || n.includes('medium')) {
    return { label: 'Medium', bg: 'rgba(234,179,8,0.22)', color: '#EAB308' };
  }
  if (n.includes('adv') || n.includes('hard')) {
    return { label: 'Hard', bg: 'rgba(239,68,68,0.22)', color: '#EF4444' };
  }
  return { label: level || 'Train', bg: 'rgba(255,106,0,0.18)', color: '#FF6A00' };
}

export default function WorkoutListRow({ image, title, meta, level, onPress }) {
  const { colors } = useTheme();
  const tone = levelTone(level);
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, { backgroundColor: 'rgba(255,106,0,0.16)', alignItems: 'center', justifyContent: 'center' }]}>
          <Ionicons name="barbell" size={22} color={colors.accent} />
        </View>
      )}
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {meta ? (
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={colors.muted} />
            <Text style={[styles.meta, { color: colors.muted }]}>{meta}</Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.badge, { backgroundColor: tone.bg }]}>
        <Text style={[styles.badgeText, { color: tone.color }]}>{tone.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 6,
  },
  copy: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  meta: {
    fontSize: 12,
    fontWeight: '500',
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
