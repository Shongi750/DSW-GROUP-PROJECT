import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Firebase imports
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './src/config/firebase'; 

// --- App Screens ---
import WorkoutHomeScreen from './src/features/workouts/screens/WorkoutHomeScreen';
import ActiveWorkoutSessionScreen from './src/features/workouts/screens/ActiveWorkoutSessionScreen';
// ✨ HERE IS THE IMPORT FOR THE NEW SCREEN
import CustomWorkoutBuilderScreen from './src/features/workouts/screens/CustomWorkoutBuilderScreen';

import ProgressDashboardScreen from './src/features/progress/screens/ProgressDashboardScreen';
import ProfileEditScreen from './src/features/progress/screens/ProfileEditScreen';
import BuddyScreen from './src/features/buddies/screens/BuddyScreen';

// --- Auth & Onboarding Screens ---
import WelcomeScreen from './src/screens/onboarding/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import FitnessGoalScreen from './src/screens/onboarding/FitnessGoalScreen';
import ExperienceScreen from './src/screens/onboarding/ExperienceScreen';
import WorkoutPreferenceScreen from './src/screens/onboarding/WorkoutPreferenceScreen';
import FoodBudgetScreen from './src/screens/onboarding/FoodBudgetScreen';
import FundingTypeScreen from './src/screens/onboarding/FundingTypeScreen';
import CampusScreen from './src/screens/onboarding/CampusScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const WorkoutStack = createNativeStackNavigator();
const ProgressStack = createNativeStackNavigator();

function WorkoutStackScreen() {
  return (
    <WorkoutStack.Navigator screenOptions={{ headerShown: false }}>
      <WorkoutStack.Screen name="WorkoutHome" component={WorkoutHomeScreen} />
      <WorkoutStack.Screen name="ActiveWorkout" component={ActiveWorkoutSessionScreen} />
      {/* ✨ HERE IS THE ROUTE FOR THE NEW SCREEN */}
      <WorkoutStack.Screen name="CustomWorkoutBuilder" component={CustomWorkoutBuilderScreen} />
    </WorkoutStack.Navigator>
  );
}

function ProgressStackScreen() {
  return (
    <ProgressStack.Navigator screenOptions={{ headerShown: false }}>
      <ProgressStack.Screen name="ProgressDashboard" component={ProgressDashboardScreen} />
      <ProgressStack.Screen name="ProfileEdit" component={ProfileEditScreen} />
    </ProgressStack.Navigator>
  );
}

function MainAppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#FF6F00',
        tabBarInactiveTintColor: 'gray',
        headerTitleAlign: 'center',
      }}
    >
      <Tab.Screen name="Workouts" component={WorkoutStackScreen} options={{ title: 'My Workouts' }} />
      <Tab.Screen name="Progress" component={ProgressStackScreen} options={{ title: 'My Progress' }} />
      <Tab.Screen name="Buddies" component={BuddyScreen} options={{ title: 'Find Buddies' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const [onboardingData, setOnboardingData] = useState({
    fitnessGoal: "", experienceLevel: "", workoutPreference: "",
    foodBudget: "", fundingType: "", campus: "",
  });

  const updateField = (field, value) => {
    setOnboardingData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (authenticatedUser) => {
      if (authenticatedUser) {
        setUser(authenticatedUser);
        
        unsubscribeSnapshot = onSnapshot(doc(db, 'users', authenticatedUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            if (!docSnap.data().campus) {
              setNeedsOnboarding(true);
            } else {
              setNeedsOnboarding(false);
            }
          } else {
            setNeedsOnboarding(true);
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setNeedsOnboarding(false);
        setLoading(false);
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F00" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : needsOnboarding ? (
          <>
            <Stack.Screen name="FitnessGoal">
              {(props) => <FitnessGoalScreen {...props} data={onboardingData} updateField={updateField} />}
            </Stack.Screen>
            <Stack.Screen name="Experience">
              {(props) => <ExperienceScreen {...props} data={onboardingData} updateField={updateField} />}
            </Stack.Screen>
            <Stack.Screen name="WorkoutPreference">
              {(props) => <WorkoutPreferenceScreen {...props} data={onboardingData} updateField={updateField} />}
            </Stack.Screen>
            <Stack.Screen name="FoodBudget">
              {(props) => <FoodBudgetScreen {...props} data={onboardingData} updateField={updateField} />}
            </Stack.Screen>
            <Stack.Screen name="FundingType">
              {(props) => <FundingTypeScreen {...props} data={onboardingData} updateField={updateField} />}
            </Stack.Screen>
            <Stack.Screen name="Campus">
              {(props) => <CampusScreen {...props} data={onboardingData} updateField={updateField} />}
            </Stack.Screen>
            <Stack.Screen name="Profile">
              {(props) => <ProfileScreen {...props} data={onboardingData} updateField={updateField} />}
            </Stack.Screen>
          </>
        ) : (
          <Stack.Screen name="Main" component={MainAppTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }
});