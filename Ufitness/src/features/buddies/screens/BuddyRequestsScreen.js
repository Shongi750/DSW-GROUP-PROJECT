/**
 * BuddyRequestsScreen (FR-34) — incoming buddy requests for the signed-in student.
 * respondToBuddyRequest updates Supabase buddy_requests (or local cache); parent can refresh matched list on accept.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import BuddyCard from '../components/BuddyCard';
import { getIncomingRequests, respondToBuddyRequest } from '../services/buddyService';
import { useSyncTick } from '../../../lib/autoSync';
import { useTheme } from '../../../context/ThemeContext';

const display = { fontFamily: 'Anton_400Regular', letterSpacing: 0.8 };

// Props:
// currentStudent: student profile object
// onBuddyMatched?: () => void — notify parent so matched buddies list can refresh
export default function BuddyRequestsScreen({ currentStudent, onBuddyMatched }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    const requests = await getIncomingRequests(currentStudent.id);
    setItems(requests.map((request) => ({ request, sender: request.sender })).filter((item) => item.sender));
    setLoading(false);
  }, [currentStudent.id]);

  // syncTick goes up after the phone reconnects and the offline queue is sent.
  const syncTick = useSyncTick();
  useEffect(() => {
    loadRequests();
  }, [loadRequests, syncTick]);

  const handleRespond = async (requestId, decision) => {
    await respondToBuddyRequest(requestId, decision);
    setItems((prev) => prev.filter((item) => item.request.id !== requestId));
    if (decision === 'accepted' && onBuddyMatched) onBuddyMatched();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.brand} />
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

function createStyles(colors, isDark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 16 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    title: { ...display, fontSize: 24, color: colors.text, marginBottom: 16, textTransform: 'uppercase' },
    emptyText: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  });
}
