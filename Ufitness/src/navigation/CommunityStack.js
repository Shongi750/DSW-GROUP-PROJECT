import React, { createContext, useContext, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { nestedStackProps } from './nav';
import { areMatchedBuddies } from '../lib/directChat';

const Stack = createNativeStackNavigator();
const MatchRefreshContext = createContext({ refreshKey: 0, bumpMatches: () => {} });

function openChat(navigation, { peerId, peerName, peerKind }) {
  if (!peerId) return;
  navigation.navigate('Chat', {
    peerId,
    peerName: peerName || 'Student',
    peerKind: peerKind || 'buddy',
  });
}

function CommunityFeed({ navigation }) {
  const { communityProfile, isMentor } = useApp();
  const CommunityModule = require('../features/community/CommunityModule').default;
  return (
    <CommunityModule
      profileFromApp={communityProfile}
      onOpenBuddies={() => navigation.navigate('Connect')}
      onOpenMentors={() => navigation.navigate('MentorList')}
      onOpenMentorHub={isMentor ? () => navigation.navigate('MentorHub') : undefined}
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
      onMessage={async (student) => {
        const matched = await areMatchedBuddies(student.id);
        if (!matched) {
          Alert.alert(
            'Connect first',
            'Send a buddy request and wait until they accept — then you can chat.'
          );
          return;
        }
        openChat(navigation, {
          peerId: student.id,
          peerName: student.name,
          peerKind: 'buddy',
        });
      }}
    />
  );
}

function RequestsScreen() {
  const { currentStudent } = useApp();
  const { bumpMatches } = useContext(MatchRefreshContext);
  const BuddyRequestsScreen = require('../features/buddies/screens/BuddyRequestsScreen').default;
  return <BuddyRequestsScreen currentStudent={currentStudent} onBuddyMatched={bumpMatches} />;
}

function MyBuddiesScreen({ navigation }) {
  const { currentStudent } = useApp();
  const { refreshKey } = useContext(MatchRefreshContext);
  const MatchedBuddiesScreen = require('../features/buddies/screens/MatchedBuddiesScreen').default;
  return (
    <MatchedBuddiesScreen
      currentStudent={currentStudent}
      refreshKey={refreshKey}
      onMessage={(student) =>
        openChat(navigation, {
          peerId: student.id,
          peerName: student.name,
          peerKind: 'buddy',
        })
      }
    />
  );
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
        <Stack.Screen
          name="MentorHub"
          getComponent={() => require('../features/mentors/screens/MentorHubScreen').default}
          options={{ headerShown: true, title: 'Mentor Hub' }}
        />
        <Stack.Screen
          name="MentorInbox"
          getComponent={() => require('../features/mentors/screens/MentorInboxScreen').default}
          options={{ headerShown: true, title: 'Mentor Requests' }}
        />
        <Stack.Screen
          name="MentorMentees"
          getComponent={() => require('../features/mentors/screens/MentorMenteesScreen').default}
          options={{ headerShown: true, title: 'My Mentees' }}
        />
        <Stack.Screen
          name="MenteeProgress"
          getComponent={() => require('../features/mentors/screens/MenteeProgressScreen').default}
          options={{ headerShown: true, title: 'Mentee Progress' }}
        />
        <Stack.Screen
          name="MentorGuidance"
          getComponent={() => require('../features/mentors/screens/MentorGuidanceScreen').default}
          options={{ headerShown: true, title: 'Guidance' }}
        />
        <Stack.Screen
          name="Chat"
          getComponent={() => require('../screens/chat/ChatScreen').default}
          options={{ headerShown: true, title: 'Chat' }}
        />
      </Stack.Navigator>
    </MatchRefreshContext.Provider>
  );
}
