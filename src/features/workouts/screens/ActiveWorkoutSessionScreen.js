import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';
import { evaluateAndAwardBadges } from '../../progress/services/progressService';

// ✨ Figma Colors
const COLORS = {
  primary: '#BA4A0C', // The burnt orange from the Figma design
  background: '#FFFFFF',
  surface: '#F8F9FA',
  textDark: '#1A1A1A',
  textLight: '#666666',
  statBox: '#F5F5F5',
  tagBg: '#FCEFE9',
  tagText: '#BA4A0C'
};

export default function ActiveWorkoutSessionScreen({ route, navigation }) {
  const { workout } = route.params;
  
  const [exerciseTimers, setExerciseTimers] = useState({});
  const [activeTimerId, setActiveTimerId] = useState(null);
  const [completedSets, setCompletedSets] = useState({});
  const [isSaving, setIsSaving] = useState(false);

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
      setActiveTimerId(null);
    } else {
      setActiveTimerId(exerciseId);
    }
  };

  const toggleSetCompletion = (exerciseId) => {
    setCompletedSets((prev) => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  const totalWorkoutSeconds = Object.values(exerciseTimers).reduce((sum, current) => sum + current, 0);

  const handleFinishWorkout = async () => {
    setIsSaving(true);
    try {
      const currentUserId = auth.currentUser?.uid; 
      if (!currentUserId) return;

      await addDoc(collection(db, 'workout_logs'), {
        userId: currentUserId,
        workoutId: workout.id,
        workoutTitle: workout.title,
        durationSeconds: totalWorkoutSeconds, 
        completedAt: serverTimestamp(),
      });

      // Navigate straight to progress tab!
      navigation.navigate('Progress', { screen: 'ProgressDashboard' });
    } catch (error) {
      Alert.alert('Error', 'Could not save your workout.');
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
        <Text style={styles.headerTimer}>⏱ {formatTime(totalWorkoutSeconds)}</Text>
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
            <View style={styles.exerciseCard}>
              
              {/* Image takes full width at the top like Figma */}
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: item.gifUrl || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80' }} 
                  style={styles.exerciseImage} 
                  resizeMode="cover"
                />
                {/* Heart Icon Placeholder */}
                <View style={styles.heartIcon}><Text>♡</Text></View>
              </View>

              <View style={styles.cardContent}>
                {/* Figma Tag Style */}
                <View style={styles.tagContainer}>
                  <Text style={styles.tagText}>{item.category || 'Strength'}</Text>
                </View>

                <Text style={styles.exerciseTitle}>{item.name}</Text>
                <Text style={styles.descriptionText}>{item.description}</Text>

                {/* Figma Stats Grid */}
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>SETS</Text>
                    <Text style={styles.statValue}>{item.sets}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>REPS</Text>
                    <Text style={styles.statValue}>{item.reps}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>REST</Text>
                    <Text style={styles.statValue}>{item.rest}</Text>
                  </View>
                </View>

                {/* Combined Start/Done Button to match Figma */}
                <TouchableOpacity 
                  style={[styles.startButton, isDone && styles.startButtonDone]} 
                  onPress={() => toggleSetCompletion(item.id)}
                >
                  <Text style={[styles.startButtonText, isDone && styles.startButtonTextDone]}>
                    {isDone ? '✓ Completed' : '▷ Start Exercise'}
                  </Text>
                </TouchableOpacity>

                {/* Individual Timer underneath */}
                <TouchableOpacity 
                  style={styles.timerToggle}
                  onPress={() => toggleTimer(item.id)}
                >
                  <Text style={styles.timerToggleText}>
                    {isTimerActive ? `⏸ Pause Timer (${formatTime(currentSeconds)})` : `⏱ Track Time (${formatTime(currentSeconds)})`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <TouchableOpacity style={styles.finishButton} onPress={handleFinishWorkout} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.finishButtonText}>Finish Workout</Text>}
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  backText: { fontSize: 16, color: COLORS.textDark, fontWeight: '600' },
  headerTimer: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  
  // Card matching Figma
  exerciseCard: { 
    backgroundColor: COLORS.background, 
    borderRadius: 16, 
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  imageContainer: { position: 'relative' },
  exerciseImage: { width: '100%', height: 220, backgroundColor: '#F0F0F0' },
  heartIcon: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: '#FFF', width: 32, height: 32, 
    borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
  },
  
  cardContent: { padding: 20 },
  tagContainer: { 
    backgroundColor: COLORS.tagBg, 
    alignSelf: 'flex-start', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12, 
    marginBottom: 8 
  },
  tagText: { color: COLORS.tagText, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  
  exerciseTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textDark, marginBottom: 8 },
  descriptionText: { fontSize: 14, color: COLORS.textLight, lineHeight: 22, marginBottom: 20 },
  
  // Stats Grid matching Figma
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  statBox: { 
    flex: 1, 
    backgroundColor: COLORS.statBox, 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#999999', marginBottom: 4, letterSpacing: 0.5 },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.textDark },

  // Figma Start Button
  startButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  startButtonDone: { backgroundColor: '#E8F5E9' },
  startButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  startButtonTextDone: { color: '#2E7D32' },

  timerToggle: { marginTop: 12, alignItems: 'center', paddingVertical: 8 },
  timerToggleText: { color: COLORS.textLight, fontSize: 14, fontWeight: '600' },

  finishButton: { backgroundColor: COLORS.textDark, paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  finishButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});