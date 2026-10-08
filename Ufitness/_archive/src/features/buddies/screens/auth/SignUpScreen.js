// screens/auth/SignUpScreen.js
//
// Creates a Firebase Auth account and the matching `students` Firestore
// profile document, so the new user can immediately be matched by
// buddyService.js.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import ChipSelector from '../../components/ChipSelector';
import { signUp } from '../../services/authService';
import { useTheme } from '../../../../context/ThemeContext';

const display = { fontFamily: 'Anton_400Regular', letterSpacing: 0.8 };

const CAMPUSES = ['APK', 'APB', 'DFC', 'SW'];
const GOALS = ['Weight management', 'Muscle/strength development', 'General fitness', 'Improve endurance'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const LOCATIONS = ['Gym', 'Home'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Props: onNavigateToLogin: () => void
export default function SignUpScreen({ onNavigateToLogin }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [campus, setCampus] = useState(CAMPUSES[0]);
  const [fitnessGoal, setFitnessGoal] = useState(GOALS[0]);
  const [experienceLevel, setExperienceLevel] = useState(LEVELS[0]);
  const [workoutLocation, setWorkoutLocation] = useState(LOCATIONS[0]);
  const [preferredSchedule, setPreferredSchedule] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing info', 'Please fill in your name, email and password.');
      return;
    }
    if (preferredSchedule.length === 0) {
      Alert.alert('Pick your days', 'Select at least one day you usually train.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, {
        name: name.trim(),
        campus,
        fitnessGoal,
        experienceLevel,
        workoutLocation,
        preferredSchedule,
      });
      // No navigation needed here - RootNavigator's auth listener will
      // detect the new signed-in user and switch to the main app.
    } catch (error) {
      Alert.alert('Sign up failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Your Account</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Jane Doe"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="jane@student.uj.ac.za"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="At least 6 characters"
        placeholderTextColor={colors.muted}
        secureTextEntry
      />

      <Text style={styles.label}>Campus</Text>
      <ChipSelector options={CAMPUSES} value={campus} onChange={setCampus} />

      <Text style={styles.label}>Fitness goal</Text>
      <ChipSelector options={GOALS} value={fitnessGoal} onChange={setFitnessGoal} />

      <Text style={styles.label}>Experience level</Text>
      <ChipSelector options={LEVELS} value={experienceLevel} onChange={setExperienceLevel} />

      <Text style={styles.label}>Preferred workout location</Text>
      <ChipSelector options={LOCATIONS} value={workoutLocation} onChange={setWorkoutLocation} />

      <Text style={styles.label}>Usual training days</Text>
      <ChipSelector options={DAYS} value={preferredSchedule} onChange={setPreferredSchedule} multiple />

      <Pressable style={styles.button} onPress={handleSignUp} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
      </Pressable>

      <Pressable onPress={onNavigateToLogin} style={styles.linkRow}>
        <Text style={styles.linkText}>Already have an account? Log in</Text>
      </Pressable>
    </ScrollView>
  );
}

function createStyles(colors, isDark) {
  return StyleSheet.create({
    container: { padding: 20, paddingBottom: 40, backgroundColor: colors.background },
    title: { ...display, fontSize: 26, color: colors.text, marginBottom: 20, textTransform: 'uppercase' },
    label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginTop: 16, marginBottom: 8 },
    input: {
      backgroundColor: colors.input,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    button: {
      backgroundColor: colors.brand,
      borderRadius: 999,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 28,
    },
    buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
    linkRow: { marginTop: 16, alignItems: 'center' },
    linkText: { color: colors.brand, fontWeight: '600', fontSize: 13 },
  });
}
