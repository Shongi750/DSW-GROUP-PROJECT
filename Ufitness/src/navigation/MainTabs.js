import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DashboardScreen from '../screens/home/DashboardScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import FitnessGoalScreen from '../screens/onboarding/FitnessGoalScreen';
import DietPreferencesScreen from '../screens/profile/DietPreferencesScreen';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { nestedStackProps, openNested, openTab } from './nav';
import { DEFAULT_AVATAR } from '../data/profileAvatars';
import { hapticSelection } from '../lib/haptics';
import { trackFeature } from '../lib/usagePing';

function BlurTabBarBackground() {
  if (Platform.OS === 'web') {
    return <View style={[StyleSheet.absoluteFill, styles.tabBarFallback]} />;
  }
  return (
    <BlurView intensity={64} tint="dark" style={StyleSheet.absoluteFill}>
      <View style={styles.tabBarScrim} />
    </BlurView>
  );
}

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
      onNotifications={() => navigation.navigate('Notifications')}
      onPrivacySecurity={() => navigation.navigate('PrivacySecurity')}
      onDownloads={() => navigation.navigate('Downloads')}
      onLogout={logout}
      onDeleteAccount={deleteAccount}
      onOpenAdmin={canSeeCampusAdmin ? () => navigation.navigate('AdminHome') : undefined}
      onOpenMentorHub={() => openNested(navigation, ['Community', 'MentorHub'])}
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
        name="PrivacySecurity"
        getComponent={() => require('../screens/profile/PrivacySecurityScreen').default}
        options={{ headerShown: true, title: 'Privacy & security' }}
      />
      <ProfileStackNav.Screen
        name="Notifications"
        getComponent={() => require('../screens/profile/NotificationsScreen').default}
        options={{ headerShown: true, title: 'Notifications' }}
      />
      <ProfileStackNav.Screen
        name="Downloads"
        getComponent={() => require('../screens/profile/DownloadsScreen').default}
        options={{ headerShown: true, title: 'Downloads' }}
      />
      <ProfileStackNav.Screen
        name="AiCoach"
        getComponent={() => require('../features/coach/screens/AiCoachScreen').default}
        options={{ headerShown: true, title: 'AI Coach' }}
      />
      <ProfileStackNav.Screen
        name="BlockedUsers"
        getComponent={() => require('../screens/profile/BlockedUsersScreen').default}
        options={{ headerShown: true, title: 'Blocked users' }}
      />
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

function MealsTab({ navigation, route }) {
  const MealPlannerScreen = require('../features/meals/screens/MealPlannerScreen').default;
  // openDownload: set by Profile → Downloads to open a downloaded plan / recipe / list here.
  return (
    <MealPlannerScreen
      onOpenProfile={() => openTab(navigation, 'Profile')}
      openDownload={route?.params?.openDownload}
      openAt={route?.params?.at}
    />
  );
}

function WorkoutTab({ navigation }) {
  const WorkoutModule = require('../features/workout/WorkoutModule').default;
  return <WorkoutModule onLeave={() => openTab(navigation, 'Home')} />;
}

function CommunityTab() {
  const CommunityStack = require('./CommunityStack').default;
  return <CommunityStack />;
}

function RaisedWorkoutButton({ onPress, accessibilityState, testID, style }) {
  const { isDark } = useTheme();
  const focused = accessibilityState?.selected;
  return (
    <Pressable
      onPress={(e) => {
        hapticSelection();
        onPress?.(e);
      }}
      testID={testID}
      style={[styles.raisedWrap, style]}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
    >
      <View
        style={[
          styles.raisedButton,
          { borderColor: isDark ? '#0A0A0A' : '#FFFFFF' },
          focused && styles.raisedButtonFocused,
        ]}
      >
        <Ionicons name="barbell" size={26} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

// Tab bar row height without the phone's system area. The real bar is this + the bottom
// safe-area inset (Android nav buttons / gesture bar, iPhone home indicator).
const TAB_BAR_CONTENT_HEIGHT = 66;

export default function MainTabs() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // Keep a little breathing room on phones with no bottom inset at all.
  const bottomInset = Math.max(insets.bottom, 8);
  return (
    <Tab.Navigator
      // Count which tabs are used (one row per tab per day) for the admin dashboard
      screenListeners={({ route }) => ({
        focus: () => {
          trackFeature(route.name);
        },
      })}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabInactive,
        lazy: true,
        freezeOnBlur: false,
        detachInactiveScreens: false,
        sceneStyle: { flex: 1, minHeight: 0, backgroundColor: 'transparent' },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.4,
          marginTop: 2,
        },
        // Android: hide the bar while typing so the keyboard + input aren't squashed.
        tabBarHideOnKeyboard: Platform.OS === 'android',
        tabBarStyle: {
          height: TAB_BAR_CONTENT_HEIGHT + bottomInset,
          paddingBottom: bottomInset + 4,
          paddingTop: 8,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: 'rgba(255,255,255,0.14)',
          backgroundColor: 'transparent',
          position: 'absolute',
          overflow: 'visible',
        },
        tabBarBackground: () => <BlurTabBarBackground />,
        tabBarActiveBackgroundColor: 'transparent',
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
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        listeners={{ tabPress: () => hapticSelection() }}
      />
      <Tab.Screen
        name="Meals"
        component={MealsTab}
        listeners={{ tabPress: () => hapticSelection() }}
      />
      <Tab.Screen
        name="Workout"
        component={WorkoutTab}
        options={{
          tabBarLabel: () => null,
          tabBarButton: (props) => <RaisedWorkoutButton {...props} />,
          tabBarStyle: { display: 'none', height: 0, overflow: 'hidden' },
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityTab}
        listeners={{ tabPress: () => hapticSelection() }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileTab}
        options={{ freezeOnBlur: false }}
        listeners={{ tabPress: () => hapticSelection() }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarFallback: {
    backgroundColor: 'rgba(14,10,8,0.88)',
  },
  tabBarScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.35)',
  },
  raisedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    top: -22,
  },
  raisedButton: {
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: '#FF6A00',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6A00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
    borderWidth: 3,
  },
  raisedButtonFocused: {
    backgroundColor: '#FF8A1A',
  },
});
