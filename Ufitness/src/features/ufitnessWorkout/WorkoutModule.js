import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WorkoutHubScreen from './screens/WorkoutHubScreen';
import WorkoutDetailScreen from './screens/WorkoutDetailScreen';
import WorkoutSessionScreen from './screens/WorkoutSessionScreen';

const Stack = createNativeStackNavigator();

export default function WorkoutModule() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkoutHub" component={WorkoutHubScreen} />
      <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
      <Stack.Screen name="WorkoutSession" component={WorkoutSessionScreen} />
    </Stack.Navigator>
  );
}
