import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import HomeScreen from './screens/homescreen';
import WorkoutScreen from './screens/workoutscreen';
import CoachingScreen from './screens/coachingscreen';
import ExercisesScreen from './screens/exercisescreen';
import ExerciseDetailScreen from './screens/exercisedetail';
import HowToScreen from './screens/howto';
import ClipScreen from './screens/clipscreen';
import BuilderScreen from './screens/builder';
import InsightsScreen from './screens/insightsscreen';
import GenderScreen from './screens/genderscreen';
import WeightScreen from './screens/weightscreen';
import GoalScreen from './screens/goalscreen';
import EquipmentScreen from './screens/equipmentscreen';
import PlanScreen from './screens/planscreen';
import MusicScreen from './screens/musicscreen';
import DaysScreen from './screens/daysscreen';
import LimitsScreen from './screens/limitsscreen';
import DisclaimerScreen from './screens/disclaimerscreen';
import PlayerScreen from './screens/playerscreen';
import PreStartScreen from './screens/prestartscreen';
import FinishScreen from './screens/finishscreen';
import CampusScreen from './screens/campusscreen';
import { colors } from './constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { WorkoutLeaveProvider, WorkoutPageChrome } from './context/LeaveContext';

const RootStack = createNativeStackNavigator();
const OnboardingStack = createNativeStackNavigator();
const WorkoutsStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const icons = {
  Home: ['home-outline', 'home'],
  Plan: ['calendar-outline', 'calendar'],
  Workouts: ['barbell-outline', 'barbell'],
  Insights: ['stats-chart-outline', 'stats-chart'],
};

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <OnboardingStack.Screen name="Gender" component={GenderScreen} />
      <OnboardingStack.Screen name="Weight" component={WeightScreen} />
      <OnboardingStack.Screen name="Goal" component={GoalScreen} />
      <OnboardingStack.Screen name="Equipment" component={EquipmentScreen} />
      <OnboardingStack.Screen name="Days" component={DaysScreen} />
      <OnboardingStack.Screen name="Campus" component={CampusScreen} />
      <OnboardingStack.Screen name="Limits" component={LimitsScreen} />
      <OnboardingStack.Screen name="Disclaimer" component={DisclaimerScreen} />
    </OnboardingStack.Navigator>
  );
}

function WorkoutsNavigator() {
  return (
    <WorkoutsStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <WorkoutsStack.Screen name="Programs" component={WorkoutScreen} />
      <WorkoutsStack.Screen name="Coaching" component={CoachingScreen} />
      <WorkoutsStack.Screen name="Exercises" component={ExercisesScreen} />
      <WorkoutsStack.Screen name="Builder" component={BuilderScreen} />
      <WorkoutsStack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
      <WorkoutsStack.Screen name="HowTo" component={HowToScreen} />
      <WorkoutsStack.Screen name="Clip" component={ClipScreen} />
    </WorkoutsStack.Navigator>
  );
}

function WorkoutTabs() {
  const { colors: theme } = useTheme();
  return (
    <WorkoutPageChrome>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          height: 62,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const [outline, filled] = icons[route.name] || ['ellipse-outline', 'ellipse'];
          return <Ionicons name={focused ? filled : outline} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Plan" component={PlanScreen} />
      <Tab.Screen name="Workouts" component={WorkoutsNavigator} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
    </Tab.Navigator>
    </WorkoutPageChrome>
  );
}

function MainNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <RootStack.Screen name="Main" component={WorkoutTabs} />
      <RootStack.Screen name="PreStart" component={PreStartScreen} options={{ presentation: 'modal' }} />
      <RootStack.Screen name="Player" component={PlayerScreen} options={{ presentation: 'fullScreenModal' }} />
      <RootStack.Screen name="Finish" component={FinishScreen} options={{ presentation: 'fullScreenModal' }} />
      <RootStack.Screen name="Music" component={MusicScreen} options={{ presentation: 'modal' }} />
      <RootStack.Screen name="Auth" component={SignedInNote} options={{ presentation: 'modal' }} />
    </RootStack.Navigator>
  );
}

function Spinner() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

function SignedInNote() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 16, textAlign: 'center' }}>
        Workout uses the same UFitness account. Sign in once from the main screen.
      </Text>
    </View>
  );
}

function WorkoutRoot({ onLeave }) {
  const { ready, profile } = useApp();
  const { authReady, user } = useAuth();

  if (!ready || !authReady) {
    return <Spinner />;
  }

  const body = !user
    ? (
      <WorkoutPageChrome>
        <SignedInNote />
      </WorkoutPageChrome>
    )
    : profile.onboarded && profile.acceptedDisclaimer
      ? <MainNavigator />
      : (
        <WorkoutPageChrome>
          {profile.onboarded ? (
            <RootStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
              <RootStack.Screen name="Disclaimer" component={DisclaimerScreen} />
            </RootStack.Navigator>
          ) : (
            <OnboardingNavigator />
          )}
        </WorkoutPageChrome>
      );

  return <WorkoutLeaveProvider onLeave={onLeave}>{body}</WorkoutLeaveProvider>;
}

export default function WorkoutModule({ onLeave }) {
  const { colors: theme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <AuthProvider>
        <AppProvider>
          <WorkoutRoot onLeave={onLeave} />
        </AppProvider>
      </AuthProvider>
    </View>
  );
}
