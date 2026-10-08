import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { GlassScreen } from '../components/glass';
import PrimaryButton from '../components/button';

export default function WeightScreen({ navigation }) {
  const { profile, updateProfile } = useApp();
  const [weight, setWeight] = useState(profile.weightKg || 75);

  // Optional field — used locally for progress context, not sent to a doctor.
  function bump(delta) {
    setWeight(function (value) {
      return Math.max(30, Math.min(200, Math.round((value + delta) * 10) / 10));
    });
  }

  function goNext() {
    updateProfile({ weightKg: weight });
    navigation.navigate('Days');
  }

  return (
    <GlassScreen>
      <View className="mt-2 h-1 w-1/2 rounded bg-accent" />
      <TouchableOpacity className="self-end p-2" onPress={goNext}>
        <Text className="font-bold text-muted">Skip</Text>
      </TouchableOpacity>

      <Text className="mt-2 text-center text-[22px] font-display uppercase text-ink">Your weight</Text>
      <Text className="mb-7 mt-2 text-center text-muted">Stored on this device only. Not a medical measurement.</Text>

      <Text className="mb-2 font-bold text-ink">Weight</Text>
      <View className="mb-6 flex-row items-center gap-2.5">
        <TouchableOpacity onPress={function () { bump(-0.5); }} className="h-8 w-8 items-center justify-center rounded-full bg-accent">
          <Ionicons name="remove" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-[40px] font-display uppercase text-ink">{weight.toFixed(1)}</Text>
        <Text className="font-bold text-muted">kg</Text>
        <TouchableOpacity onPress={function () { bump(0.5); }} className="h-8 w-8 items-center justify-center rounded-full bg-accent">
          <Ionicons name="add" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View className="mt-auto">
        <PrimaryButton title="NEXT" icon="arrow-forward" onPress={goNext} />
      </View>
    </GlassScreen>
  );
}
