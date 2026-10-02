import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ✨ Import Supabase
import { supabase } from './src/config/supabase';

// Ignore specific warnings in development
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

// --- App Screens ---
import WorkoutHomeScreen from './src/features/workouts/screens/WorkoutHomeScreen';
import ActiveWorkoutSessionScreen from './src/features/workouts/screens/ActiveWorkoutSessionScreen';
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
    let profileSubscription = null;

    const handleUserSession = async (sessionUser) => {
      if (sessionUser) {
        setUser(sessionUser);

        // 1. Initial fetch to check if campus is filled out
        const { data, error } = await supabase
          .from('profiles')
          .select('campus')
          .eq('id', sessionUser.id)
          .single();

        setNeedsOnboarding(!data?.campus);
        setLoading(false);

        // 2. Set up unique Supabase Realtime channel to prevent collision errors
        if (profileSubscription) {
          supabase.removeChannel(profileSubscription);
        }
        
        profileSubscription = supabase
          .channel(`profile_updates_${sessionUser.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${sessionUser.id}` },
            (payload) => {
              if (payload.new && payload.new.campus) {
                setNeedsOnboarding(false);
              }
            }
          )
          .subscribe();

      } else {
        // User is logged out
        setUser(null);
        setNeedsOnboarding(false);
        setLoading(false);
        if (profileSubscription) {
          supabase.removeChannel(profileSubscription);
          profileSubscription = null;
        }
      }
    };

    // Check for active session when app boots
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserSession(session?.user ?? null);
    });

    // Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUserSession(session?.user ?? null);
    });

    // Cleanup listeners when app closes
    return () => {
      subscription.unsubscribe();
      if (profileSubscription) supabase.removeChannel(profileSubscription);
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