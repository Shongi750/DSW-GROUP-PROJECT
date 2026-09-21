import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useApp } from '../../context/AppContext';
import WorkoutHomeScreen from './screens/WorkoutHomeScreen';
import ActiveWorkoutSessionScreen from './screens/ActiveWorkoutSessionScreen';
import CustomWorkoutBuilderScreen from './screens/CustomWorkoutBuilderScreen';
import ProgressDashboardScreen from '../progress/screens/ProgressDashboardScreen';
import ProfileEditScreen from '../progress/screens/ProfileEditScreen';

const Stack = createNativeStackNavigator();

function WorkoutStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkoutHome" component={WorkoutHomeScreen} />
      <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutSessionScreen} />
      <Stack.Screen name="CustomWorkoutBuilder" component={CustomWorkoutBuilderScreen} />
      <Stack.Screen name="ProgressDashboard" component={ProgressDashboardScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
    </Stack.Navigator>
  );
}

export default function WorkoutModule() {
  const { profile } = useApp();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!auth || !db) {
      setReady(true);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          await signInAnonymously(auth);
          return;
        }

        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        const next = {
          name: profile.name || snap.data()?.name || '',
          goal: profile.fitnessGoal || snap.data()?.goal || '',
          campus: profile.campus || snap.data()?.campus || '',
          level: profile.experienceLevel || snap.data()?.level || '',
        };
        if (!snap.exists() || next.goal || next.campus || next.name) {
          await setDoc(userRef, next, { merge: true });
        }
      } catch (error) {
        console.warn('Workout Firebase connect skipped', error?.message || error);
      } finally {
        setReady(true);
      }
    });

    return unsubscribe;
  }, [profile.campus, profile.experienceLevel, profile.fitnessGoal, profile.name]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#BA4A0C" />
      </View>
    );
  }

  return <WorkoutStack />;
}
