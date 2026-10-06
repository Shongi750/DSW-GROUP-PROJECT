import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  background: '#FFFFFF',
  surface: '#F8F9FA',
  primary: '#BA4A0C',
  primaryLight: '#FCEFE9',
  textDark: '#1A1A1A',
  textLight: '#666666',
  border: '#EAEAEA',
};

export default function ActiveWorkoutSessionScreen({ route, navigation }) {
  const { workout } = route.params || {};
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalWorkoutSeconds, setTotalWorkoutSeconds] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Track overall session duration
  useEffect(() => {
    let interval = setInterval(() => {
      if (!isSaving) {
        setTotalWorkoutSeconds((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isSaving]);

  if (!workout || !workout.exercises || workout.exercises.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Workout data is missing or empty.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.errorBtn}>
            <Text style={styles.errorBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const activeExercise = workout.exercises[currentIndex];
  const isLastExercise = currentIndex === workout.exercises.length - 1;

  const formatTime = (totalSeconds) => {
    if (!totalSeconds) return "00:00";
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinishWorkout = async () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      navigation.navigate('Progress', {
        screen: 'ProgressDashboard',
        params: { completedWorkout: workout }
      });
    }, 800);
  };

  const handleNext = () => {
    if (isLastExercise) {
      handleFinishWorkout();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (!activeExercise) return null;

  const exerciseImageUrl = activeExercise.gifUrl || 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushup/images/0.jpg';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <TouchableOpacity 
          style={styles.quitButton} 
          onPress={() => {
            Alert.alert("End Workout?", "Are you sure you want to quit your session?", [
              { text: "Resume", style: "cancel" },
              { text: "Quit", onPress: () => navigation.goBack(), style: "destructive" }
            ]);
          }}
        >
          <Text style={styles.quitButtonText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.sessionBadge}>
          <Text style={styles.sessionBadgeText}>🔥 LIVE SESSION</Text>
        </View>

        <Text style={styles.headerTimer}>{formatTime(totalWorkoutSeconds)}</Text>
      </View>

      <View style={styles.content}>
        {/* Visual Exercise Demonstration Card with Enforced Dimensions */}
        <View style={styles.imageWrapper}>
          <Image 
            source={{ uri: exerciseImageUrl }} 
            style={styles.exerciseImageStyle} 
            contentFit="cover" 
          />

          <View style={styles.progressPill}>
            <Text style={styles.progressText}>
              Step {currentIndex + 1} of {workout.exercises.length}
            </Text>
          </View>
        </View>

        {/* Exercise Details & Instructions */}
        <View style={styles.exerciseInfoBox}>
          <View style={styles.tagContainer}>
            <Text style={styles.tagText}>{activeExercise.category || workout.category || 'WORKOUT'}</Text>
          </View>
          
          <Text style={styles.exerciseTitle}>{activeExercise.name}</Text>
          <Text style={styles.exerciseSubtitle}>
            {activeExercise.description || 'Maintain steady controlled breathing and full range of motion.'}
          </Text>

          <View style={styles.repsCard}>
            <Text style={styles.repsCardLabel}>TARGET REQUIREMENTS</Text>
            <Text style={styles.repsCardValue}>
              {activeExercise.sets ? `${activeExercise.sets} Sets` : ''} 
              {activeExercise.reps ? ` • ${activeExercise.reps} Reps` : ''}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.controlsRow}>
          <TouchableOpacity style={[styles.controlBtn, styles.nextBtn]} onPress={handleNext}>
            <Text style={styles.nextBtnText}>{isLastExercise ? 'FINISH WORKOUT 🏁' : 'NEXT EXERCISE ➔'}</Text>
          </TouchableOpacity>
        </View>

        {/* Up Next Preview */}
        {!isLastExercise && (
          <View style={styles.upNextBox}>
            <Text style={styles.upNextLabel}>UP NEXT</Text>
            <Text style={styles.upNextTitle}>{workout.exercises[currentIndex + 1]?.name}</Text>
          </View>
        )}
      </View>

      {isSaving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.savingText}>Saving Session...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  quitButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border
  },
  quitButtonText: { fontSize: 14, color: COLORS.textDark, fontWeight: '700' },
  sessionBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary
  },
  sessionBadgeText: { color: COLORS.primary, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  headerTimer: { fontSize: 15, fontWeight: '800', color: COLORS.textDark, fontVariant: ['tabular-nums'] },
  
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 14, justifyContent: 'space-between', paddingBottom: 20 },
  
  imageWrapper: { 
    width: '100%', 
    height: 220, 
    borderRadius: 20, 
    overflow: 'hidden', 
    position: 'relative',
    backgroundColor: '#F8F9FA', 
    borderWidth: 1, 
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseImageStyle: { 
    width: '100%', 
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  progressPill: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    zIndex: 2,
  },
  progressText: { color: '#FFFFFF', fontWeight: '700', fontSize: 11, letterSpacing: 0.5 },

  exerciseInfoBox: { alignItems: 'center' },
  tagContainer: { 
    backgroundColor: COLORS.primaryLight, 
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 6,
  },
  tagText: { color: COLORS.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  
  exerciseTitle: { fontSize: 24, fontWeight: '900', color: COLORS.textDark, textAlign: 'center', marginBottom: 2 },
  exerciseSubtitle: { fontSize: 12, color: COLORS.textLight, textAlign: 'center', paddingHorizontal: 10, marginBottom: 14 },

  repsCard: {
    width: '100%', backgroundColor: COLORS.surface,
    borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border
  },
  repsCardLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textLight, letterSpacing: 1, marginBottom: 2 },
  repsCardValue: { fontSize: 16, fontWeight: '800', color: COLORS.textDark },

  controlsRow: { flexDirection: 'row' },
  controlBtn: { 
    flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2
  },
  nextBtn: { backgroundColor: COLORS.primary },
  nextBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  upNextBox: {
    backgroundColor: COLORS.surface, padding: 12, borderRadius: 14,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border
  },
  upNextLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  upNextTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textDark },

  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: COLORS.textDark, marginBottom: 16, fontWeight: '600' },
  errorBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  errorBtnText: { color: '#FFF', fontWeight: 'bold' },

  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center', alignItems: 'center'
  },
  savingText: { marginTop: 12, fontSize: 16, fontWeight: '800', color: COLORS.primary, letterSpacing: 1 }
});