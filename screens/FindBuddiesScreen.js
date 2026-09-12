// screens/FindBuddiesScreen.js
// FR-31: find potential workout buddies
// FR-32: recommend buddies based on matching criteria
// FR-33: send buddy requests

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import BuddyCard from '../components/BuddyCard';
import { findPotentialBuddies, sendBuddyRequest } from '../services/buddyService';

// Props: currentStudent (student profile object)
export default function FindBuddiesScreen({ currentStudent }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentRequestIds, setSentRequestIds] = useState(new Set());

  const loadMatches = useCallback(() => {
    setLoading(true);
    // Matching runs client-side against mock data here; swap for an API call
    // (e.g. GET /api/buddies/matches) when the backend is available.
    const results = findPotentialBuddies(currentStudent);
    setMatches(results);
    setLoading(false);
  }, [currentStudent]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const handleSendRequest = async (toStudentId) => {
    await sendBuddyRequest(currentStudent.id, toStudentId);
    setSentRequestIds((prev) => new Set(prev).add(toStudentId));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find a Workout Buddy</Text>
      <Text style={styles.subtitle}>
        Matched by campus, goal, experience level and schedule
      </Text>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.student.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={loadMatches} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No potential buddies found right now. Check back soon!
          </Text>
        }
        renderItem={({ item }) => (
          <BuddyCard
            student={item.student}
            matchScore={item.matchScore}
            matchReasons={item.matchReasons}
            actionLabel={sentRequestIds.has(item.student.id) ? 'Request sent' : 'Send request'}
            onAction={() => !sentRequestIds.has(item.student.id) && handleSendRequest(item.student.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F8', padding: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#6b6b6b', marginTop: 4, marginBottom: 16 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 40 },
});
