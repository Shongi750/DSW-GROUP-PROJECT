// screens/MatchedBuddiesScreen.js
// FR-35: allow matched buddies to view each other's basic fitness information

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { getMatchedBuddies, unfriendBuddy } from '../services/buddyService';
import { useTheme } from '../../../context/ThemeContext';

// Props:
// currentStudent: student profile object
// refreshKey?: number — bump this from a parent to force a reload after a new match
export default function MatchedBuddiesScreen({ currentStudent, refreshKey }) {
  const { colors } = useTheme();
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
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>My Workout Buddies</Text>

      <FlatList
        data={buddies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            You haven't matched with a buddy yet. Go find one!
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.infoCard}>
            <Text style={styles.name}>{item.name}</Text>
            <InfoRow label="Campus" value={item.campus} />
            <InfoRow label="Goal" value={item.fitnessGoal} />
            <InfoRow label="Experience" value={item.experienceLevel} />
            <InfoRow label="Preferred location" value={item.workoutLocation} />
            <InfoRow label="Usual training days" value={(item.preferredSchedule || []).join(', ')} />
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
        )}
      />
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F8', padding: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 40 },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  name: { fontSize: 17, fontWeight: '700', marginBottom: 8, color: '#1a1a1a' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoLabel: { color: '#8a8a8a', fontSize: 13 },
  infoValue: { color: '#2a2a2a', fontSize: 13, fontWeight: '600' },
  unfriendBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#B42318',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  unfriendText: { color: '#B42318', fontSize: 13, fontWeight: '700' },
});
