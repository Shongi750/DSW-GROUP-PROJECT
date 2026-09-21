import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GlassPanel } from './glass';

export default function InsightsRow({ percent, onStartNew }) {
  return (
    <View className="flex-row gap-3">
      <GlassPanel className="h-[118px] w-[118px]">
        <View className="h-full items-center justify-center">
          <View className="h-[88px] w-[88px] items-center justify-center rounded-full border-8 border-accent">
            <Text className="text-lg font-extrabold text-ink">{percent}%</Text>
          </View>
        </View>
      </GlassPanel>
      <View className="flex-1">
        <GlassCard className="min-h-[118px]" onPress={onStartNew}>
          <View className="h-8 w-8 items-center justify-center rounded-full bg-black/10">
            <Ionicons name="play" size={16} color="#FFFFFF" />
          </View>
          <Text className="mt-2.5 text-lg font-bold text-ink">View progress</Text>
        </GlassCard>
      </View>
    </View>
  );
}
