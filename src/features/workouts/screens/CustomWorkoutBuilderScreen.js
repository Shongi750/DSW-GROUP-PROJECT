import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, 
  Alert, SafeAreaView, ActivityIndicator, Modal, Image 
} from 'react-native';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';

const COLORS = {
  primary: '#BA4A0C', // Figma Burnt Orange
  teal: '#006B63',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  textDark: '#1A1A1A',
  textLight: '#666666',
  border: '#EEEEEE',
  danger: '#D32F2F'
};

export default function CustomWorkoutBuilderScreen({ navigation }) {
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  
  // Database State
  const [allExercises, setAllExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'exercises'));
        const exercisesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllExercises(exercisesData);
      } catch (error) {
        console.error("Error fetching exercises: ", error);
        Alert.alert('Error', 'Could not load exercises from the database.');
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  const handleAddExercise = (exercise) => {
    // Format it so it matches your ActiveWorkout screen requirements
    const formattedExercise = {
      id: exercise.id,
      name: (exercise.name || 'Unknown').toUpperCase(),
      category: exercise.bodyPart || 'General',
      gifUrl: exercise.gifUrl || '',
      description: Array.isArray(exercise.instructions) ? exercise.instructions.join(' ') : 'Standard form.',
      sets: 3,
      reps: '10-12',
      rest: '60s'
    };
    
    setSelectedExercises(prev => [...prev, formattedExercise]);
    setIsModalVisible(false);
  };

  const handleRemoveExercise = (indexToRemove) => {
    setSelectedExercises(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSaveWorkout = async () => {
    if (!workoutTitle.trim()) {
      Alert.alert('Hold Up', 'Please give your custom workout a catchy name!');
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert('Wait a minute', 'You need to add at least one exercise to save a workout.');
      return;
    }

    setIsSaving(true);
    try {
      const currentUserId = auth.currentUser?.uid;
      
      const newCustomWorkout = {
        title: workoutTitle,
        category: 'Custom',
        level: 'Mixed',
        duration: `${selectedExercises.length * 10} Min`, // Rough estimate: 10 mins per exercise
        creatorId: currentUserId,
        exercises: selectedExercises,
        createdAt: serverTimestamp(),
        isCustom: true // Flag to filter it later if needed
      };

      // Save to your workout_plans collection
      await addDoc(collection(db, 'workout_plans'), newCustomWorkout);
      
      Alert.alert('Success! 🎉', 'Your custom workout is live and ready to crush.', [
        { text: 'Awesome', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error("Error saving custom workout: ", error);
      Alert.alert('Error', 'Could not save your custom workout.');
    } finally {
      setIsSaving(false);
    }
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
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Builder</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Workout Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Ultimate Leg Day"
          placeholderTextColor="#999"
          value={workoutTitle}
          onChangeText={setWorkoutTitle}
        />

        <View style={styles.exercisesHeaderRow}>
          <Text style={styles.label}>Exercises ({selectedExercises.length})</Text>
          <TouchableOpacity onPress={() => setIsModalVisible(true)}>
            <Text style={styles.addText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {selectedExercises.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyBoxText}>No exercises added yet.</Text>
            <Text style={styles.emptyBoxSubtext}>Tap "+ Add" to build your routine.</Text>
          </View>
        ) : (
          <FlatList
            data={selectedExercises}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <View style={styles.selectedExerciseCard}>
                <View style={styles.selectedExerciseInfo}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <Text style={styles.exerciseDetails}>{item.sets} Sets • {item.reps} Reps</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveExercise(index)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, selectedExercises.length === 0 && styles.saveButtonDisabled]} 
          onPress={handleSaveWorkout}
          disabled={isSaving || selectedExercises.length === 0}
        >
          {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save Workout</Text>}
        </TouchableOpacity>
      </View>

      {/* Exercise Picker Modal */}
      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Exercise</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={allExercises}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.exerciseOption} onPress={() => handleAddExercise(item)}>
                <Image 
                  source={{ uri: item.gifUrl || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=100&q=80' }} 
                  style={styles.modalThumb} 
                />
                <View style={styles.modalOptionText}>
                  <Text style={styles.modalOptionName}>{item.name}</Text>
                  <Text style={styles.modalOptionTarget}>{item.bodyPart}</Text>
                </View>
                <Text style={styles.addIcon}>+</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backButton: { paddingVertical: 5 },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark },

  content: { flex: 1, padding: 20 },
  label: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.textDark,
    marginBottom: 24,
  },
  
  exercisesHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  addText: { color: COLORS.primary, fontWeight: '700', fontSize: 16 },
  
  emptyBox: { backgroundColor: COLORS.surface, padding: 30, borderRadius: 12, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#CCC' },
  emptyBoxText: { fontSize: 16, fontWeight: '600', color: COLORS.textDark, marginBottom: 4 },
  emptyBoxSubtext: { fontSize: 14, color: COLORS.textLight },

  selectedExerciseCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  selectedExerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginBottom: 4 },
  exerciseDetails: { fontSize: 13, color: COLORS.textLight, fontWeight: '500' },
  removeBtn: { padding: 8 },
  removeBtnText: { color: COLORS.danger, fontSize: 18, fontWeight: 'bold' },

  footer: { padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border },
  saveButton: { backgroundColor: COLORS.textDark, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: '#E0E0E0' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textDark },
  closeText: { fontSize: 16, color: COLORS.textLight, fontWeight: '600' },
  modalList: { padding: 20 },
  exerciseOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.surface },
  modalThumb: { width: 50, height: 50, borderRadius: 8, backgroundColor: COLORS.surface, marginRight: 15 },
  modalOptionText: { flex: 1 },
  modalOptionName: { fontSize: 16, fontWeight: '600', color: COLORS.textDark, textTransform: 'capitalize' },
  modalOptionTarget: { fontSize: 13, color: COLORS.textLight, marginTop: 4, textTransform: 'capitalize' },
  addIcon: { fontSize: 24, color: COLORS.primary, fontWeight: '400' }
});