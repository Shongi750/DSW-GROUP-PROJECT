import React from 'react';
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
import { getWorkout } from '../data/workouts';

export default function WorkoutDetailScreen({ navigation, route }) {
  const workout = getWorkout(route.params?.workoutId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FB" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#D96B27" />
          <Text style={styles.backText}>Workouts</Text>
        </TouchableOpacity>

        <Image source={{ uri: workout.image }} style={styles.hero} />
        <View style={styles.badge}>
          <View style={styles.orangeDot} />
          <Text style={styles.badgeText}>{workout.category}</Text>
        </View>

        <Text style={styles.title}>{workout.title}</Text>
        <Text style={styles.meta}>
          {workout.durationMin} min • {workout.level} • {workout.location}
        </Text>
        <Text style={styles.copy}>{workout.description}</Text>

        <Text style={styles.sectionTitle}>Exercises</Text>
        {workout.exercises.map((item, index) => (
          <View key={`${item.name}-${index}`} style={styles.exerciseRow}>
            <View style={styles.indexBubble}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
            <View style={styles.exerciseBody}>
              <Text style={styles.exerciseName}>{item.name}</Text>
              <Text style={styles.exerciseMeta}>
                {item.sets}
                {item.rest && item.rest !== '—' ? ` • rest ${item.rest}` : ''}
              </Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => navigation.navigate('WorkoutSession', { workoutId: workout.id })}
        >
          <Text style={styles.startBtnText}>START WORKOUT</Text>
          <Ionicons name="caret-forward" size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB' },
  scroll: { padding: 20, paddingBottom: 36 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 14 },
  backText: { fontSize: 14, fontWeight: '600', color: '#D96B27' },
  hero: { width: '100%', height: 180, borderRadius: 18, marginBottom: 14 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F3',
  },
  orangeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D96B27' },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#1C1C1E', letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: '800', color: '#1C1C1E' },
  meta: { marginTop: 6, fontSize: 13, color: '#6C6C70', fontWeight: '500' },
  copy: { marginTop: 10, marginBottom: 22, fontSize: 14, lineHeight: 20, color: '#6C6C70' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginBottom: 12 },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F3',
  },
  indexBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: { fontSize: 12, fontWeight: '800', color: '#D96B27' },
  exerciseBody: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  exerciseMeta: { marginTop: 2, fontSize: 12, color: '#8A8A8E' },
  startBtn: {
    marginTop: 10,
    backgroundColor: '#BD4800',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  startBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.6 },
});
