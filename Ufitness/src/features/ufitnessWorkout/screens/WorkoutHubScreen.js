import React, { useMemo } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../context/AppContext';
import { workoutsForPreference } from '../data/workouts';

export default function WorkoutHubScreen({ navigation }) {
  const { profile } = useApp();
  const workouts = useMemo(
    () => workoutsForPreference(profile.workoutPreference),
    [profile.workoutPreference],
  );
  const featured = workouts[0];
  const rest = workouts.slice(1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FB" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>UFITNESS WORKOUTS</Text>
        <Text style={styles.title}>Train around campus</Text>
        <Text style={styles.subtitle}>
          {profile.workoutPreference
            ? `Sorted for ${profile.workoutPreference.toLowerCase()} sessions around campus.`
            : 'Sessions that match your UFitness plan and campus routine.'}
        </Text>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Workout</Text>
        </View>

        <View style={styles.featuredCard}>
          <View style={styles.imageWrapper}>
            <Image source={{ uri: featured.image }} style={styles.featuredImage} />
            <View style={styles.badge}>
              <View style={styles.orangeDot} />
              <Text style={styles.badgeText}>{featured.category}</Text>
            </View>
          </View>
          <View style={styles.featuredBody}>
            <Text style={styles.featuredTitle}>{featured.title}</Text>
            <Text style={styles.featuredCopy}>{featured.description}</Text>
            <View style={styles.featuredFooter}>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={14} color="#7A7A7A" />
                <Text style={styles.metaText}>
                  {featured.durationMin} Min • {featured.level}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => navigation.navigate('WorkoutDetail', { workoutId: featured.id })}
              >
                <Text style={styles.startBtnText}>START</Text>
                <Ionicons name="caret-forward" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>More sessions</Text>
        </View>

        {rest.map((workout) => (
          <TouchableOpacity
            key={workout.id}
            style={styles.rowCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('WorkoutDetail', { workoutId: workout.id })}
          >
            <Image source={{ uri: workout.image }} style={styles.rowImage} />
            <View style={styles.rowBody}>
              <Text style={styles.rowTag}>{workout.category}</Text>
              <Text style={styles.rowTitle}>{workout.title}</Text>
              <Text style={styles.rowMeta}>
                {workout.durationMin} min • {workout.level} • {workout.location}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C5C5C7" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB' },
  scroll: { padding: 20, paddingBottom: 32 },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D96B27',
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#1C1C1E' },
  subtitle: {
    marginTop: 6,
    marginBottom: 22,
    fontSize: 13,
    lineHeight: 19,
    color: '#6C6C70',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F3',
    marginBottom: 24,
  },
  imageWrapper: { height: 180, position: 'relative' },
  featuredImage: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orangeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D96B27' },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#1C1C1E', letterSpacing: 0.5 },
  featuredBody: { padding: 16 },
  featuredTitle: { fontSize: 18, fontWeight: '800', color: '#1C1C1E', marginBottom: 6 },
  featuredCopy: { fontSize: 12, color: '#6C6C70', lineHeight: 18, marginBottom: 16 },
  featuredFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6C6C70', fontWeight: '500' },
  startBtn: {
    backgroundColor: '#BD4800',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  startBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  rowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F0F0F3',
    marginBottom: 12,
  },
  rowImage: { width: 72, height: 72, borderRadius: 12 },
  rowBody: { flex: 1 },
  rowTag: { fontSize: 10, fontWeight: '700', color: '#00A8A8', letterSpacing: 0.5, marginBottom: 3 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', marginBottom: 4 },
  rowMeta: { fontSize: 11, color: '#8A8A8E', fontWeight: '500' },
});
