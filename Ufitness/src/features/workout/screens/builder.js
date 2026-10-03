import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { GlassCard, GlassScreen } from '../components/glass';
import PrimaryButton from '../components/button';
import { movesFromIds, formatMoveMeta, estimateMinutes } from '../lib/session';
import { WORKOUT_SESSIONS, buildSession, rememberExercises } from '../lib/sessionApi';

export default function BuilderScreen({ navigation }) {
  const { catalog, saveCustomWorkout, getExercise, profile, deleteCustomWorkout } = useApp();
  const [selected, setSelected] = useState([]);
  const [picked, setPicked] = useState([]);
  const [name, setName] = useState('My workout');
  const [filling, setFilling] = useState('');
  const [fillNote, setFillNote] = useState('');

  const library = useMemo(() => catalog.slice(0, 40), [catalog]);

  const toggle = (id) => {
    setSelected((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]));
  };

  const start = () => {
    if (!selected.length) return;
    if (picked.length) rememberExercises(picked);
    navigation.navigate('Player', {
      moves: movesFromIds(selected, getExercise),
      exerciseIds: selected,
      programId: 'custom',
    });
  };

  const save = () => {
    saveCustomWorkout({
      name,
      exerciseIds: selected,
      exercises: picked.filter((item) => selected.includes(item.id)),
    });
    setSelected([]);
    setPicked([]);
  };

  const fillFromSession = async (session) => {
    setFilling(session.id);
    setFillNote('');
    try {
      const built = await buildSession(session.id, { tier: profile.equipmentTier || 'bodyweight' });
      rememberExercises(built.exercises);
      setName(built.name);
      setSelected(built.exerciseIds);
      setPicked(built.exercises);
      setFillNote(`${built.exercises.length} moves loaded for ${built.name}.`);
    } catch (error) {
      setFillNote(error.message || 'Could not load that session.');
    } finally {
      setFilling('');
    }
  };

  return (
    <GlassScreen>
      <TouchableOpacity onPress={() => navigation.goBack()} className="mb-2 flex-row items-center gap-1">
        <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        <Text className="font-semibold text-ink">Programs</Text>
      </TouchableOpacity>
      <Text className="text-[28px] font-display uppercase text-ink">Build a workout</Text>
      <Text className="mb-4 mt-1 text-muted">Pick a session to fill the list, or choose moves yourself, then save or start.</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View className="flex-row gap-2">
          {WORKOUT_SESSIONS.map((session) => {
            const on = filling === session.id || name === session.name;
            return (
              <TouchableOpacity
                key={session.id}
                className={`rounded-full px-3 py-2 ${on ? 'bg-accent' : 'bg-surface'}`}
                onPress={() => fillFromSession(session)}
                disabled={Boolean(filling)}
              >
                <Text className={`text-xs font-bold ${on ? 'text-white' : 'text-ink'}`}>
                  {filling === session.id ? 'Loading…' : session.overlayTitle}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      {fillNote ? <Text className="mb-3 text-xs text-muted">{fillNote}</Text> : null}

      {picked.length ? (
        <View className="mb-3">
          {picked.map((exercise) => (
            <Text key={exercise.id} className="text-[13px] text-ink">
              {exercise.name}
            </Text>
          ))}
        </View>
      ) : null}

      <TextInput
        value={name}
        onChangeText={setName}
        className="mb-3 rounded-2xl bg-surface px-4 py-3 text-ink"
        style={{ color: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 14 }}
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
              <Ionicons name={on ? 'checkmark-circle' : 'add-circle-outline'} size={22} color={on ? '#FF6A00' : '#8E8E93'} />
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
            onPress={() => {
              if (workout.exercises?.length) rememberExercises(workout.exercises);
              navigation.navigate('Player', {
                moves: movesFromIds(workout.exerciseIds, getExercise),
                exerciseIds: workout.exerciseIds,
                programId: workout.id,
              });
            }}
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
