import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DashboardScreen from '../screens/home/DashboardScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import FitnessGoalScreen from '../screens/onboarding/FitnessGoalScreen';
import DietPreferencesScreen from '../screens/profile/DietPreferencesScreen';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { showNotificationsSheet, showPrivacySheet } from '../lib/reminders';
import { nestedStackProps, openTab, resetTabListener } from './nav';
import { DEFAULT_AVATAR } from '../data/profileAvatars';

const Tab = createBottomTabNavigator();
const ProfileStackNav = createNativeStackNavigator();

function ProfileHome({ navigation }) {
  const { profile, currentStudent, logout, deleteAccount, canSeeCampusAdmin } = useApp();
  const student = {
    ...currentStudent,
    name: profile.name || currentStudent.name,
    campus: profile.campus || currentStudent.campus,
    fitnessGoal: profile.fitnessGoal || currentStudent.fitnessGoal,
    experienceLevel: profile.experienceLevel,
    course: profile.course || '',
    yearOfStudy: profile.yearOfStudy || '',
    weeklyTarget: profile.daysPerWeek || 4,
    foodBudgetRemaining: profile.foodBudgetRemaining ?? 340,
    avatarUrl: profile.avatarUrl || DEFAULT_AVATAR,
  };

  const openSetup = () => {
    navigation.navigate('StudentSetup');
  };

  return (
    <ProfileScreen
      currentStudent={student}
      onEditProfile={openSetup}
      onCampusSelection={openSetup}
      onCourseSelection={openSetup}
      onFitnessGoals={openSetup}
      onEatAllergies={() => navigation.navigate('DietPreferences')}
      onNotifications={showNotificationsSheet}
      onPrivacySecurity={showPrivacySheet}
      onLogout={logout}
      onDeleteAccount={deleteAccount}
      onOpenAdmin={canSeeCampusAdmin ? () => navigation.navigate('AdminHome') : undefined}
    />
  );
}

function StudentSetup({ navigation }) {
  const { profile, updateFields, completeOnboarding } = useApp();
  return (
    <FitnessGoalScreen
      navigation={navigation}
      data={profile}
      updateFields={updateFields}
      completeOnboarding={completeOnboarding}
      editing
    />
  );
}

function ProfileTab() {
  const { colors } = useTheme();
  return (
    <ProfileStackNav.Navigator {...nestedStackProps(colors)} initialRouteName="ProfileHome">
      <ProfileStackNav.Screen name="ProfileHome" component={ProfileHome} />
      <ProfileStackNav.Screen name="StudentSetup" component={StudentSetup} />
      <ProfileStackNav.Screen name="DietPreferences" component={DietPreferencesScreen} />
      <ProfileStackNav.Screen
        name="AdminHome"
        getComponent={() => require('../features/admin/screens/AdminDashboardScreen').default}
        options={{ headerShown: true, title: 'Campus Admin' }}
      />
      <ProfileStackNav.Screen
        name="MentorPipeline"
        getComponent={() => require('../features/admin/screens/MentorPipelineScreen').default}
        options={{ headerShown: true, title: 'Mentor pipeline' }}
      />
    </ProfileStackNav.Navigator>
  );
}

function MealsTab({ navigation }) {
  const MealPlannerScreen = require('../features/meals/screens/MealPlannerScreen').default;
  return <MealPlannerScreen onOpenProfile={() => openTab(navigation, 'Profile')} />;
}

function WorkoutTab({ navigation }) {
  const WorkoutModule = require('../features/workout/WorkoutModule').default;
  return <WorkoutModule onLeave={() => openTab(navigation, 'Home')} />;
}

function CommunityTab() {
  const CommunityStack = require('./CommunityStack').default;
  return <CommunityStack />;
}

export default function MainTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabInactive,
        lazy: true,
        freezeOnBlur: false,
        sceneStyle: { flex: 1, minHeight: 0 },
        tabBarStyle: {
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopColor: colors.border,
          backgroundColor: colors.tabBar,
        },
        tabBarIcon: ({ color, focused, size }) => {
          if (route.name === 'Meals') {
            return (
              <MaterialCommunityIcons name="silverware-fork-knife" size={size} color={color} />
            );
          }
          const icons = {
            Home: focused ? 'home' : 'home-outline',
            Workout: focused ? 'barbell' : 'barbell-outline',
            Community: focused ? 'people' : 'people-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Meals" component={MealsTab} />
      <Tab.Screen
        name="Workout"
        component={WorkoutTab}
        options={{ tabBarStyle: { display: 'none', height: 0, overflow: 'hidden' } }}
      />
      <Tab.Screen name="Community" component={CommunityTab} listeners={resetTabListener('Community')} />
      <Tab.Screen
        name="Profile"
        component={ProfileTab}
        listeners={resetTabListener('Profile')}
        options={{ freezeOnBlur: false }}
      />
    </Tab.Navigator>
  );
}
