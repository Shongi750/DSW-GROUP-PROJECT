// screens/MatchedBuddiesScreen.js
// FR-35: allow matched buddies to view each other's basic fitness information

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { getMatchedBuddies } from '../services/buddyService';

// Props:
// currentStudent: student profile object
// refreshKey?: number — bump this from a parent to force a reload after a new match
export default function MatchedBuddiesScreen({ currentStudent, refreshKey }) {
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
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
            <InfoRow label="Usual training days" value={item.preferredSchedule.join(', ')} />
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
});
