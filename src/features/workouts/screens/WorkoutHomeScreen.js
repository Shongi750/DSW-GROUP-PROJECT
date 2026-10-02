import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#BA4A0C', 
  teal: '#006B63',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  textDark: '#1A1A1A',
  textLight: '#666666',
  border: '#EEEEEE',
};

// Clean, rock-solid local workout catalog — zero network errors, zero API keys
const STABLE_WORKOUT_PLANS = [
  {
    id: 'plan_1',
    title: 'Full Body Ignition',
    category: 'Strength',
    level: 'Beginner',
    duration: '30 Min',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80',
    exercises: [
      {
        id: 'ex_1',
        name: 'PUSH UPS',
        category: 'Chest',
        sets: 3,
        reps: '10-12',
        description: 'Keep core tight and lower chest smoothly to the floor.',
        gifUrl: 'https://media.giphy.com/media/3o6ZsS8MR8Xm36hJII/giphy.gif'
      },
      {
        id: 'ex_2',
        name: 'BODYWEIGHT SQUATS',
        category: 'Legs',
        sets: 3,
        reps: '15',
        description: 'Drive through your heels and keep your chest upright.',
        gifUrl: 'https://media.giphy.com/media/1xONa28nLgI6r3X2w8/giphy.gif'
      }
    ]
  },
  {
    id: 'plan_2',
    title: 'Core & Mobility Flow',
    category: 'Mobility',
    level: 'All Levels',
    duration: '25 Min',
    imageUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80',
    exercises: [
      {
        id: 'ex_3',
        name: 'PLANK HOLD',
        category: 'Core',
        sets: 3,
        reps: '45s',
        description: 'Maintain a straight line from your head down to your heels.',
        gifUrl: 'https://media.giphy.com/media/xT8qBvH1pAhtfLlC2k/giphy.gif'
      },
      {
        id: 'ex_4',
        name: 'DYNAMIC STRETCH',
        category: 'Flexibility',
        sets: 2,
        reps: '10 each',
        description: 'Open up your shoulders and hips with controlled sweeps.',
        gifUrl: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif'
      }
    ]
  }
];

export default function WorkoutHomeScreen({ navigation }) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Instantaneous local load
    const timer = setTimeout(() => {
      setWorkouts(STABLE_WORKOUT_PLANS);
      setLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const renderWorkout = ({ item, index }) => {
    const isTealTag = index % 2 === 1;
    const coverUri = item.imageUrl || item.exercises?.[0]?.gifUrl;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('ActiveWorkout', { workout: item })}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: coverUri }} style={styles.cardImage} resizeMode="cover" />
          <View style={[styles.badge, isTealTag ? styles.tealBadge : styles.orangeBadge]}>
            <Text style={styles.badgeText}>
              {(item.category || 'WORKOUT').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>⏱ {item.duration}</Text>
            <Text style={styles.metaDivider}>•</Text>
            <Text style={styles.metaText}>💪 {item.level}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: COLORS.textLight, fontWeight: '600' }}>Loading Workouts...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={renderWorkout}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>Your Training Plan</Text>
            <Text style={styles.headerSubtitle}>
              Select a routine to launch your active session.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },

  headerSection: { paddingTop: 16, marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textDark, marginBottom: 6 },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, lineHeight: 18, marginBottom: 10 },

  card: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 170,
    backgroundColor: COLORS.surface
  },
  cardImage: { width: '100%', height: '100%' },
  
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  orangeBadge: { backgroundColor: COLORS.primary },
  tealBadge: { backgroundColor: COLORS.teal },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  cardContent: { padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textDark, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
  metaDivider: { marginHorizontal: 8, color: '#CCC' },
});