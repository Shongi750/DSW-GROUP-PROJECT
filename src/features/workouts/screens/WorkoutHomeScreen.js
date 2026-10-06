import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image
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

function getTodayWorkout() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()];

  const workoutsByDay = {
    'Monday': {
      title: 'Upper Body Power & Chest',
      category: 'Strength',
      duration: '45 Min',
      imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80',
      exercises: [
        { 
          id: '1', name: 'Barbell Bench Press', sets: 4, reps: '8-10', description: 'Control descent, press explosively.', 
          gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press/images/0.jpg' 
        },
        { 
          id: '2', name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', description: 'Focus on upper chest contraction.', 
          gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Fly/images/0.jpg' 
        },
        { 
          id: '3', name: 'Overhead Shoulder Press', sets: 3, reps: '10', description: 'Keep core braced, press overhead.', 
          gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Shoulder_Press/images/0.jpg' 
        },
        { 
          id: '4', name: 'Lateral Raises', sets: 3, reps: '15', description: 'Controlled movement targeting side delts.', 
          gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Lateral_Raise/images/0.jpg' 
        },
        { 
          id: '5', name: 'Tricep Pushdowns', sets: 3, reps: '12', description: 'Keep elbows locked at your sides.', 
          gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Pushdown/images/0.jpg' 
        },
        { 
          id: '6', name: 'Push-Ups to Failure', sets: 3, reps: 'Max', description: 'Full range of motion burn-out set.', 
          gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushup/images/0.jpg' 
        }
      ]
    },
    'Tuesday': {
      title: 'Lower Body & Quad Focus',
      category: 'Strength',
      duration: '50 Min',
      imageUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80',
      exercises: [
        { id: '1', name: 'Barbell Back Squats', sets: 4, reps: '8', description: 'Depth parallel or lower, drive through heels.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/images/0.jpg' },
        { id: '2', name: 'Leg Press', sets: 3, reps: '10-12', description: 'Position feet shoulder-width on platform.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Sled_Leg_Press/images/0.jpg' },
        { id: '3', name: 'Bulgarian Split Squats', sets: 3, reps: '10 each', description: 'Keep torso upright for maximum quad load.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bulgarian_Split_Squat/images/0.jpg' },
        { id: '4', name: 'Leg Extensions', sets: 3, reps: '15', description: 'Squeeze quad at full lockout.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_extension/images/0.jpg' },
        { id: '5', name: 'Standing Calf Raises', sets: 4, reps: '20', description: 'Full stretch at the bottom, high peak.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Calf_raise/images/0.jpg' },
        { id: '6', name: 'Bodyweight Walking Lunges', sets: 3, reps: '20 steps', description: 'Steady breathing and balance.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bodyweight_lunge/images/0.jpg' }
      ]
    },
    'Wednesday': {
      title: 'Core & Cardio Conditioning',
      category: 'Cardio',
      duration: '35 Min',
      imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80',
      exercises: [
        { id: '1', name: 'High-Intensity Sprints', sets: 5, reps: '45s work / 15s rest', description: 'Maximum output.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Running/images/0.jpg' },
        { id: '2', name: 'Mountain Climbers', sets: 4, reps: '40s', description: 'Rapid alternating knee drives.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Mountain_climbers/images/0.jpg' },
        { id: '3', name: 'Weighted Russian Twists', sets: 3, reps: '20 each', description: 'Engage oblique rotation.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Russian_twist/images/0.jpg' },
        { id: '4', name: 'Hanging Leg Raises', sets: 3, reps: '12', description: 'Controlled swing-free movement.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hanging_leg_raise/images/0.jpg' },
        { id: '5', name: 'Burpees', sets: 4, reps: '12', description: 'Explosive full-body jump.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Burpee/images/0.jpg' },
        { id: '6', name: 'Plank Hold', sets: 3, reps: '60s', description: 'Solid straight-line posture.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/images/0.jpg' }
      ]
    },
    'Thursday': {
      title: 'Back & Posterior Chain',
      category: 'Strength',
      duration: '45 Min',
      imageUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80',
      exercises: [
        { id: '1', name: 'Conventional Deadlifts', sets: 4, reps: '5', description: 'Neutral spine, powerful hip hinge.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/images/0.jpg' },
        { id: '2', name: 'Lat Pulldowns', sets: 3, reps: '10-12', description: 'Pull bar toward upper chest.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Pulldown/images/0.jpg' },
        { id: '3', name: 'Seated Cable Rows', sets: 3, reps: '10', description: 'Retract scapula at peak contraction.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_cable_row/images/0.jpg' },
        { id: '4', name: 'Dumbbell Pullovers', sets: 3, reps: '12', description: 'Expand ribcage and stretch lats.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Pullover/images/0.jpg' },
        { id: '5', name: 'Face Pulls', sets: 3, reps: '15', description: 'Target rear delts and upper back posture.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Face_pull/images/0.jpg' },
        { id: '6', name: 'Dumbbell Bicep Curls', sets: 3, reps: '12', description: 'Strict form without momentum.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Curl/images/0.jpg' }
      ]
    },
    'Friday': {
      title: 'Full Body Athletic Circuit',
      category: 'Conditioning',
      duration: '40 Min',
      imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80',
      exercises: [
        { id: '1', name: 'Kettlebell Swings', sets: 4, reps: '15', description: 'Explosive hip drive.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Kettlebell_swing/images/0.jpg' },
        { id: '2', name: 'Push Press', sets: 3, reps: '10', description: 'Leg drive assisting overhead press.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Push_press/images/0.jpg' },
        { id: '3', name: 'Jump Squats', sets: 3, reps: '12', description: 'Explosive vertical lift.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Jump_squat/images/0.jpg' },
        { id: '4', name: 'Renegade Rows', sets: 3, reps: '10 each', description: 'Anti-rotation core stability.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Renegade_row/images/0.jpg' },
        { id: '5', name: 'Box Jumps', sets: 3, reps: '10', description: 'Land softly with bent knees.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Box_jump/images/0.jpg' },
        { id: '6', name: 'Farmer\'s Walk', sets: 3, reps: '50 meters', description: 'Heavy grip and core endurance.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Farmers_walk/images/0.jpg' }
      ]
    },
    'Saturday': {
      title: 'Glutes & Hamstring Isolation',
      category: 'Strength',
      duration: '45 Min',
      imageUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80',
      exercises: [
        { id: '1', name: 'Barbell Hip Thrusts', sets: 4, reps: '10-12', description: 'Drive hips upward, hard glute squeeze.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Hip_Thrust/images/0.jpg' },
        { id: '2', name: 'Romanian Deadlifts', sets: 3, reps: '10', description: 'Feel deep hamstring stretch.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Romanian_Deadlift/images/0.jpg' },
        { id: '3', name: 'Seated Leg Curls', sets: 3, reps: '12', description: 'Smooth controlled negative.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_leg_curl/images/0.jpg' },
        { id: '4', name: 'Cable Pull-Throughs', sets: 3, reps: '15', description: 'Hinge back and squeeze glutes.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_pull-through/images/0.jpg' },
        { id: '5', name: 'Single-Leg Glute Bridge', sets: 3, reps: '12 each', description: 'Focused isolated activation.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Single-leg_glute_bridge/images/0.jpg' },
        { id: '6', name: 'Standing Side Leg Raises', sets: 3, reps: '15', description: 'Abductor control.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_leg_raise/images/0.jpg' }
      ]
    },
    'Sunday': {
      title: 'Active Recovery & Mobility Flow',
      category: 'Flexibility',
      duration: '30 Min',
      imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80',
      exercises: [
        { id: '1', name: 'Dynamic Hip Openers', sets: 2, reps: '10 each', description: 'Smooth circular joint rotations.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hip_stretch/images/0.jpg' },
        { id: '2', name: 'Cat-Cow Spine Flows', sets: 3, reps: '15', description: 'Mobilize thoracic spine.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cat-cow_stretch/images/0.jpg' },
        { id: '3', name: 'World\'s Greatest Stretch', sets: 3, reps: '5 each side', description: 'Deep lunge rotation.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lunge_stretch/images/0.jpg' },
        { id: '4', name: 'Hamstring Wall Stretches', sets: 3, reps: '45s hold', description: 'Lengthen tight posterior chain.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hamstring_stretch/images/0.jpg' },
        { id: '5', name: 'Child\'s Pose Breathing', sets: 3, reps: '60s', description: 'Deep diaphragmatic relaxation.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Child_pose/images/0.jpg' },
        { id: '6', name: 'Foam Rolling Major Groups', sets: 1, reps: '5 mins', description: 'Release fascial tension.', gifUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Foam_roller/images/0.jpg' }
      ]
    }
  };

  return {
    dayName: todayName,
    workout: workoutsByDay[todayName]
  };
}

export default function WorkoutHomeScreen({ navigation }) {
  const [todayData, setTodayData] = useState(null);

  useEffect(() => {
    const data = getTodayWorkout();
    setTodayData(data);
  }, []);

  if (!todayData) return null;

  const { dayName, workout } = todayData;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerSection}>
          <Text style={styles.dayBadgeText}>TODAY'S SCHEDULE • {dayName.toUpperCase()}</Text>
          <Text style={styles.headerTitle}>{workout.title}</Text>
          <Text style={styles.headerSubtitle}>
            Complete all 6 prescribed exercises below to sync your active minutes with your progress calendar.
          </Text>
        </View>

        <View style={styles.imageContainer}>
          <Image source={{ uri: workout.imageUrl }} style={styles.cardImage} resizeMode="cover" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{workout.category.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.metaRowCard}>
          <Text style={styles.metaText}>⏱ Duration: {workout.duration}</Text>
          <Text style={styles.metaDivider}>•</Text>
          <Text style={styles.metaText}>📋 {workout.exercises.length} Exercises</Text>
        </View>

        <TouchableOpacity 
          style={styles.startButton}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('ActiveWorkout', { workout })}
        >
          <Text style={styles.startButtonText}>Start Today's Session 🚀</Text>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Exercises In This Session</Text>
        </View>

        {workout.exercises.map((ex, index) => (
          <View key={ex.id} style={styles.exerciseCard}>
            <View style={styles.exerciseIndexBadge}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              <Text style={styles.exerciseMeta}>{ex.sets} Sets • {ex.reps} Reps</Text>
              <Text style={styles.exerciseDesc}>{ex.description}</Text>
            </View>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20, paddingBottom: 40 },
  headerSection: { paddingTop: 10, marginBottom: 16 },
  dayBadgeText: { fontSize: 11, fontWeight: '800', color: COLORS.primary, marginBottom: 4, letterSpacing: 0.5 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textDark, marginBottom: 6 },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, lineHeight: 18 },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 170,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    marginBottom: 12,
  },
  cardImage: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.teal,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  metaRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  metaText: { fontSize: 12, color: COLORS.textLight, fontWeight: '700' },
  metaDivider: { marginHorizontal: 10, color: '#CCC' },
  startButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  startButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  exerciseIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  indexText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 14, fontWeight: '800', color: COLORS.textDark, marginBottom: 2 },
  exerciseMeta: { fontSize: 11, fontWeight: '700', color: COLORS.teal, marginBottom: 4 },
  exerciseDesc: { fontSize: 12, color: COLORS.textLight, lineHeight: 16 },
});