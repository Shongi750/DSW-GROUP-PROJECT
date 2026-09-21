import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProgram } from '../data/programs';
import { useApp } from '../context/AppContext';
import ExerciseGif from '../components/exercisegif';
import { GlassCard, GlassScreen } from '../components/glass';
import PrimaryButton from '../components/button';
import { programMoves, normalizeMoves } from '../lib/session';

function Figure({ highlight = [] }) {
  const arm = highlight.includes('Arm') || highlight.includes('Shoulders') || highlight.includes('Biceps');
  const shoulder = highlight.includes('Shoulders');
  return (
    <View className="w-[90px] items-center">
      <View className="h-[22px] w-[22px] rounded-full bg-white/40" />
      <View className={`mt-1 h-2.5 w-[54px] rounded-full ${shoulder ? 'bg-[#FF4D4F]' : 'bg-white/40'}`} />
      <View className="mt-1 flex-row items-start">
        <View className={`mx-1 h-[46px] w-3 rounded-md ${arm ? 'bg-[#FF4D4F]' : 'bg-white/40'}`} />
        <View className="h-12 w-7 rounded-lg bg-white/30" />
        <View className={`mx-1 h-[46px] w-3 rounded-md ${arm ? 'bg-[#FF4D4F]' : 'bg-white/40'}`} />
      </View>
    </View>
  );
}

export default function ExerciseDetailScreen({ navigation, route }) {
  const { getExercise, toggleFavorite, profile } = useApp();
  const exercise = getExercise(route.params.exerciseId);
  const program = route.params.programId ? getProgram(route.params.programId) : null;
  const [tab, setTab] = useState('instructions');
  const [guide, setGuide] = useState('muscle');

  if (!exercise) {
    return (
      <GlassScreen>
        <Text className="text-[28px] font-extrabold text-ink">Exercise not found</Text>
      </GlassScreen>
    );
  }

  const start = () => {
    const moves = program ? programMoves(program, getExercise) : normalizeMoves([exercise.id], getExercise);
    const startIndex = Math.max(0, moves.findIndex((item) => item.id === exercise.id));
    navigation.navigate('Player', {
      exerciseIds: moves.map((item) => item.id),
      moves,
      startIndex,
      programId: program?.id,
    });
  };

  const starred = (profile.favorites || []).includes(exercise.id);

  return (
    <GlassScreen>
      <View className="mb-2 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-ink">Exercises</Text>
        <TouchableOpacity onPress={() => toggleFavorite(exercise.id)} className="p-2">
          <Ionicons name={starred ? 'star' : 'star-outline'} size={20} color={starred ? '#BA4A0C' : '#1A1A1A'} />
        </TouchableOpacity>
      </View>

      <Text className="mb-3 text-[28px] font-extrabold text-ink">{exercise.name}</Text>
      <View className="mb-4 flex-row gap-6">
        <TouchableOpacity onPress={() => setTab('instructions')}>
          <Text className={`text-base font-semibold ${tab === 'instructions' ? 'text-ink underline' : 'text-muted'}`}>
            Instructions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('record')}>
          <Text className={`text-base font-semibold ${tab === 'record' ? 'text-ink underline' : 'text-muted'}`}>
            Record
          </Text>
        </TouchableOpacity>
      </View>

      <GlassCard className="mb-4">
        <ExerciseGif uri={exercise.gifUrl} frames={exercise.photoFrames} style={{ height: 200 }} />
      </GlassCard>

      <View className="mb-5 flex-row gap-3">
        <TouchableOpacity
          className={`flex-1 items-center rounded-full py-3 ${guide === 'muscle' ? 'bg-accent' : 'bg-surface'}`}
          onPress={() => setGuide('muscle')}
        >
          <Text className={`font-bold ${guide === 'muscle' ? 'text-white' : 'text-ink'}`}>Muscle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 items-center rounded-full py-3 ${guide === 'how' ? 'bg-accent' : 'bg-surface'}`}
          onPress={() => navigation.navigate('HowTo', { exerciseId: exercise.id })}
        >
          <Text className={`font-bold ${guide === 'how' ? 'text-white' : 'text-ink'}`}>How to do</Text>
        </TouchableOpacity>
      </View>

      {tab === 'record' ? (
        <Text className="text-[15px] leading-[22px] text-muted">
          {profile.lastSets?.[exercise.id]
            ? `Last logged: ${profile.lastSets[exercise.id].reps} reps${profile.lastSets[exercise.id].weightKg ? ` · ${profile.lastSets[exercise.id].weightKg} kg` : ''}`
            : 'No sets logged yet. Finish this move in the player to save a record.'}
        </Text>
      ) : guide === 'muscle' ? (
        <>
          <Text className="mb-2.5 text-lg font-bold text-ink">Focus Area</Text>
          <View className="mb-4 flex-row gap-4">
            {exercise.focus?.map((item) => (
              <View key={item} className="flex-row items-center gap-1.5">
                <View className="h-2 w-2 rounded-full bg-[#FF4D4F]" />
                <Text className="font-semibold text-ink">{item}</Text>
              </View>
            ))}
          </View>
          <GlassCard>
            <View className="items-center py-6">
              <Figure highlight={exercise.focus} />
            </View>
          </GlassCard>
        </>
      ) : (
        <Text className="text-[15px] leading-[22px] text-muted">{exercise.muscleHint}</Text>
      )}

      <View className="mt-6">
        <PrimaryButton title="Start" icon="play" onPress={start} />
      </View>
    </GlassScreen>
  );
}
