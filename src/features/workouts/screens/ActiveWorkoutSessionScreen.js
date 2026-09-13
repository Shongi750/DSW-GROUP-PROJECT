import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';
import { evaluateAndAwardBadges } from '../../progress/services/progressService';

export default function ActiveWorkoutSessionScreen({ route, navigation }) {
  const { workout } = route.params;
  
  // 1. New State for Individual Timers
  const [exerciseTimers, setExerciseTimers] = useState({}); // Stores time for each exercise
  const [activeTimerId, setActiveTimerId] = useState(null); // Tracks which timer is currently running
  
  const [completedSets, setCompletedSets] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // 2. The new smart timer logic
  useEffect(() => {
    let interval = null;
    if (activeTimerId) {
      interval = setInterval(() => {
        setExerciseTimers((prev) => ({
          ...prev,
          [activeTimerId]: (prev[activeTimerId] || 0) + 1
        }));
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [activeTimerId]);

  const formatTime = (totalSeconds) => {
    if (!totalSeconds) return "00:00";
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = (exerciseId) => {
    if (activeTimerId === exerciseId) {
      setActiveTimerId(null); // Pause if it's already running
    } else {
      setActiveTimerId(exerciseId); // Start this one (and inherently pause others)
    }
  };

  const toggleSetCompletion = (exerciseId) => {
    setCompletedSets((prev) => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  // Calculate total seconds across all mini-workouts
  const totalWorkoutSeconds = Object.values(exerciseTimers).reduce((sum, current) => sum + current, 0);

  const handleFinishWorkout = async () => {
    setIsSaving(true);
    try {
      const currentUserId = auth.currentUser?.uid; 
      
      if (!currentUserId) {
        Alert.alert("Error", "You must be logged in to save a workout.");
        return;
      }

      await addDoc(collection(db, 'workout_logs'), {
        userId: currentUserId,
        workoutId: workout.id,
        workoutTitle: workout.title,
        durationSeconds: totalWorkoutSeconds, // Save the combined total time
        completedAt: serverTimestamp(),
      });

      const logsRef = collection(db, 'workout_logs');
      const q = query(logsRef, where("userId", "==", currentUserId));
      const snapshot = await getDocs(q);

      let totalWorkouts = 0;
      let totalSeconds = 0;
      snapshot.forEach((docSnap) => {
        totalWorkouts++;
        totalSeconds += docSnap.data().durationSeconds || 0;
      });

      const totalMinutes = Math.round(totalSeconds / 60);
      const newBadges = await evaluateAndAwardBadges(currentUserId, totalWorkouts, totalMinutes);

      if (newBadges.length > 0) {
        const badgeNames = newBadges.map((b) => `${b.icon} ${b.title}`).join('\n');
        Alert.alert(
          '🎉 Badge Unlocked!',
          `Congratulations! You earned:\n\n${badgeNames}`,
          [{ text: 'View Progress', onPress: () => navigation.navigate('WorkoutHome') }]
        );
      } else {
        Alert.alert(
          'Workout Complete! 🏆', 
          `Great job! You worked out for ${formatTime(totalWorkoutSeconds)}.`, 
          [{ text: 'Awesome', onPress: () => navigation.navigate('WorkoutHome') }]
        );
      }
    } catch (error) {
      console.error("Error saving workout log: ", error);
      Alert.alert('Error', 'Could not save your workout. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>Total ⏱ {formatTime(totalWorkoutSeconds)}</Text>
        </View>
      </View>

      <FlatList
        data={workout.exercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isDone = !!completedSets[item.id];
          const isTimerActive = activeTimerId === item.id;
          const currentSeconds = exerciseTimers[item.id] || 0;
          
          return (
            <View style={styles.exerciseContainer}>
              <Text style={styles.categoryBadge}>{item.category}</Text>
              
              <View style={styles.titleRow}>
                <Text style={styles.exerciseTitle}>{item.name}</Text>
              </View>

              {/* The Image Placeholder Fix */}
              <Image 
                source={{ 
                  uri: item.gifUrl && item.gifUrl.trim() !== '' 
                    ? item.gifUrl 
                    : 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80' 
                }} 
                style={styles.gifImage} 
                resizeMode="cover"
              />

              <Text style={styles.descriptionText}>{item.description}</Text>

              <View style={styles.statsGrid}>
                <View style={styles.statColumn}>
                  <Text style={styles.statLabel}>SETS</Text>
                  <Text style={styles.statValue}>{item.sets}</Text>
                </View>
                <View style={styles.statColumn}>
                  <Text style={styles.statLabel}>REPS</Text>
                  <Text style={styles.statValue}>{item.reps}</Text>
                </View>
                <View style={styles.statColumn}>
                  <Text style={styles.statLabel}>REST</Text>
                  <Text style={styles.statValue}>{item.rest}</Text>
                </View>
              </View>

              {/* 3. New Individual Timer Controls */}
              <View style={styles.timerControlRow}>
                <Text style={styles.individualTimerText}>
                  ⏱ {formatTime(currentSeconds)}
                </Text>
                <TouchableOpacity 
                  style={[styles.startPauseButton, isTimerActive && styles.startPauseButtonActive]} 
                  onPress={() => toggleTimer(item.id)}
                >
                  <Text style={[styles.startPauseButtonText, isTimerActive && styles.startPauseTextActive]}>
                    {isTimerActive ? 'Pause Timer' : 'Start Timer'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.setButton, isDone && styles.setButtonDone]} 
                onPress={() => toggleSetCompletion(item.id)}
              >
                <Text style={[styles.setButtonText, isDone && styles.setButtonTextDone]}>
                  {isDone ? '✓ Sets Completed' : 'Mark Sets as Done'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListFooterComponent={
          <TouchableOpacity 
            style={styles.finishButton} 
            onPress={handleFinishWorkout}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.finishButtonText}>Finish Workout</Text>
            )}
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 },
  backButton: { padding: 20 },
  backText: { fontSize: 16, color: '#FF6F00', fontWeight: '600' },
  timerContainer: { backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  timerText: { fontSize: 14, fontWeight: '700', color: '#E65100' },
  
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  exerciseContainer: { marginTop: 10, marginBottom: 30 },
  categoryBadge: { fontSize: 12, fontWeight: '700', color: '#FF6F00', textTransform: 'uppercase', marginBottom: 8 },
  
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  exerciseTitle: { fontSize: 26, fontWeight: '800', color: '#1A1A1A', flex: 1 },
  
  gifImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#F5F5F5'
  },

  descriptionText: { fontSize: 16, color: '#4A4A4A', lineHeight: 24, marginBottom: 20 },
  
  statsGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: '#FAFAFA', 
    padding: 15, 
    borderRadius: 12,
    marginBottom: 15
  },
  statColumn: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#888888', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },

  timerControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15
  },
  individualTimerText: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  startPauseButton: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  startPauseButtonActive: { backgroundColor: '#FF6F00' },
  startPauseButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  startPauseTextActive: { color: '#FFFFFF' },

  setButton: { 
    borderWidth: 2, 
    borderColor: '#E0E0E0', 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  setButtonDone: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  setButtonText: { color: '#666666', fontSize: 16, fontWeight: '600' },
  setButtonTextDone: { color: '#2E7D32' },

  finishButton: { 
    backgroundColor: '#FF6F00', 
    paddingVertical: 18, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 10
  },
  finishButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});