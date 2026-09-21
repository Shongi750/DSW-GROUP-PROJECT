import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { GlassCard, GlassScreen } from '../components/glass';
import PrimaryButton from '../components/button';
import { GOALS } from '../data/goals';

export default function GoalScreen({ navigation }) {
  const { profile, updateProfile } = useApp();
  const [goal, setGoal] = useState(profile.goal || 'hypertrophy');

  return (
    <GlassScreen>
      <View className="mt-2 h-1 w-[45%] rounded bg-accent" />
      <Text className="mt-6 text-[26px] font-extrabold text-ink">What are you training for?</Text>
      <Text className="mb-6 mt-2 leading-5 text-muted">
        This sets your sets, reps, rest and weekly volume. Each option follows published training research, not a
        template.
      </Text>

      {GOALS.map((item) => (
        <GlassCard
          key={item.id}
          className={`mb-3 ${goal === item.id ? 'border-accent' : ''}`}
          onPress={() => setGoal(item.id)}
        >
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-accent/20">
              <Ionicons name={item.icon} size={20} color="#BA4A0C" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-extrabold text-ink">{item.name}</Text>
              <Text className="mt-1 leading-5 text-muted">{item.blurb}</Text>
            </View>
          </View>
        </GlassCard>
      ))}

      <View className="mt-4">
        <PrimaryButton
          title="NEXT"
          icon="arrow-forward"
          onPress={() => {
            updateProfile({ goal });
            navigation.navigate('Equipment');
          }}
        />
      </View>
    </GlassScreen>
  );
}
