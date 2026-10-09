import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { setupLooksComplete } from '../lib/profileStore';
import { authGate } from '../lib/authGuard';
import AuthStack from './AuthStack';
import UnlockScreen from '../screens/auth/UnlockScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import SuspendedScreen from '../screens/auth/SuspendedScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, profile, pendingOtp, sessionLocked, suspension } = useApp();
  // Home is only reachable with a real, confirmed Supabase user (see lib/authGuard.js).
  const gate = authGate({ user, pendingOtp });

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { flex: 1 } }}>
      {gate === 'verify' ? (
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      ) : gate === 'auth' ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : sessionLocked ? (
        <Stack.Screen name="Unlock" component={UnlockScreen} />
      ) : suspension.suspended ? (
        <Stack.Screen name="Suspended" component={SuspendedScreen} />
      ) : !setupLooksComplete(profile) ? (
        <Stack.Screen
          name="Onboarding"
          getComponent={() => require('./OnboardingStack').default}
        />
      ) : (
        <Stack.Screen name="Main" getComponent={() => require('./MainStack').default} />
      )}
    </Stack.Navigator>
  );
}
