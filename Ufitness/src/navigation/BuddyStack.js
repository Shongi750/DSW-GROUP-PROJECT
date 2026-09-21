import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FindBuddiesScreen from '../features/buddies/screens/FindBuddiesScreen';
import BuddyRequestsScreen from '../features/buddies/screens/BuddyRequestsScreen';
import MatchedBuddiesScreen from '../features/buddies/screens/MatchedBuddiesScreen';
import { useApp } from '../context/AppContext';

const Stack = createNativeStackNavigator();

export default function BuddyStack({ navigation }) {
  const { currentStudent } = useApp();
  const [matchRefreshKey, setMatchRefreshKey] = useState(0);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Find">
      <Stack.Screen name="Find">
        {({ navigation: findNav }) => (
          <FindBuddiesScreen
            currentStudent={currentStudent}
            navigation={findNav}
            onOpenMentors={() => navigation.getParent()?.navigate('MentorList')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Requests" options={{ headerShown: true, title: 'Buddy Requests' }}>
        {() => (
          <BuddyRequestsScreen
            currentStudent={currentStudent}
            onBuddyMatched={() => setMatchRefreshKey((key) => key + 1)}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="MyBuddies" options={{ headerShown: true, title: 'My Buddies' }}>
        {() => (
          <MatchedBuddiesScreen currentStudent={currentStudent} refreshKey={matchRefreshKey} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
