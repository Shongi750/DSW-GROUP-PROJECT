// components/BuddyCard.js
//
// Buddy card styled to match the UFitness "Connect & Grow" mockup:
// photo, name + year/level line, campus pill, goal tags, bio quote,
// and Connect / message actions.

import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const BRAND = '#9A3E0B';
const ACCENT = '#E8722C';
const TEXT = '#1F2933';
const MUTED = '#6B7280';

// Alternating tint palette for the goal tags, matching the mockup's
// peach / blue-grey / teal chips.
const TAG_STYLES = [
  { bg: '#FBEADF', color: '#B4530F' },
  { bg: '#E8EDF2', color: '#3D5A80' },
  { bg: '#D8F1EC', color: '#0F766E' },
];

// Props:
// student: { id, name, campus, fitnessGoal, experienceLevel, preferredSchedule,
//            workoutLocation, avatarUrl?, yearOfStudy?, goals?: string[], bio? }
// matchScore?, matchReasons? - still accepted, shown as a subtle match line
// actionLabel, onAction - primary Connect button
// onMessage? - square message button; hidden when not provided
export default function BuddyCard({
  student,
  matchScore,
  matchReasons,
  actionLabel = 'Connect',
  onAction,
  onMessage,
  disabled,
}) {
  // Prefer an explicit goals array; fall back to the single fitnessGoal field.
  const goals = student.goals && student.goals.length ? student.goals : [student.fitnessGoal];

  const subtitleParts = [student.yearOfStudy, student.experienceLevel].filter(Boolean);

  return (
    <View style={styles.card}>
      {/* Header: photo, identity, campus pill */}
      <View style={styles.header}>
        {student.avatarUrl ? (
          <Image source={{ uri: student.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{student.name.charAt(0)}</Text>
          </View>
        )}

        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {student.name}
          </Text>
          <Text style={styles.subtitle}>{subtitleParts.join(' • ')}</Text>
        </View>

        <View style={styles.campusPill}>
          <Text style={styles.campusText}>{student.campus}</Text>
        </View>
      </View>

      {/* Goals */}
      <Text style={styles.sectionLabel}>GOALS</Text>
      <View style={styles.tagRow}>
        {goals.map((goal, index) => {
          const tint = TAG_STYLES[index % TAG_STYLES.length];
          return (
            <View key={goal} style={[styles.tag, { backgroundColor: tint.bg }]}>
              <Text style={[styles.tagText, { color: tint.color }]}>{goal}</Text>
            </View>
          );
        })}
      </View>

      {/* Bio quote - falls back to the match reasons when no bio is set */}
      {student.bio ? (
        <Text style={styles.bio}>"{student.bio}"</Text>
      ) : matchReasons && matchReasons.length > 0 ? (
        <Text style={styles.matchLine}>
          {matchScore !== undefined ? `${matchScore}% match — ` : ''}
          {matchReasons.join(' · ')}
        </Text>
      ) : null}

      <View style={styles.divider} />

      {/* Actions */}
      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [
            styles.connectButton,
            disabled && styles.connectButtonDisabled,
            pressed && !disabled && styles.connectButtonPressed,
          ]}
          onPress={onAction}
          disabled={disabled}
        >
          <Icon name="person-add-outline" size={18} color="#fff" />
          <Text style={styles.connectText}>{actionLabel}</Text>
        </Pressable>

        {onMessage && (
          <Pressable style={styles.messageButton} onPress={() => onMessage(student)}>
            <Icon name="chatbox-outline" size={21} color="#3D5A80" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  header: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarFallback: { backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 22 },
  identity: { flex: 1, marginLeft: 13 },
  name: { fontSize: 19, fontWeight: '700', color: TEXT },
  subtitle: { fontSize: 14, color: MUTED, marginTop: 3 },
  campusPill: {
    backgroundColor: '#D8F1EC',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
  },
  campusText: { color: '#0F766E', fontSize: 12.5, fontWeight: '700' },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: TEXT,
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 },
  tagText: { fontSize: 13.5, fontWeight: '600' },

  bio: { fontSize: 14.5, fontStyle: 'italic', color: '#4B5563', lineHeight: 21, marginTop: 14 },
  matchLine: { fontSize: 13, color: MUTED, marginTop: 14 },

  divider: { height: 1, backgroundColor: '#EDF0F2', marginTop: 16 },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  connectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND,
    borderRadius: 10,
    paddingVertical: 15,
  },
  connectButtonPressed: { opacity: 0.85 },
  connectButtonDisabled: { backgroundColor: '#C9A08A' },
  connectText: { color: '#fff', fontWeight: '700', fontSize: 15.5 },
  messageButton: {
    width: 58,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#3D5A80',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
