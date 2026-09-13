import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useState } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";

// Screens — we'll build these next
import WelcomeScreen from "../screens/onboarding/WelcomeScreen";
import FitnessGoalScreen from "../screens/onboarding/FitnessGoalScreen";
import ExperienceScreen from "../screens/onboarding/ExperienceScreen";
import WorkoutPreferenceScreen from "../screens/onboarding/WorkoutPreferenceScreen";
import FoodBudgetScreen from "../screens/onboarding/FoodBudgetScreen";
import FundingTypeScreen from "../screens/onboarding/FundingTypeScreen";
import CampusScreen from "../screens/onboarding/CampusScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [onboardingData, setOnboardingData] = useState({
    userId: "",
    name: "",
    email: "",
    fitnessGoal: "",
    experienceLevel: "",
    workoutPreference: "",
    foodBudget: "",
    fundingType: "",
    campus: "",
  });

  const updateField = (field, value) => {
    setOnboardingData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        <Stack.Screen name="FitnessGoal">
          {(props) => (
            <FitnessGoalScreen
              {...props}
              data={onboardingData}
              updateField={updateField}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Experience">
          {(props) => (
            <ExperienceScreen
              {...props}
              data={onboardingData}
              updateField={updateField}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="WorkoutPreference">
          {(props) => (
            <WorkoutPreferenceScreen
              {...props}
              data={onboardingData}
              updateField={updateField}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="FoodBudget">
          {(props) => (
            <FoodBudgetScreen
              {...props}
              data={onboardingData}
              updateField={updateField}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="FundingType">
          {(props) => (
            <FundingTypeScreen
              {...props}
              data={onboardingData}
              updateField={updateField}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Campus">
          {(props) => (
            <CampusScreen
              {...props}
              data={onboardingData}
              updateField={updateField}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Profile">
          {(props) => (
            <ProfileScreen
              {...props}
              data={onboardingData}
              updateField={updateField}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
});
