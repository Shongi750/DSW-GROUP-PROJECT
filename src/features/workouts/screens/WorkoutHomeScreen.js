import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

const RAPID_API_KEY = '3de46734b6msh4b3399cacfb4941p1be7bcjsnce56c3474605';

export default function WorkoutHomeScreen({ navigation }) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleBuildPlanFromExercises = async () => {
    try {
      setLoading(true);
      const exercisesSnapshot = await getDocs(collection(db, 'exercises'));
      const rawExercises = exercisesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
        title: 'Real API Workout',
        duration: '30 Min',
        level: 'Intermediate',
        exercises: selectedExercises
      };

      await setDoc(doc(db, 'workout_plans', dynamicPlan.id), dynamicPlan);
      Alert.alert("Success!", "Built a real workout plan from your API data. Refresh the app!");
    } catch (error) {
      console.error("Error building plan: ", error);
      Alert.alert("Error", "Check your console.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // We added a listener here so the list updates automatically when we come back from the builder!
    const fetchWorkouts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'workout_plans'));
        const workoutsData = querySnapshot.docs.map(doc => ({
          ...doc.data()
        }));
        setWorkouts(workoutsData);
      } catch (error) {
        console.error("Error fetching workouts: ", error);
      } finally {
        setLoading(false);
      }
    };

    // React Navigation hook to refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchWorkouts();
    });

    fetchWorkouts();
    return unsubscribe;
  }, [navigation]);

  const renderWorkout = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ActiveWorkout', { workout: item })}
    >
      <Text style={styles.cardCategory}>{item.category}</Text>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDetails}>{item.duration} • {item.level}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Recommended Workouts</Text>
        <Text style={styles.headerSubtitle}>Tailored plans to boost your campus energy.</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.seedButton} onPress={handleBuildPlanFromExercises}>
          <Text style={styles.buttonText}>API Plan</Text>
        </TouchableOpacity>
        
        {/* ✨ NEW: Custom Builder Button */}
        <TouchableOpacity 
          style={styles.builderButton} 
          onPress={() => navigation.navigate('CustomWorkoutBuilder')}
        >
          <Text style={styles.buttonText}>Build Custom</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={renderWorkout}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  headerContainer: { padding: 20, paddingTop: 40, paddingBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#666666' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20, gap: 10 },
  seedButton: { flex: 1, backgroundColor: '#2E7D32', padding: 15, borderRadius: 10, alignItems: 'center' },
  builderButton: { flex: 1, backgroundColor: '#FF6F00', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#F0F0F0', elevation: 2,
  },
  cardCategory: { fontSize: 12, fontWeight: '700', color: '#FF6F00', textTransform: 'uppercase', marginBottom: 6 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  cardDetails: { fontSize: 14, color: '#888888', fontWeight: '500' }
});