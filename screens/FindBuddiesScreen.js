// screens/FindBuddiesScreen.js
// FR-31: find potential workout buddies
// FR-32: recommend buddies based on matching criteria
// FR-33: send buddy requests
//
// Styled to match the UFitness "Connect & Grow" mockup: app header,
// intro copy, Buddies/Mentors toggle, campus filter chips, and buddy cards.

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import BuddyCard from '../components/BuddyCard';
import { findPotentialBuddies, sendBuddyRequest } from '../services/buddyService';

const BRAND = '#8C3A12';
const ACCENT = '#F97316';
const BG = '#F7F9FA';
const TEXT = '#1F2933';
const MUTED = '#6B7280';

const CAMPUS_FILTERS = ['All Campuses', 'APK', 'APB', 'DFC', 'SW'];

// Props:
// currentStudent (student profile object, must include id)
// onMessage? - called with a student when the message button is tapped
export default function FindBuddiesScreen({ currentStudent, onMessage }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sentRequestIds, setSentRequestIds] = useState(new Set());
  const [tab, setTab] = useState('Buddies'); // 'Buddies' | 'Mentors'
  const [campusFilter, setCampusFilter] = useState('All Campuses');

  const loadMatches = useCallback(async () => {
    const results = await findPotentialBuddies(currentStudent);
    setMatches(results);
  }, [currentStudent]);

  useEffect(() => {
    setLoading(true);
    loadMatches().finally(() => setLoading(false));
  }, [loadMatches]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const handleSendRequest = async (toStudentId) => {
    await sendBuddyRequest(currentStudent.id, toStudentId);
    setSentRequestIds((prev) => new Set(prev).add(toStudentId));
  };

  // Campus chips filter the already-scored match list client-side.
  const visibleMatches = useMemo(() => {
    if (campusFilter === 'All Campuses') return matches;
    return matches.filter((m) => m.student.campus === campusFilter);
  }, [matches, campusFilter]);

  const renderHeader = () => (
    <View>
      <Text style={styles.title}>Connect &amp; Grow</Text>
      <Text style={styles.intro}>
        Find a workout buddy to stay motivated or connect with a mentor to reach your fitness goals
        faster.
      </Text>

      {/* Buddies / Mentors toggle */}
      <View style={styles.segment}>
        {['Buddies', 'Mentors'].map((option) => {
          const active = tab === option;
          return (
            <Pressable
              key={option}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
              onPress={() => setTab(option)}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Campus filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {CAMPUS_FILTERS.map((campus) => {
          const active = campusFilter === campus;
          return (
            <Pressable
              key={campus}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setCampusFilter(campus)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{campus}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* App header */}
      <View style={styles.header}>
        {currentStudent.avatarUrl ? (
          <Image source={{ uri: currentStudent.avatarUrl }} style={styles.headerAvatar} />
        ) : (
          <View style={[styles.headerAvatar, styles.headerAvatarFallback]}>
            <Text style={styles.headerAvatarText}>{currentStudent.name.charAt(0)}</Text>
          </View>
        )}
        <Text style={styles.brand}>UFitness</Text>
        <View style={{ flex: 1 }} />
        <Icon name="notifications-outline" size={24} color={TEXT} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : tab === 'Mentors' ? (
        <ScrollView contentContainerStyle={styles.listContent}>
          {renderHeader()}
          <Text style={styles.emptyText}>Mentor matching is coming soon.</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={visibleMatches}
          keyExtractor={(item) => item.student.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {campusFilter === 'All Campuses'
                ? 'No potential buddies found right now. Check back soon!'
                : `No buddies found at ${campusFilter} yet.`}
            </Text>
          }
          renderItem={({ item }) => {
            const alreadySent = sentRequestIds.has(item.student.id);
            return (
              <BuddyCard
                student={item.student}
                matchScore={item.matchScore}
                matchReasons={item.matchReasons}
                actionLabel={alreadySent ? 'Request sent' : 'Connect'}
                onAction={() => !alreadySent && handleSendRequest(item.student.id)}
                disabled={alreadySent}
                onMessage={onMessage}
              />
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F3',
  },
  headerAvatar: { width: 34, height: 34, borderRadius: 17 },
  headerAvatarFallback: { backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  brand: { fontSize: 21, fontWeight: '800', color: BRAND, letterSpacing: 0.2 },

  listContent: { padding: 16, paddingBottom: 32 },

  title: { fontSize: 25, fontWeight: '700', color: TEXT, textAlign: 'center', marginTop: 10 },
  intro: {
    fontSize: 15.5,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 23,
    marginTop: 10,
    paddingHorizontal: 4,
  },

  segment: {
    flexDirection: 'row',
    backgroundColor: '#EBEFF1',
    borderRadius: 14,
    padding: 5,
    marginTop: 22,
  },
  segmentItem: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  segmentItemActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentText: { fontSize: 15.5, fontWeight: '700', color: MUTED },
  segmentTextActive: { color: BRAND },

  chipRow: { gap: 10, paddingVertical: 18, paddingRight: 8 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: '#E7EBEE',
  },
  chipActive: { backgroundColor: ACCENT },
  chipText: { fontSize: 14.5, fontWeight: '600', color: '#374151' },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  emptyText: { textAlign: 'center', color: MUTED, marginTop: 40, fontSize: 14.5 },
});
