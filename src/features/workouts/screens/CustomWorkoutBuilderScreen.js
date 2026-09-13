import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';

export default function CustomWorkoutBuilderScreen({ navigation }) {
  const [exercises, setExercises] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [workoutName, setWorkoutName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'exercises'));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExercises(data);
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to load exercises.");
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, []);

  const toggleExercise = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSaveWorkout = async () => {
    if (!workoutName.trim()) return Alert.alert("Hold up!", "Please give your workout a name.");
    if (selectedIds.length === 0) return Alert.alert("Wait!", "You must select at least one exercise.");

    setSaving(true);
    try {
      // Gather the full exercise objects based on what the user selected
      const selectedExerciseObjects = exercises
        .filter(ex => selectedIds.includes(ex.id))
        .map(ex => {
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
            reps: '10', 
            rest: '60s'
          };
        });

      // Format it to match your home screen cards perfectly
      const customPlanId = `custom_${Date.now()}`;
      const customPlan = {
        id: customPlanId,
        category: 'Custom Routine',
        title: workoutName,
        duration: `${selectedExerciseObjects.length * 5} Min`,
        level: 'Personalized',
        exercises: selectedExerciseObjects,
        userId: auth.currentUser?.uid // Tag it to this user
      };

      // Save to Firebase and return home
      await setDoc(doc(db, 'workout_plans', customPlanId), customPlan);
      Alert.alert("Saved!", "Your custom workout is ready to go.");
      navigation.goBack();

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not save workout.");
    } finally {
      setSaving(false);
    }
  };

  const renderExercise = ({ item }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity 
        style={[styles.exerciseCard, isSelected && styles.exerciseCardSelected]} 
        onPress={() => toggleExercise(item.id)}
      >
        <Text style={[styles.exerciseName, isSelected && styles.textSelected]}>
          {item.name ? item.name.toUpperCase() : 'UNKNOWN EXERCISE'}
        </Text>
        <Text style={styles.exerciseBodyPart}>{item.bodyPart || 'General'}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#FF6F00" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Build Custom Workout</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Name your routine (e.g., Monday Leg Day)"
        value={workoutName}
        onChangeText={setWorkoutName}
      />

      <Text style={styles.subHeader}>Select Exercises ({selectedIds.length} chosen)</Text>

      <FlatList
        data={exercises}
        keyExtractor={item => item.id}
        renderItem={renderExercise}
        contentContainerStyle={styles.list}
      />

      {saving ? (
        <ActivityIndicator size="large" color="#FF6F00" style={{ marginVertical: 20 }} />
      ) : (
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveWorkout}>
          <Text style={styles.saveButtonText}>Save & Finish</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', padding: 20, paddingTop: 40 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 20 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', fontSize: 16, marginBottom: 20 },
  subHeader: { fontSize: 16, fontWeight: '600', color: '#666', marginBottom: 10 },
  list: { paddingBottom: 20 },
  exerciseCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 2, borderColor: '#F0F0F0' },
  exerciseCardSelected: { borderColor: '#FF6F00', backgroundColor: '#FFF3E0' },
  exerciseName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  textSelected: { color: '#FF6F00' },
  exerciseBodyPart: { fontSize: 12, color: '#888', marginTop: 4, textTransform: 'capitalize' },
  saveButton: { backgroundColor: '#FF6F00', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});