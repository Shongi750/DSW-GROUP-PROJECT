import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useApp } from '../context/AppContext';
import { GlassCard, GlassScreen } from '../components/glass';
import PrimaryButton from '../components/button';
import { CAMPUSES } from '../data/onboardingOptions';

export default function CampusScreen({ navigation }) {
  const { profile, updateProfile } = useApp();
  const [campus, setCampus] = useState(profile.campus || '');

  return (
    <GlassScreen>
      <View className="mt-2 h-1 w-[84%] rounded bg-accent" />
      <Text className="mt-6 text-[26px] font-extrabold text-ink">Which UJ campus do you attend?</Text>
      <Text className="mb-6 mt-2 leading-5 text-muted">
        Buddies are matched with students on the same campus so you can train together.
      </Text>

      {CAMPUSES.map((item) => (
        <GlassCard
          key={item.value}
          className={`mb-3 ${campus === item.value ? 'border-accent' : ''}`}
          onPress={() => setCampus(item.value)}
        >
          <Text className="text-lg font-extrabold text-ink">{item.label}</Text>
        </GlassCard>
      ))}

      <View className="mt-6">
        <PrimaryButton
          title="NEXT"
          icon="arrow-forward"
          onPress={() => {
            updateProfile({ campus });
            navigation.navigate('Limits');
          }}
        />
      </View>
    </GlassScreen>
  );
}
