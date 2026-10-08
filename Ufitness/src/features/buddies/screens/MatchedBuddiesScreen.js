/**
 * MatchedBuddiesScreen (FR-35) — accepted buddies and shared profile fields.
 * Chat via onMessage; unfriendBuddy removes the match using the stored requestId.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { getMatchedBuddies, unfriendBuddy } from '../services/buddyService';
import { useTheme } from '../../../context/ThemeContext';
import { SkeletonCard } from '../../../components/Skeleton';

const display = { fontFamily: 'Anton_400Regular', letterSpacing: 0.8 };

// Props:
// currentStudent: student profile object
// refreshKey?: number — bump this from a parent to force a reload after a new match
export default function MatchedBuddiesScreen({ currentStudent, refreshKey, onMessage }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [buddies, setBuddies] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBuddies = useCallback(async () => {
    setLoading(true);
    const matched = await getMatchedBuddies(currentStudent.id);
    setBuddies(matched);
    setLoading(false);
  }, [currentStudent.id]);

  useEffect(() => {
    loadBuddies();
  }, [loadBuddies, refreshKey]);

  if (loading) {
    return (
      <View style={{ paddingTop: 16 }}>
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Workout Buddies</Text>

      <FlatList
        data={buddies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            You haven’t matched with a buddy yet. Go find one!
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.infoCard}>
            <Text style={styles.name}>{item.name}</Text>
            <InfoRow label="Campus" value={item.campus} styles={styles} />
            <InfoRow label="Goal" value={item.fitnessGoal} styles={styles} />
            <InfoRow label="Experience" value={item.experienceLevel} styles={styles} />
            <InfoRow label="Preferred location" value={item.workoutLocation} styles={styles} />
            <InfoRow
              label="Usual training days"
              value={(item.preferredSchedule || []).join(', ')}
              styles={styles}
            />
            <View style={styles.actionRow}>
              {onMessage ? (
                <TouchableOpacity style={styles.chatBtn} onPress={() => onMessage(item)}>
                  <Text style={styles.chatText}>Chat</Text>
                </TouchableOpacity>
              ) : null}
              {item.requestId ? (
                <TouchableOpacity
                  style={styles.unfriendBtn}
                  onPress={() => {
                    Alert.alert('Unfriend', `Remove ${item.name} from your workout buddies?`, [
                      { text: 'Keep', style: 'cancel' },
                      {
                        text: 'Unfriend',
                        style: 'destructive',
                        onPress: async () => {
                          await unfriendBuddy(item.requestId);
                          loadBuddies();
                        },
                      },
                    ]);
                  }}
                >
                  <Text style={styles.unfriendText}>Unfriend</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}
      />
    </View>
  );
}

function InfoRow({ label, value, styles }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function createStyles(colors, isDark) {
  const danger = isDark ? '#F87171' : '#B42318';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 16 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    title: { ...display, fontSize: 24, color: colors.text, marginBottom: 16, textTransform: 'uppercase' },
    emptyText: { textAlign: 'center', color: colors.muted, marginTop: 40 },
    infoCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    name: { fontSize: 17, fontWeight: '700', marginBottom: 8, color: colors.text },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    infoLabel: { color: colors.muted, fontSize: 13 },
    infoValue: { color: colors.text, fontSize: 13, fontWeight: '600' },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 12,
    },
    chatBtn: {
      borderWidth: 1,
      borderColor: colors.brand,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.brand,
    },
    chatText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
    unfriendBtn: {
      borderWidth: 1,
      borderColor: danger,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    unfriendText: { color: danger, fontSize: 13, fontWeight: '700' },
  });
}
