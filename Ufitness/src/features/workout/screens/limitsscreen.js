import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useApp } from '../context/AppContext';
import { GlassCard, GlassScreen } from '../components/glass';
import PrimaryButton from '../components/button';

const OPTIONS = [
  { id: 'none', label: 'No issues' },
  { id: 'knees', label: 'Sore or cranky knees' },
];

export default function LimitsScreen({ navigation }) {
  const { profile, updateProfile } = useApp();
  const [injury, setInjury] = useState((profile.injuries || [])[0] || 'none');

  return (
    <GlassScreen scroll={false} contentClassName="flex-1">
      <View className="mt-2 h-1 w-[90%] rounded bg-accent" />
      <Text className="mt-6 text-[26px] font-extrabold text-ink">Anything we should swap?</Text>
      <Text className="mb-6 mt-2 leading-5 text-muted">
        If knees bother you, squats become wall sits and jumping jacks become marching. This is not medical advice.
      </Text>

      {OPTIONS.map((item) => (
        <GlassCard
          key={item.id}
          className={`mb-3 ${injury === item.id ? 'border-accent' : ''}`}
          onPress={() => setInjury(item.id)}
        >
          <Text className="text-lg font-extrabold text-ink">{item.label}</Text>
        </GlassCard>
      ))}

      <View className="mt-auto">
        <PrimaryButton
          title="NEXT"
          icon="arrow-forward"
          onPress={() => {
            updateProfile({ injuries: injury === 'none' ? [] : [injury] });
            navigation.navigate('Disclaimer');
          }}
        />
      </View>
    </GlassScreen>
  );
}
