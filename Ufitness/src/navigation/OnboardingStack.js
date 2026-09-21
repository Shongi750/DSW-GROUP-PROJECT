import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import FitnessGoalScreen from '../screens/onboarding/FitnessGoalScreen';

const Stack = createNativeStackNavigator();

function SetupScreen({ navigation }) {
  const { profile, updateFields, completeOnboarding } = useApp();
  return (
    <FitnessGoalScreen
      navigation={navigation}
      data={profile}
      updateFields={updateFields}
      completeOnboarding={completeOnboarding}
    />
  );
}

export default function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { flex: 1 } }}>
      <Stack.Screen name="FitnessGoal" component={SetupScreen} />
    </Stack.Navigator>
  );
}
