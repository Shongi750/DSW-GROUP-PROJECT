import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { GlassCard, GlassScreen } from '../components/glass';
import PrimaryButton from '../components/button';
import { movesFromIds, formatMoveMeta, estimateMinutes } from '../lib/session';

export default function BuilderScreen({ navigation }) {
  const { catalog, saveCustomWorkout, getExercise, profile, deleteCustomWorkout } = useApp();
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState('My workout');

  const library = useMemo(() => catalog.slice(0, 40), [catalog]);

  const toggle = (id) => {
    setSelected((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]));
  };

  const start = () => {
    if (!selected.length) return;
    navigation.navigate('Player', {
      moves: movesFromIds(selected, getExercise),
      exerciseIds: selected,
      programId: 'custom',
    });
  };

  const save = () => {
    saveCustomWorkout({ name, exerciseIds: selected });
    setSelected([]);
  };

  return (
    <GlassScreen>
      <TouchableOpacity onPress={() => navigation.goBack()} className="mb-2 flex-row items-center gap-1">
        <Ionicons name="chevron-back" size={20} color="#1A1A1A" />
        <Text className="font-semibold text-ink">Programs</Text>
      </TouchableOpacity>
      <Text className="text-[28px] font-extrabold text-ink">Build a workout</Text>
      <Text className="mb-4 mt-1 text-muted">Pick moves, save them, then run the player with sets and timers.</Text>

      <TextInput
        value={name}
        onChangeText={setName}
        className="mb-3 rounded-2xl bg-surface px-4 py-3 text-ink"
        style={{ color: '#1A1A1A', paddingVertical: 12, paddingHorizontal: 14 }}
        placeholder="Workout name"
        placeholderTextColor="#8E8E93"
      />

      {library.map((exercise) => {
        const on = selected.includes(exercise.id);
        return (
          <GlassCard key={exercise.id} className="mb-2" onPress={() => toggle(exercise.id)}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="font-bold text-ink">{exercise.name}</Text>
                <Text className="mt-1 text-xs text-muted">
                  {formatMoveMeta(exercise)} · {(exercise.focus || []).join(', ')}
                </Text>
              </View>
              <Ionicons name={on ? 'checkmark-circle' : 'add-circle-outline'} size={22} color={on ? '#BA4A0C' : '#8E8E93'} />
            </View>
          </GlassCard>
        );
      })}

      <Text className="mb-2 mt-6 text-lg font-bold text-ink">Saved workouts</Text>
      {(profile.customWorkouts || []).length === 0 ? (
        <Text className="text-muted">None yet. Select moves and save.</Text>
      ) : (
        (profile.customWorkouts || []).map((workout) => (
          <GlassCard
            key={workout.id}
            className="mb-2"
            onPress={() =>
              navigation.navigate('Player', {
                moves: movesFromIds(workout.exerciseIds, getExercise),
                exerciseIds: workout.exerciseIds,
                programId: workout.id,
              })
            }
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-bold text-ink">{workout.name}</Text>
                <Text className="text-xs text-muted">{workout.exerciseIds.length} moves</Text>
              </View>
              <TouchableOpacity onPress={() => deleteCustomWorkout(workout.id)}>
                <Ionicons name="trash-outline" size={18} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))
      )}

      <Text className="mt-4 text-center text-muted">
        {selected.length} selected · ~{estimateMinutes(movesFromIds(selected, getExercise))} min
      </Text>
      <View className="mt-3 gap-3 pb-6">
        <PrimaryButton title="Start this workout" icon="play" onPress={start} />
        <PrimaryButton title="Save workout" icon="bookmark" onPress={save} />
      </View>
    </GlassScreen>
  );
}
