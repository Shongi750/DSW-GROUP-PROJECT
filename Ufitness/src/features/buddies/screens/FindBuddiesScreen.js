/**
 * FindBuddiesScreen — match students by campus/goal via buddyService + listStudents.
 * Buddies tab sends requests; Mentors tab delegates to onOpenMentors (full mentor flow).
 */
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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, display, radius, spacing } from '../../../context/ThemeContext';
import InspoBackground from '../../../components/InspoBackground';
import BuddyCard from '../components/BuddyCard';
import { findPotentialBuddies, sendBuddyRequest } from '../services/buddyService';
import { listStudents, mentorsFrom } from '../../../lib/students';
import { useSyncTick } from '../../../lib/autoSync';
import { SkeletonCard } from '../../../components/Skeleton';

const CAMPUS_FILTERS = ['All Campuses', 'APK', 'APB', 'DFC', 'SWC'];

/** UJ campuses can be stored as "APK" or "APK — …"; chip filter still matches. */
function campusMatches(studentCampus, filter) {
  if (filter === 'All Campuses') return true;
  const c = String(studentCampus || '');
  return c === filter || c.startsWith(filter);
}

export default function FindBuddiesScreen({ currentStudent, onMessage, onOpenMentors, navigation }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sentRequestIds, setSentRequestIds] = useState(new Set());
  const [mentors, setMentors] = useState([]);
  const [tab, setTab] = useState('Buddies');
  const [campusFilter, setCampusFilter] = useState('All Campuses');

  const loadMatches = useCallback(async () => {
    const results = await findPotentialBuddies(currentStudent);
    const directory = await listStudents();
    setMatches(results);
    // Same rule as Find a Mentor: students who hold the mentor role
    setMentors(mentorsFrom(directory, currentStudent?.id));
  }, [currentStudent]);

  // Reload after reconnecting (syncTick) as well as on first open.
  const syncTick = useSyncTick();
  useEffect(() => {
    setLoading(true);
    loadMatches().finally(() => setLoading(false));
  }, [loadMatches, syncTick]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const handleSendRequest = async (toStudentId) => {
    const result = await sendBuddyRequest(currentStudent.id, toStudentId);
    if (result) {
      setSentRequestIds((prev) => new Set(prev).add(toStudentId));
      Alert.alert('Request sent', 'They will see it under Buddy requests.');
    } else {
      Alert.alert('Could not send', 'Try again when you are online.');
    }
  };

  const visibleMatches = useMemo(() => {
    return matches.filter((m) => campusMatches(m.student.campus, campusFilter));
  }, [matches, campusFilter]);

  const visibleMentors = useMemo(() => {
    return mentors.filter((student) => campusMatches(student.campus, campusFilter));
  }, [mentors, campusFilter]);

  const renderHeader = () => (
    <View>
      <Text style={styles.kicker}>CONNECT</Text>
      <Text style={styles.title}>Find your people</Text>
      <Text style={styles.intro}>Train with someone on your campus — or get a senior mentor.</Text>

      <View style={styles.segment}>
        {['Buddies', 'Mentors'].map((option) => {
          const active = tab === option;
          return (
            <Pressable
              key={option}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
              onPress={() => {
                if (option === 'Mentors' && onOpenMentors) {
                  onOpenMentors();
                  return;
                }
                setTab(option);
              }}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>

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
      <InspoBackground plate="community" />
      <View style={styles.header}>
        {currentStudent.avatarUrl ? (
          <Image source={{ uri: currentStudent.avatarUrl }} style={styles.headerAvatar} />
        ) : (
          <View style={[styles.headerAvatar, styles.headerAvatarFallback]}>
            <Text style={styles.headerAvatarText}>{currentStudent.name.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.brandRow}>
          <Text style={[styles.brand, { color: colors.text }]}>U</Text>
          <Text style={[styles.brand, { color: colors.brand }]}>FITNESS</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => navigation?.navigate('Requests')} style={{ marginRight: 14 }} hitSlop={8}>
          <Ionicons name="mail-unread-outline" size={22} color={colors.text} />
        </Pressable>
        <Pressable onPress={() => navigation?.navigate('MyBuddies')} hitSlop={8}>
          <Ionicons name="people-circle-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      {loading ? (
        // Skeleton cards instead of a spinner while buddies load
        <View style={{ paddingTop: 16 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : tab === 'Mentors' ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {renderHeader()}
          {visibleMentors.length ? (
            visibleMentors.map((student) => (
              <BuddyCard
                key={student.id}
                student={student}
                actionLabel="View mentors"
                onAction={() => onOpenMentors?.()}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>
              No intermediate or advanced students yet. They appear here after they finish setup.
            </Text>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={visibleMatches}
          keyExtractor={(item) => item.student.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brand}
              colors={[colors.brand]}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {campusFilter === 'All Campuses'
                ? 'No other signed-in students yet. When someone else finishes setup, they show up here.'
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
                actionLabel={alreadySent ? 'Requested' : 'Connect'}
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

function createStyles(colors, isDark) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'transparent' },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: 'transparent',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.12)',
    },
    headerAvatar: { width: 34, height: 34, borderRadius: 17 },
    headerAvatarFallback: { backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
    headerAvatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
    brandRow: { flexDirection: 'row', alignItems: 'center' },
    brand: { ...display, fontSize: 20, textTransform: 'uppercase' },
    listContent: { padding: spacing.card, paddingBottom: 32 },
    kicker: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.4,
      color: colors.brand,
      textAlign: 'center',
      marginTop: 8,
    },
    title: {
      ...display,
      fontSize: 28,
      color: '#FFFFFF',
      textAlign: 'center',
      marginTop: 6,
      textTransform: 'uppercase',
    },
    intro: {
      fontSize: 14,
      color: '#C9C9C9',
      textAlign: 'center',
      lineHeight: 20,
      marginTop: 8,
      paddingHorizontal: 8,
    },
    segment: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: radius.image,
      padding: 4,
      marginTop: 18,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
    },
    segmentItem: { flex: 1, paddingVertical: 12, borderRadius: radius.pill, alignItems: 'center' },
    segmentItemActive: { backgroundColor: colors.brand },
    segmentText: { fontSize: 15, fontWeight: '700', color: '#C9C9C9' },
    segmentTextActive: { color: '#FFFFFF' },
    chipRow: { gap: 10, paddingVertical: 16, paddingRight: 8 },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
    },
    chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
    chipText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
    chipTextActive: { color: '#FFFFFF', fontWeight: '700' },
    emptyText: { textAlign: 'center', color: '#C9C9C9', marginTop: 40, fontSize: 14.5 },
  });
}
