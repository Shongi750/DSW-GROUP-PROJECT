import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GlassScreen } from '../components/glass';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { CAMPUSES } from '../data/onboardingOptions';
import { colors } from '../constants/theme';

const SAMPLE_BUDDIES = [
  { id: 'apk-1', name: 'Aisha M.', campus: 'APK', goal: 'Build strength', level: 'Intermediate' },
  { id: 'apk-2', name: 'Thabo N.', campus: 'APK', goal: 'Improve general fitness', level: 'Beginner' },
  { id: 'apb-1', name: 'Lebo K.', campus: 'APB', goal: 'Improve endurance', level: 'Intermediate' },
  { id: 'dfc-1', name: 'Naledi P.', campus: 'DFC', goal: 'Build strength', level: 'Advanced' },
  { id: 'dfc-2', name: 'Sipho D.', campus: 'DFC', goal: 'Improve overall health', level: 'Beginner' },
  { id: 'swc-1', name: 'Zanele R.', campus: 'SWC', goal: 'Improve general fitness', level: 'Intermediate' },
];

export default function BuddyScreen() {
  const { profile } = useApp();
  const { user, guest } = useAuth();
  const [sent, setSent] = useState([]);
  const campus = profile.campus || 'APK';
  const campusLabel = CAMPUSES.find((item) => item.value === campus)?.label || campus;

  const buddies = useMemo(
    () => SAMPLE_BUDDIES.filter((item) => item.campus === campus),
    [campus]
  );

  const connect = (buddy) => {
    if (sent.includes(buddy.id)) return;
    setSent((prev) => [...prev, buddy.id]);
    Alert.alert(
      'Request sent',
      user && !guest
        ? `A buddy request has been sent to ${buddy.name}.`
        : `Saved locally for ${buddy.name}. Sign in to send campus requests.`
    );
  };

  return (
    <GlassScreen>
      <Text className="text-[28px] font-extrabold text-ink">Find a Buddy</Text>
      <Text className="mb-5 mt-1 text-[16px] font-semibold text-accent">Students at {campusLabel}</Text>

      {buddies.length ? (
        buddies.map((buddy) => {
          const requested = sent.includes(buddy.id);
          return (
            <GlassCard key={buddy.id} className="mb-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-xl font-extrabold text-ink">{buddy.name}</Text>
                  <View className="mt-2 self-start rounded-lg bg-accentDark px-2 py-1" style={{ backgroundColor: colors.accentDark }}>
                    <Text className="text-[12px] font-extrabold text-accent">{buddy.level}</Text>
                  </View>
                  <Text className="mt-2 text-[14px] text-muted">Campus · {buddy.campus}</Text>
                  <Text className="mt-1 text-[14px] text-muted">Goal · {buddy.goal}</Text>
                </View>
                <TouchableOpacity
                  disabled={requested}
                  onPress={() => connect(buddy)}
                  className="rounded-[10px] px-5 py-3"
                  style={{ backgroundColor: requested ? '#E0E0E0' : colors.orange }}
                >
                  <Text className="text-[14px] font-extrabold text-white">{requested ? 'Sent' : 'Connect'}</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          );
        })
      ) : (
        <GlassCard>
          <View className="items-center py-6">
            <Ionicons name="people-outline" size={32} color={colors.accent} />
            <Text className="mt-3 text-center text-[16px] leading-6 text-muted">
              No other students found at {campusLabel} yet. Invite friends from your campus.
            </Text>
          </View>
        </GlassCard>
      )}
    </GlassScreen>
  );
}
