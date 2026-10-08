// components/BuddyCard.js
//
// Buddy card styled to match the UFitness "Connect & Grow" mockup:
// photo, name + year/level line, campus pill, goal tags, bio quote,
// and Connect / message actions.

import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, display } from '../../../context/ThemeContext';
import { PHOTO_GLASS } from '../../../components/PhotoShell';

// Alternating tint palette for the goal tags — dark-mode friendly variants
// of the mockup's peach / blue-grey / teal chips.
const TAG_STYLES_DARK = [
  { bg: 'rgba(255,106,0,0.18)', color: '#FF8A1A' },
  { bg: 'rgba(148,180,214,0.16)', color: '#AFC6DE' },
  { bg: 'rgba(20,184,166,0.16)', color: '#5EEAD4' },
];
const TAG_STYLES_LIGHT = [
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
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const tagStyles = isDark ? TAG_STYLES_DARK : TAG_STYLES_LIGHT;
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
          const tint = tagStyles[index % tagStyles.length];
          return (
            <View key={goal} style={[styles.tag, { backgroundColor: tint.bg }]}>
              <Text style={[styles.tagText, { color: tint.color }]}>{goal}</Text>
            </View>
          );
        })}
      </View>

      {/* Bio quote - falls back to the match reasons when no bio is set */}
      {student.bio ? (
        <Text style={styles.bio}>“{student.bio}”</Text>
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
          <Ionicons name="person-add-outline" size={18} color={disabled ? colors.muted : '#FFFFFF'} />
          <Text style={[styles.connectText, disabled && styles.connectTextDisabled]}>
            {actionLabel}
          </Text>
        </Pressable>

        {onMessage && (
          <Pressable style={styles.messageButton} onPress={() => onMessage(student)}>
            <Ionicons name="chatbox-outline" size={21} color={colors.brand} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function createStyles(colors, isDark) {
  return StyleSheet.create({
    card: {
      ...PHOTO_GLASS,
      borderRadius: radius.card,
      padding: 16,
      marginBottom: 14,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: isDark ? 0 : 2,
    },

    header: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 60, height: 60, borderRadius: 30 },
    avatarFallback: { backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 22 },
    identity: { flex: 1, marginLeft: 13 },
    name: { ...display, fontSize: 18, color: '#FFFFFF', textTransform: 'none', letterSpacing: 0.3 },
    subtitle: { fontSize: 14, color: '#C9C9C9', marginTop: 3 },
    campusPill: {
      backgroundColor: isDark ? 'rgba(255,106,0,0.16)' : 'rgba(255,106,0,0.10)',
      paddingHorizontal: 11,
      paddingVertical: 5,
      borderRadius: radius.image,
    },
    campusText: { color: isDark ? '#FFB27A' : '#C2410C', fontSize: 12.5, fontWeight: '700' },

    sectionLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.muted,
      letterSpacing: 1,
      marginTop: 16,
      marginBottom: 8,
    },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.image },
    tagText: { fontSize: 13.5, fontWeight: '600' },

    bio: { fontSize: 14.5, fontStyle: 'italic', color: colors.muted, lineHeight: 21, marginTop: 14 },
    matchLine: { fontSize: 13, color: colors.brand, marginTop: 14 },

    divider: { height: 1, backgroundColor: colors.border, marginTop: 16 },

    actionsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
    connectButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.brand,
      borderRadius: radius.pill,
      paddingVertical: 15,
    },
    connectButtonPressed: { opacity: 0.85 },
    connectButtonDisabled: {
      backgroundColor: isDark ? colors.overlay : '#F0E4DC',
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    connectText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15.5 },
    connectTextDisabled: { color: isDark ? '#7A7A7A' : '#8A6A55' },
    messageButton: {
      width: 58,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
