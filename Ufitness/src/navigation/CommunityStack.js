import React, { createContext, useContext, useMemo, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { nestedStackProps } from './nav';

const Stack = createNativeStackNavigator();
const MatchRefreshContext = createContext({ refreshKey: 0, bumpMatches: () => {} });

function CommunityFeed({ navigation }) {
  const { communityProfile } = useApp();
  const CommunityModule = require('../features/community/CommunityModule').default;
  return (
    <CommunityModule
      profileFromApp={communityProfile}
      onOpenBuddies={() => navigation.navigate('Connect')}
      onOpenMentors={() => navigation.navigate('MentorList')}
    />
  );
}

function ConnectScreen({ navigation }) {
  const { currentStudent } = useApp();
  const FindBuddiesScreen = require('../features/buddies/screens/FindBuddiesScreen').default;
  return (
    <FindBuddiesScreen
      currentStudent={currentStudent}
      navigation={navigation}
      onOpenMentors={() => navigation.navigate('MentorList')}
    />
  );
}

function RequestsScreen() {
  const { currentStudent } = useApp();
  const { bumpMatches } = useContext(MatchRefreshContext);
  const BuddyRequestsScreen = require('../features/buddies/screens/BuddyRequestsScreen').default;
  return <BuddyRequestsScreen currentStudent={currentStudent} onBuddyMatched={bumpMatches} />;
}

function MyBuddiesScreen() {
  const { currentStudent } = useApp();
  const { refreshKey } = useContext(MatchRefreshContext);
  const MatchedBuddiesScreen = require('../features/buddies/screens/MatchedBuddiesScreen').default;
  return <MatchedBuddiesScreen currentStudent={currentStudent} refreshKey={refreshKey} />;
}

export default function CommunityStack() {
  const { colors } = useTheme();
  const [refreshKey, setRefreshKey] = useState(0);
  const matchRefresh = useMemo(
    () => ({
      refreshKey,
      bumpMatches: () => setRefreshKey((key) => key + 1),
    }),
    [refreshKey]
  );

  return (
    <MatchRefreshContext.Provider value={matchRefresh}>
      <Stack.Navigator {...nestedStackProps(colors)} initialRouteName="Feed">
        <Stack.Screen name="Feed" component={CommunityFeed} />
        <Stack.Screen name="Connect" component={ConnectScreen} options={{ headerShown: true, title: 'Connect & Grow' }} />
        <Stack.Screen name="Requests" component={RequestsScreen} options={{ headerShown: true, title: 'Buddy Requests' }} />
        <Stack.Screen name="MyBuddies" component={MyBuddiesScreen} options={{ headerShown: true, title: 'My Buddies' }} />
        <Stack.Screen
          name="MentorList"
          getComponent={() => require('../features/mentors/screens/MentorListScreen').default}
          options={{ headerShown: true, title: 'Find a Mentor' }}
        />
        <Stack.Screen
          name="Match"
          getComponent={() => require('../features/mentors/screens/MatchScreen').default}
          options={{ headerShown: true, title: 'Mentor Match' }}
        />
      </Stack.Navigator>
    </MatchRefreshContext.Provider>
  );
}
