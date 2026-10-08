import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useApp } from '../context/AppContext';
import { GlassCard, GlassScreen } from '../components/glass';
import PrimaryButton from '../components/button';
import { CAMPUSES } from '../data/onboardingOptions';

// Workout-side campus pick (same list as main onboarding)
export default function CampusScreen({ navigation }) {
  const { profile, updateProfile } = useApp();
  const [campus, setCampus] = useState(profile.campus || '');

  function goNext() {
    updateProfile({ campus: campus });
    navigation.navigate('Limits');
  }

  return (
    <GlassScreen>
      <View className="mt-2 h-1 w-[84%] rounded bg-accent" />
      <Text className="mt-6 text-[26px] font-display uppercase text-ink">Which UJ campus do you attend?</Text>
      <Text className="mb-6 mt-2 leading-5 text-muted">
        Buddies are matched with students on the same campus so you can train together.
      </Text>

      {CAMPUSES.map(function (item) {
        const selected = campus === item.value;
        return (
          <GlassCard
            key={item.value}
            className={'mb-3 ' + (selected ? 'border-accent' : '')}
            onPress={function () {
              setCampus(item.value);
            }}
          >
            <Text className="text-lg font-extrabold text-ink">{item.label}</Text>
          </GlassCard>
        );
      })}

      <View className="mt-6">
        <PrimaryButton title="NEXT" icon="arrow-forward" onPress={goNext} />
      </View>
    </GlassScreen>
  );
}
