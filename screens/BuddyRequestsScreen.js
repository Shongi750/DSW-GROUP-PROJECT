// screens/BuddyRequestsScreen.js
// FR-34: allow students to accept or reject buddy requests

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import BuddyCard from '../components/BuddyCard';
import { getIncomingRequests, getStudentById, respondToBuddyRequest } from '../services/buddyService';

// Props:
// currentStudent: student profile object
// onBuddyMatched?: () => void — notify parent so matched buddies list can refresh
export default function BuddyRequestsScreen({ currentStudent, onBuddyMatched }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    const requests = await getIncomingRequests(currentStudent.id);
    const withSenders = requests
      .map((request) => {
        const sender = getStudentById(request.fromStudentId);
        return sender ? { request, sender } : null;
      })
      .filter((item) => item !== null);
    setItems(withSenders);
    setLoading(false);
  }, [currentStudent.id]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleRespond = async (requestId, decision) => {
    await respondToBuddyRequest(requestId, decision);
    setItems((prev) => prev.filter((item) => item.request.id !== requestId));
    if (decision === 'accepted' && onBuddyMatched) onBuddyMatched();
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
      <Text style={styles.title}>Buddy Requests</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.request.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No pending requests.</Text>}
        renderItem={({ item }) => (
          <BuddyCard
            student={item.sender}
            actionLabel="Accept"
            onAction={() => handleRespond(item.request.id, 'accepted')}
            secondaryActionLabel="Reject"
            onSecondaryAction={() => handleRespond(item.request.id, 'rejected')}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F8', padding: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 40 },
});
