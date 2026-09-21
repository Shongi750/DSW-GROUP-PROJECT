import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import ExerciseGif from '../components/exercisegif';
import { GlassCard, GlassScreen } from '../components/glass';
import PrimaryButton from '../components/button';

export default function HowToScreen({ navigation, route }) {
  const { getExercise } = useApp();
  const exercise = getExercise(route.params.exerciseId);

  if (!exercise) return null;

  return (
    <GlassScreen>
      <View className="mb-2 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text className="font-extrabold tracking-wide text-ink">{exercise.name.toUpperCase()}</Text>
        <View className="w-9" />
      </View>

      <GlassCard>
        <ExerciseGif uri={exercise.gifUrl} frames={exercise.photoFrames} />
      </GlassCard>

      <View className="my-4 flex-row justify-around">
        <Text className="font-bold text-muted">Video</Text>
        <Text className="font-bold text-accent">Muscle</Text>
        <Text className="font-bold text-muted">How to do</Text>
      </View>

      <Text className="mb-1.5 mt-3.5 font-extrabold text-accent">DURATION</Text>
      <Text className="text-base font-bold text-ink">{exercise.duration}s</Text>

      <Text className="mb-1.5 mt-3.5 font-extrabold text-accent">INSTRUCTIONS</Text>
      {exercise.instructions?.map((line) => (
        <Text key={line} className="mb-2 text-[15px] leading-[22px] text-ink">
          {line}
        </Text>
      ))}

      <Text className="mb-1.5 mt-3.5 font-extrabold text-accent">FOCUS AREA</Text>
      <View className="mt-1 flex-row gap-4">
        {(exercise.howToFocus || exercise.focus || []).map((item) => (
          <View key={item} className="flex-row items-center gap-1.5">
            <View className="h-2 w-2 rounded-full bg-[#FF4D4F]" />
            <Text className="font-semibold text-ink">{item}</Text>
          </View>
        ))}
      </View>

      <View className="mt-6">
        <PrimaryButton title="CLOSE" icon="close" onPress={() => navigation.goBack()} />
      </View>
    </GlassScreen>
  );
}
