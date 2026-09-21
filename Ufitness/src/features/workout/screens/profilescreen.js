import React, { useState } from 'react';
import { Text, TouchableOpacity, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { FLOOR_PLAN } from '../data/floorPlan';
import { genderLabel } from '../../../data/genderOptions';
import { GlassCard, GlassScreen } from '../components/glass';
import PrimaryButton from '../components/button';

const SYNC_LABEL = {
  idle: 'Saved on this device only',
  syncing: 'Backing up…',
  synced: 'Backed up to your account',
  error: 'Backup failed — will retry on your next change',
};

export default function ProfileScreen({ navigation }) {
  const { profile, resetProgress, updateProfile, plan, connectExerciseDb, catalogSource, catalogError, catalogLoading, hasApiKey, syncState } =
    useApp();
  const { user, email, displayName, guest, signOut, authAvailable } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [apiMessage, setApiMessage] = useState('');

  const connect = async () => {
    setApiMessage('Connecting…');
    const result = await connectExerciseDb(apiKey);
    if (result.source === 'exercisedb') {
      setApiMessage(`Connected · ${result.catalog.length} moves loaded`);
      setApiKey('');
    } else {
      setApiMessage(result.error || 'Still on local moves. Check the key and restart Expo if you used a .env file.');
    }
  };

  return (
    <GlassScreen>
      <Text className="text-[28px] font-extrabold text-ink">Profile</Text>
      <Text className="mb-5 mt-1.5 text-muted">uFitness is general fitness, not medical care.</Text>

      <GlassCard className="mb-5">
        {user ? (
          <>
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-accent/20">
                <Ionicons name="person" size={20} color="#BA4A0C" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-ink">{displayName || 'Your account'}</Text>
                <Text className="mt-0.5 text-[13px] text-muted">{email}</Text>
              </View>
            </View>
            <Text className="mt-3 text-[13px] text-muted">{SYNC_LABEL[syncState] || SYNC_LABEL.idle}</Text>
            <TouchableOpacity className="mt-3 items-center py-2" onPress={signOut}>
              <Text className="font-bold text-muted">Sign out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text className="text-base font-bold text-ink">
              {authAvailable ? 'No account yet' : 'Accounts not configured'}
            </Text>
            <Text className="mt-1.5 text-[13px] leading-5 text-muted">
              {authAvailable
                ? 'Your workouts live only on this phone. Create an account and everything logged so far is kept and backed up.'
                : 'Firebase keys are missing, so everything stays on this device.'}
            </Text>
            {authAvailable ? (
              <View className="mt-3">
                <PrimaryButton
                  title="Create account or sign in"
                  icon="person-add"
                  onPress={() => navigation.navigate('Auth')}
                />
              </View>
            ) : null}
          </>
        )}
      </GlassCard>

      <GlassCard>
        <Text className="mt-1 text-muted">Plan</Text>
        <Text className="mt-1 text-lg font-bold text-ink">{plan?.name || FLOOR_PLAN.name}</Text>
        <Text className="mt-2.5 text-muted">Days / week</Text>
        <Text className="mt-1 text-lg font-bold text-ink">{profile.daysPerWeek || 3}</Text>
        <Text className="mt-2.5 text-muted">Knee swaps</Text>
        <Text className="mt-1 text-lg font-bold text-ink">
          {(profile.injuries || []).includes('knees') ? 'On' : 'Off'}
        </Text>
        <Text className="mt-2.5 text-muted">Gender</Text>
        <Text className="mt-1 text-lg font-bold text-ink">{genderLabel(profile.gender) || 'Not set'}</Text>
        <Text className="mt-2.5 text-muted">Weight</Text>
        <Text className="mt-1 text-lg font-bold text-ink">{Number(profile.weightKg || 0).toFixed(1)} kg</Text>
        <Text className="mt-2.5 text-muted">Campus</Text>
        <Text className="mt-1 text-lg font-bold text-ink">{profile.campus || 'Not set'}</Text>
      </GlassCard>

      <Text className="mb-3 mt-7 text-xl font-bold text-ink">ExerciseDB</Text>
      <GlassCard>
        <Text className="text-[13px] text-muted">
          {catalogLoading
            ? 'Loading exercise photos…'
            : catalogSource === 'open' || catalogSource === 'local+photos'
              ? 'Photos load without a key (open exercise library). RapidAPI is optional for animated GIFs.'
              : catalogSource === 'exercisedb'
                ? `Live ExerciseDB · ${catalogSource}`
                : catalogError || 'Open library loads photos. Add a RapidAPI key only if you want ExerciseDB GIFs.'}
        </Text>
        <TextInput
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="RapidAPI key"
          placeholderTextColor="#8E8E93"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          className="mt-3 rounded-2xl bg-surface px-4 py-3 text-ink"
          style={{ color: '#1A1A1A', paddingVertical: 12, paddingHorizontal: 14 }}
        />
        {apiMessage ? <Text className="mt-2 text-[13px] text-accent">{apiMessage}</Text> : null}
        <View className="mt-3">
          <PrimaryButton title={catalogLoading ? 'Connecting…' : 'Connect ExerciseDB'} icon="cloud-download" onPress={connect} />
        </View>
      </GlassCard>

      <Text className="mb-5 mt-5 leading-5 text-muted">
        Stop if you feel sharp pain, dizziness, or chest discomfort. Missing a day does not mean two sessions tomorrow.
      </Text>

      <PrimaryButton title="Reset workout progress" icon="refresh" onPress={resetProgress} />
      <TouchableOpacity className="items-center py-4" onPress={() => updateProfile({ onboarded: false })}>
        <Text className="font-bold text-muted">Replay onboarding</Text>
      </TouchableOpacity>
    </GlassScreen>
  );
}
