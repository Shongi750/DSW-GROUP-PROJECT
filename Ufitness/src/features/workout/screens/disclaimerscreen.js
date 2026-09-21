import React from 'react';
import { Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { GlassCard, GlassScreen } from '../components/glass';
import PrimaryButton from '../components/button';

export default function DisclaimerScreen() {
  const { profile, completeOnboarding, acceptDisclaimer } = useApp();
  const alreadyIn = profile.onboarded;

  return (
    <GlassScreen scroll={false} contentClassName="flex-1">
      <Text className="mt-3 text-[26px] font-extrabold text-ink">Before you start</Text>
      <GlassCard className="mt-4">
        <Text className="text-base leading-[22px] text-muted">
          uFitness is general fitness, not medical care. Stop if you feel sharp pain, dizziness, or chest discomfort, and talk to a clinician if you have an injury or condition.
        </Text>
        <Text className="mt-4 text-base leading-[22px] text-muted">
          Missing a day does not mean two workouts tomorrow. Do the next scheduled session only.
        </Text>
      </GlassCard>
      <View className="mt-auto">
        <PrimaryButton
          title={alreadyIn ? 'I UNDERSTAND — CONTINUE' : 'I UNDERSTAND — START WEEK 1'}
          icon="checkmark"
          onPress={() =>
            alreadyIn
              ? acceptDisclaimer()
              : completeOnboarding({
                  planStartedAt: new Date().toISOString(),
                  acceptedDisclaimer: true,
                })
          }
        />
      </View>
    </GlassScreen>
  );
}
