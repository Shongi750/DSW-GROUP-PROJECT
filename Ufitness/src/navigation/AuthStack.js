import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import { authStartScreen } from '../lib/authEntry';
import { useApp } from '../context/AppContext';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  const [initialRouteName, setInitialRouteName] = useState(null);
  const { registerDraft } = useApp();

  useEffect(() => {
    let alive = true;
    // Coming back from the code screen with "Use a different email" → straight to Register.
    if (registerDraft) {
      setInitialRouteName('Register');
      return undefined;
    }
    authStartScreen().then((name) => {
      if (alive) setInitialRouteName(name || 'Register');
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!initialRouteName) {
    return <View style={{ flex: 1, backgroundColor: '#0A0A0A' }} />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { flex: 1, backgroundColor: '#0A0A0A' },
      }}
      initialRouteName={initialRouteName}
    >
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
    </Stack.Navigator>
  );
}
