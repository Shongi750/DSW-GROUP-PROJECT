import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useApp } from '../context/AppContext';
import { GlassCard, GlassScreen } from '../components/glass';
import PrimaryButton from '../components/button';

// We only ask about knees here — the plan engine swaps moves when this is set.
const OPTIONS = [
  { id: 'none', label: 'No issues' },
  { id: 'knees', label: 'Sore or cranky knees' },
];

export default function LimitsScreen({ navigation }) {
  const { profile, updateProfile } = useApp();
  const [injury, setInjury] = useState((profile.injuries || [])[0] || 'none');

  function goNext() {
    updateProfile({ injuries: injury === 'none' ? [] : [injury] });
    navigation.navigate('Disclaimer');
  }

  return (
    <GlassScreen>
      <View className="mt-2 h-1 w-[90%] rounded bg-accent" />
      <Text className="mt-6 text-[26px] font-display uppercase text-ink">Anything we should swap?</Text>
      <Text className="mb-6 mt-2 leading-5 text-muted">
        If knees bother you, squats become wall sits and jumping jacks become marching. This is not medical advice.
      </Text>

      {OPTIONS.map(function (item) {
        return (
          <GlassCard
            key={item.id}
            className={`mb-3 ${injury === item.id ? 'border-accent' : ''}`}
            onPress={function () { setInjury(item.id); }}
          >
            <Text className="text-lg font-extrabold text-ink">{item.label}</Text>
          </GlassCard>
        );
      })}

      <View className="mt-8">
        <PrimaryButton title="NEXT" icon="arrow-forward" onPress={goNext} />
      </View>
    </GlassScreen>
  );
}
