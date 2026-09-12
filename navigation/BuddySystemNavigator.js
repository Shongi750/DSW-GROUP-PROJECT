// navigation/BuddySystemNavigator.js
//
// Wraps the Workout Buddy System screens plus a Profile/logout tab in a
// bottom tab navigator. Rendered by RootNavigator once the user is signed in.
//
// Requires: @react-navigation/native, @react-navigation/bottom-tabs,
// react-native-vector-icons (or any icon set you prefer)

import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import FindBuddiesScreen from '../screens/FindBuddiesScreen';
import BuddyRequestsScreen from '../screens/BuddyRequestsScreen';
import MatchedBuddiesScreen from '../screens/MatchedBuddiesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

// Props: currentStudent (student profile object)
export default function BuddySystemNavigator({ currentStudent }) {
  const [matchRefreshKey, setMatchRefreshKey] = useState(0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const iconMap = {
            Find: 'search-outline',
            Requests: 'mail-unread-outline',
            'My Buddies': 'people-outline',
            Profile: 'person-circle-outline',
          };
          return <Icon name={iconMap[route.name] || 'ellipse-outline'} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B35',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Find">{() => <FindBuddiesScreen currentStudent={currentStudent} />}</Tab.Screen>
      <Tab.Screen name="Requests">
        {() => (
          <BuddyRequestsScreen
            currentStudent={currentStudent}
            onBuddyMatched={() => setMatchRefreshKey((k) => k + 1)}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="My Buddies">
        {() => <MatchedBuddiesScreen currentStudent={currentStudent} refreshKey={matchRefreshKey} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">{() => <ProfileScreen currentStudent={currentStudent} />}</Tab.Screen>
    </Tab.Navigator>
  );
}
