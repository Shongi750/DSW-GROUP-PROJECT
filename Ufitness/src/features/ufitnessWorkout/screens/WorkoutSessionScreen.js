import React, { useMemo, useState } from 'react';
import {
  Alert,
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

export default function WorkoutSessionScreen({ navigation, route }) {
  const workout = getWorkout(route.params?.workoutId);
  const [done, setDone] = useState({});
  const completed = useMemo(
    () => workout.exercises.filter((_, index) => done[index]).length,
    [done, workout.exercises],
  );

  const toggle = (index) => {
    setDone((current) => ({ ...current, [index]: !current[index] }));
  };

  const finish = () => {
    Alert.alert('Workout logged', `${workout.title} is saved on your UFitness plan.`, [
      {
        text: 'Done',
        onPress: () => navigation.navigate('WorkoutHub'),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FB" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#D96B27" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.kicker}>IN SESSION</Text>
        <Text style={styles.title}>{workout.title}</Text>
        <Text style={styles.progress}>
          {completed} / {workout.exercises.length} moves complete
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round((completed / workout.exercises.length) * 100)}%` },
            ]}
          />
        </View>

        {workout.exercises.map((item, index) => {
          const checked = Boolean(done[index]);
          return (
            <TouchableOpacity
              key={`${item.name}-${index}`}
              style={[styles.row, checked && styles.rowDone]}
              onPress={() => toggle(index)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={checked ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={checked ? '#00A8A8' : '#C5C5C7'}
              />
              <View style={styles.rowBody}>
                <Text style={[styles.exerciseName, checked && styles.exerciseDone]}>{item.name}</Text>
                <Text style={styles.exerciseMeta}>{item.sets}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.finishBtn} onPress={finish}>
          <Text style={styles.finishText}>COMPLETE WORKOUT</Text>
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
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D96B27',
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1C1C1E' },
  progress: { marginTop: 8, marginBottom: 10, fontSize: 13, color: '#6C6C70' },
  progressTrack: {
    height: 6,
    backgroundColor: '#EFEFF4',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 18,
  },
  progressFill: { height: '100%', backgroundColor: '#00A8A8' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F3',
  },
  rowDone: { borderColor: '#CFF1F1', backgroundColor: '#F3FBFB' },
  rowBody: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  exerciseDone: { textDecorationLine: 'line-through', color: '#6C6C70' },
  exerciseMeta: { marginTop: 2, fontSize: 12, color: '#8A8A8E' },
  finishBtn: {
    marginTop: 8,
    backgroundColor: '#BD4800',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  finishText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.6 },
});
