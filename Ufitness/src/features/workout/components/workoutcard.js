import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './glass';
import PrimaryButton from './button';

export default function WorkoutCard({
  variant = 'featured',
  eyebrow,
  title,
  progressLabel,
  onPress,
  onStart,
}) {
  if (variant === 'compact') {
    return (
      <GlassCard onPress={onPress}>
        <Text className="mb-1 text-[13px] text-muted">{eyebrow}</Text>
        <Text className="text-xl font-bold text-ink">{title}</Text>
        <Text className="mt-1 text-[13px] text-muted">{progressLabel}</Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="border-accent/30">
      <View className="mb-3 flex-row items-center gap-3.5">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-accent/20">
          <Ionicons name="body" size={36} color="#BA4A0C" />
        </View>
        <View className="flex-1">
          <Text className="mb-1 text-[13px] text-muted">{eyebrow}</Text>
          <Text className="text-xl font-bold text-ink">{title}</Text>
          <Text className="mt-1 text-[13px] text-muted">{progressLabel}</Text>
        </View>
      </View>
      <PrimaryButton title="Start" onPress={onStart} />
    </GlassCard>
  );
}
