import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { GlassCard, GlassScreen } from '../components/glass';
import PrimaryButton from '../components/button';
import { EQUIPMENT_TIERS, EXPERIENCE_LEVELS } from '../data/goals';

export default function EquipmentScreen({ navigation }) {
  const { profile, updateProfile } = useApp();
  const [tier, setTier] = useState(profile.equipmentTier || 'bodyweight');
  const [experience, setExperience] = useState(profile.experience || 'new');

  return (
    <GlassScreen>
      <View className="mt-2 h-1 w-[60%] rounded bg-accent" />
      <Text className="mt-6 text-[26px] font-extrabold text-ink">What can you train with?</Text>
      <Text className="mb-6 mt-2 leading-5 text-muted">
        Exercise selection follows your equipment. You can change this later without losing progress.
      </Text>

      {EQUIPMENT_TIERS.map((item) => (
        <GlassCard
          key={item.id}
          className={`mb-3 ${tier === item.id ? 'border-accent' : ''}`}
          onPress={() => setTier(item.id)}
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

      <Text className="mb-3 mt-6 text-lg font-bold text-ink">How much training have you done?</Text>
      <Text className="mb-3 leading-5 text-muted">
        Newer lifters start with fewer sets, since less volume is enough to grow at first.
      </Text>

      <View className="flex-row gap-2">
        {EXPERIENCE_LEVELS.map((item) => (
          <GlassCard
            key={item.id}
            className={`flex-1 ${experience === item.id ? 'border-accent' : ''}`}
            onPress={() => setExperience(item.id)}
          >
            <Text className="text-[15px] font-bold text-ink">{item.name}</Text>
            <Text className="mt-1 text-[12px] leading-4 text-muted">{item.blurb}</Text>
          </GlassCard>
        ))}
      </View>

      <View className="mt-6">
        <PrimaryButton
          title="NEXT"
          icon="arrow-forward"
          onPress={() => {
            updateProfile({ equipmentTier: tier, experience });
            navigation.navigate('Days');
          }}
        />
      </View>
    </GlassScreen>
  );
}
