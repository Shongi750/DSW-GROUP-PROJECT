import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { setupLooksComplete } from '../lib/profileStore';
import { useTheme } from '../context/ThemeContext';
import AuthStack from './AuthStack';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { booting, user, profile, needsEmailVerification } = useApp();
  const { colors } = useTheme();

  if (booting) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { flex: 1 } }}>
      {needsEmailVerification ? (
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      ) : !user ? (
        <Stack.Screen name="Auth" component={AuthStack} />
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

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9F9FB',
  },
});
