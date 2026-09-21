import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useApp as useMainApp } from '../../../context/AppContext';
import { GENDER_OPTIONS } from '../../../data/genderOptions';
import { GlassPanel, GlassScreen } from '../components/glass';
import PrimaryButton from '../components/button';

export default function GenderScreen({ navigation }) {
  const { profile, updateProfile, completeOnboarding } = useApp();
  const { profile: mainProfile } = useMainApp();
  const [gender, setGender] = useState(profile.gender || mainProfile?.gender || '');

  const skip = () =>
    completeOnboarding({
      planStartedAt: new Date().toISOString(),
      acceptedDisclaimer: true,
      daysPerWeek: 3,
      campus: profile.campus || mainProfile?.campus || 'APK',
      injuries: [],
      ...(gender ? { gender } : {}),
    });

  return (
    <GlassScreen scroll={false} contentClassName="flex-1">
      <View className="mt-2 h-1 w-[28%] rounded bg-accent" />
      <TouchableOpacity className="self-end p-2" onPress={skip}>
        <Text className="font-bold text-muted">Skip</Text>
      </TouchableOpacity>

      <Text className="mt-3 text-center text-[28px] font-extrabold text-ink">How do you describe yourself?</Text>
      <Text className="mt-2 text-center text-muted">Optional. Workouts stay the same either way.</Text>

      <View className="mt-8 flex-row flex-wrap justify-between gap-y-4">
        {GENDER_OPTIONS.map((item) => {
          const selected = gender === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              className="w-[48%] items-center"
              onPress={() => setGender(selected ? '' : item.id)}
            >
              <GlassPanel className={`h-[120px] w-full items-center justify-center rounded-[28px] ${selected ? 'border-accent' : ''}`}>
                <Ionicons name={item.icon} size={40} color={selected ? '#BA4A0C' : '#C8C8C8'} />
              </GlassPanel>
              <Text className={`mt-2 text-center font-bold ${selected ? 'text-ink' : 'text-muted'}`}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="mt-auto">
        <PrimaryButton
          title="NEXT"
          icon="arrow-forward"
          onPress={() => {
            updateProfile({ gender });
            navigation.navigate('Weight');
          }}
        />
      </View>
    </GlassScreen>
  );
}
