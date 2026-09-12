// navigation/RootNavigator.js
//
// Top-level switch: shows a loading spinner while checking auth state,
// AuthNavigator (Login/Sign Up) when signed out, and BuddySystemNavigator
// (with the student's Firestore profile loaded) when signed in.

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { subscribeToAuthChanges } from '../services/authService';
import { getStudentById } from '../services/buddyService';
import AuthNavigator from './AuthNavigator';
import BuddySystemNavigator from './BuddySystemNavigator';

export default function RootNavigator() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setProfileError(null);

      if (!user) {
        setCurrentStudent(null);
        setCheckingAuth(false);
        return;
      }

      try {
        // Authentication is authoritative. Older accounts may not have a
        // student document yet, so keep them signed in with safe defaults.
        const profile = await getStudentById(user.uid);
        setCurrentStudent({
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Student',
          campus: 'APK',
          fitnessGoal: 'General fitness',
          experienceLevel: 'Beginner',
          preferredSchedule: [],
          workoutLocation: 'Gym',
          ...(profile || {}),
        });
      } catch (error) {
        setCurrentStudent(null);
        setProfileError(`Signed in, but your profile could not be loaded: ${error.message}`);
      }
      setCheckingAuth(false);
    });
    return unsubscribe;
  }, []);

  if (checkingAuth) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return currentStudent ? (
    <BuddySystemNavigator currentStudent={currentStudent} />
  ) : (
    <AuthNavigator errorMessage={profileError} />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F7F8' },
});
