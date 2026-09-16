import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView
} from 'react-native';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';

const COLORS = {
  primary: '#BA4A0C', // Figma Burnt Orange
  teal: '#006B63',    // Figma Deep Teal
  background: '#FFFFFF',
  surface: '#F8F9FA',
  textDark: '#1A1A1A',
  textLight: '#666666',
  border: '#EEEEEE',
};

// Fallback images matching the Figma aesthetic if workout plans lack cover images
const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80',
  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
];

// ✨ HELPER: Maps a user's chosen goal to a list of related workout keywords
const getKeywordsForGoal = (goal) => {
  const normalizedGoal = goal.toLowerCase();
  
  if (normalizedGoal.includes('muscle') || normalizedGoal.includes('strength') || normalizedGoal.includes('bulk')) {
    return ['strength', 'power', 'muscle', 'weight', 'barbell', 'heavy', 'hypertrophy'];
  }
  if (normalizedGoal.includes('weight') || normalizedGoal.includes('fat') || normalizedGoal.includes('lose')) {
    return ['hiit', 'cardio', 'burn', 'sweat', 'interval', 'endurance', 'shred'];
  }
  if (normalizedGoal.includes('flex') || normalizedGoal.includes('recover') || normalizedGoal.includes('mobil')) {
    return ['mobility', 'yoga', 'stretch', 'recovery', 'flow', 'flexibility'];
  }
  
  // Default to general fitness / everyday movement
  return ['full body', 'general', 'core', 'circuit', 'stamina', 'beginner', 'basics'];
};

export default function WorkoutHomeScreen({ navigation }) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userGoal, setUserGoal] = useState('');

  const handleBuildPlanFromExercises = async () => {
    try {
      setLoading(true);
      const exercisesSnapshot = await getDocs(collection(db, 'exercises'));
      const rawExercises = exercisesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      if (rawExercises.length === 0) {
        Alert.alert("Error", "No exercises found. Seed the API first!");
        setLoading(false);
        return;
      }

      const selectedExercises = rawExercises.slice(0, 5).map(ex => {
        const descriptionText = Array.isArray(ex.instructions) 
          ? ex.instructions.join(' ') 
          : 'Follow standard form for this movement.';

        return {
          id: ex.id,
          category: ex.bodyPart || 'General',
          name: (ex.name || 'Unknown').toUpperCase(),
          description: descriptionText,
          gifUrl: ex.gifUrl || '',
          sets: 3,
          reps: '10-12',
          rest: '60s'
        };
      });

      const dynamicPlan = {
        id: 'wp_api_generated_1',
        category: 'Full Body',
        title: 'Full Body Power',
        duration: '45 Min',
        level: 'Intermediate',
        imageUrl: DEFAULT_IMAGES[0],
        exercises: selectedExercises
      };

      await setDoc(doc(db, 'workout_plans', dynamicPlan.id), dynamicPlan);
      Alert.alert("Success!", "Built a workout plan from your API data!");
    } catch (error) {
      console.error("Error building plan: ", error);
      Alert.alert("Error", "Check your console.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchWorkoutsAndUser = async () => {
      try {
        const currentUserId = auth.currentUser?.uid;
        let goal = '';

        if (currentUserId) {
          const userDocRef = doc(db, 'users', currentUserId);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            goal = userSnap.data().goal ? userSnap.data().goal.toLowerCase() : '';
            setUserGoal(userSnap.data().goal || 'General Fitness');
          }
        }

        const querySnapshot = await getDocs(collection(db, 'workout_plans'));
        const workoutsData = querySnapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));

        // ✨ IMPLEMENTED KEYWORD FILTERING LOGIC HERE ✨
        if (goal) {
          const targetKeywords = getKeywordsForGoal(goal);

          const filteredWorkouts = workoutsData.filter(item => {
            const itemCategory = item.category ? item.category.toLowerCase() : '';
            const itemTitle = item.title ? item.title.toLowerCase() : '';
            const itemDesc = item.description ? item.description.toLowerCase() : '';

            // Check if ANY of our mapped keywords exist in the workout data
            return targetKeywords.some(keyword => 
              itemCategory.includes(keyword) || 
              itemTitle.includes(keyword) || 
              itemDesc.includes(keyword)
            );
          });

          // Fallback to all workouts if the filter returns nothing so it's not totally empty
          setWorkouts(filteredWorkouts.length > 0 ? filteredWorkouts : workoutsData);
        } else {
          setWorkouts(workoutsData);
        }
      } catch (error) {
        console.error("Error fetching workouts: ", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = navigation.addListener('focus', () => {
      fetchWorkoutsAndUser();
    });

    fetchWorkoutsAndUser();
    return unsubscribe;
  }, [navigation]);

  const renderWorkout = ({ item, index }) => {
    const isTealTag = (item.category || '').toLowerCase().includes('mobility') || index % 2 === 1;
    const coverUri = item.imageUrl || item.exercises?.[0]?.gifUrl || DEFAULT_IMAGES[index % DEFAULT_IMAGES.length];

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
            <Text style={styles.metaText}>⏱ {item.duration || '30 Min'}</Text>
            <Text style={styles.metaDivider}>•</Text>
            <Text style={styles.metaText}>💪 {item.level || 'Beginner'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
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
            <Text style={styles.headerTitle}>Recommended Workouts</Text>
            <Text style={styles.headerSubtitle}>
              Tailored plans to boost your campus energy.
            </Text>

            {/* Quick Action Bar */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={() => navigation.navigate('CustomWorkoutBuilder')}
              >
                <Text style={styles.primaryActionText}>+ Build Custom</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={handleBuildPlanFromExercises}
              >
                <Text style={styles.secondaryActionText}>⚡ Seed API</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No workouts found for your goal yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // Header Typography (matching Figma)
  headerSection: { paddingTop: 16, marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textDark, marginBottom: 6 },
  headerSubtitle: { fontSize: 14, color: COLORS.textLight, lineHeight: 20, marginBottom: 18 },

  // Actions
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  primaryActionButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  primaryActionText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  secondaryActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  secondaryActionText: { color: COLORS.textDark, fontWeight: '600', fontSize: 14 },

  // Vertical Workout Cards (matching Figma)
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
    backgroundColor: COLORS.surface
  },
  cardImage: { width: '100%', height: '100%' },
  
  // Floating Tag
  badge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  orangeBadge: { backgroundColor: COLORS.primary },
  tealBadge: { backgroundColor: COLORS.teal },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  // Card Text
  cardContent: { padding: 16 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textDark, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 13, color: COLORS.textLight, fontWeight: '500' },
  metaDivider: { marginHorizontal: 8, color: '#CCC' },

  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: COLORS.textLight, fontSize: 14 }
});