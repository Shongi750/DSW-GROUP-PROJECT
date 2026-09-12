// components/BuddyCard.js

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

// Props:
// student: { id, name, campus, fitnessGoal, experienceLevel, preferredSchedule, workoutLocation }
// matchScore?: number
// matchReasons?: string[]
// actionLabel?, onAction?, secondaryActionLabel?, onSecondaryAction?
export default function BuddyCard({
  student,
  matchScore,
  matchReasons,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{student.name.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{student.name}</Text>
          <Text style={styles.meta}>
            {student.campus} · {student.experienceLevel} · {student.fitnessGoal}
          </Text>
        </View>
        {matchScore !== undefined && (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{matchScore}%</Text>
          </View>
        )}
      </View>

      {matchReasons && matchReasons.length > 0 && (
        <View style={styles.reasons}>
          {matchReasons.map((reason) => (
            <Text key={reason} style={styles.reasonText}>
              • {reason}
            </Text>
          ))}
        </View>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <View style={styles.actionsRow}>
          {secondaryActionLabel && (
            <Pressable style={[styles.button, styles.secondaryButton]} onPress={onSecondaryAction}>
              <Text style={styles.secondaryButtonText}>{secondaryActionLabel}</Text>
            </Pressable>
          )}
          {actionLabel && (
            <Pressable style={[styles.button, styles.primaryButton]} onPress={onAction}>
              <Text style={styles.primaryButtonText}>{actionLabel}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  name: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  meta: { fontSize: 13, color: '#6b6b6b', marginTop: 2 },
  scoreBadge: {
    backgroundColor: '#E7F6EC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  scoreText: { color: '#1E8E4C', fontWeight: '700', fontSize: 12 },
  reasons: { marginTop: 10, paddingLeft: 4 },
  reasonText: { fontSize: 12.5, color: '#4a4a4a', marginTop: 2 },
  actionsRow: { flexDirection: 'row', marginTop: 12, gap: 10 },
  button: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  primaryButton: { backgroundColor: '#FF6B35' },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  secondaryButton: { backgroundColor: '#F0F0F0' },
  secondaryButtonText: { color: '#333', fontWeight: '600' },
});
