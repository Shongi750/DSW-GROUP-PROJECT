import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { GlassCard, GlassScreen } from '../components/glass';
import PrimaryButton from '../components/button';

function Field({ label, ...props }) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-[13px] font-semibold text-muted">{label}</Text>
      <TextInput
        placeholderTextColor="#6B6B70"
        className="rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-ink"
        style={{ color: '#1A1A1A' }}
        {...props}
      />
    </View>
  );
}

export default function AuthScreen({ navigation }) {
  const { signIn, signUp, resetPassword, continueAsGuest, busy, authAvailable, guest } = useAuth();
  const [mode, setMode] = useState('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const isSignUp = mode === 'signup';

  const submit = async () => {
    setError('');
    setMessage('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    const result = isSignUp ? await signUp({ email, password, name }) : await signIn({ email, password });
    if (!result.ok) setError(result.error);
    else if (guest) navigation?.goBack?.();
  };

  const forgot = async () => {
    setError('');
    setMessage('');
    if (!email.trim()) {
      setError('Enter your email first, then tap reset.');
      return;
    }
    const result = await resetPassword(email);
    if (result.ok) setMessage('Password reset email sent. Check your inbox.');
    else setError(result.error);
  };

  if (!authAvailable) {
    return (
      <GlassScreen>
        <Text className="mt-6 text-[28px] font-extrabold text-ink">Accounts not configured</Text>
        <Text className="mb-5 mt-3 leading-6 text-muted">
          Firebase keys are missing, so accounts and cloud backup are switched off. The app still works and keeps
          everything on this device.
        </Text>
        <GlassCard>
          <Text className="text-[13px] leading-5 text-muted">
            Add your Firebase web config to the .env file as EXPO_PUBLIC_FIREBASE_API_KEY, AUTH_DOMAIN, PROJECT_ID,
            STORAGE_BUCKET, MESSAGING_SENDER_ID and APP_ID, then restart Expo.
          </Text>
        </GlassCard>
        <View className="mt-6">
          <PrimaryButton title="Continue on this device" icon="arrow-forward" onPress={continueAsGuest} />
        </View>
      </GlassScreen>
    );
  }

  return (
    <GlassScreen>
      {guest ? (
        <TouchableOpacity className="self-start p-2" onPress={() => navigation?.goBack?.()}>
          <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
      ) : null}

      <View className="mt-6 h-12 w-12 items-center justify-center rounded-2xl bg-accent">
        <Ionicons name="barbell" size={24} color="#FFFFFF" />
      </View>
      <Text className="mt-4 text-[30px] font-extrabold text-ink">
        {isSignUp ? 'Create your account' : 'Welcome back'}
      </Text>
      <Text className="mb-6 mt-2 leading-6 text-muted">
        {isSignUp
          ? 'Your plan, history and personal records get backed up and follow you to any device.'
          : 'Sign in to pick up your plan and history where you left off.'}
      </Text>

      <View className="mb-5 flex-row gap-2">
        {[
          ['signin', 'Sign in'],
          ['signup', 'Create account'],
        ].map(([value, label]) => (
          <TouchableOpacity
            key={value}
            onPress={() => {
              setMode(value);
              setError('');
              setMessage('');
            }}
            style={{
              flex: 1,
              alignItems: 'center',
              borderRadius: 999,
              borderWidth: 1,
              paddingVertical: 12,
              borderColor: mode === value ? '#BA4A0C' : 'rgba(0,0,0,0.10)',
              backgroundColor: mode === value ? 'rgba(186,74,12,0.12)' : '#FFFFFF',
            }}
          >
            <Text style={{ fontWeight: '700', color: mode === value ? '#1A1A1A' : '#666666' }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isSignUp ? (
        <Field label="Name" value={name} onChangeText={setName} placeholder="Optional" autoCapitalize="words" />
      ) : null}
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
        secureTextEntry
        autoCapitalize="none"
        textContentType={isSignUp ? 'newPassword' : 'password'}
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      {error ? (
        <View className="mb-3 rounded-2xl border border-[#FF6B6B]/40 bg-[#FF6B6B]/15 px-4 py-3">
          <Text style={{ color: '#FF8A8A', fontSize: 13, fontWeight: '700', lineHeight: 20 }}>{error}</Text>
        </View>
      ) : null}
      {message ? (
        <Text style={{ color: '#BA4A0C', fontSize: 13, fontWeight: '700', marginBottom: 8 }}>{message}</Text>
      ) : null}

      <View className="mt-2">
        {busy ? (
          <View className="items-center py-4">
            <ActivityIndicator color="#BA4A0C" />
          </View>
        ) : (
          <PrimaryButton
            title={isSignUp ? 'Create account' : 'Sign in'}
            icon={isSignUp ? 'person-add' : 'log-in'}
            onPress={submit}
          />
        )}
      </View>

      {!isSignUp ? (
        <TouchableOpacity onPress={forgot} className="items-center py-4">
          <Text className="font-semibold text-accent">Forgot your password?</Text>
        </TouchableOpacity>
      ) : null}

      {!guest ? (
        <TouchableOpacity onPress={continueAsGuest} className="items-center py-3">
          <Text className="font-semibold text-muted">Continue without an account</Text>
        </TouchableOpacity>
      ) : null}

      <Text className="mb-4 mt-2 text-center text-[12px] leading-5 text-muted">
        Without an account your workouts live only on this phone, and reinstalling the app loses them.
      </Text>
    </GlassScreen>
  );
}
