import React from 'react';
import { View } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import MainTabs from './MainTabs';
import LiveSessionPill from '../components/LiveSessionPill';
import { queueWorkoutAction } from '../features/workout/lib/pendingStart';
import { openTab } from './nav';

// Main tabs + the floating "live workout" pill.
// Pill only shows when you're NOT already on the Workout tab.
export default function MainStack() {
  const navigation = useNavigation();

  // figure out which bottom tab is selected right now
  const focusedTab = useNavigationState(function (state) {
    if (!state || !state.routes) return null;
    const current = state.routes[state.index];
    if (!current) return null;
    // nested state = the tab navigator inside Main
    if (current.state && current.state.routeNames) {
      return current.state.routeNames[current.state.index];
    }
    return null;
  });

  async function onPillPress() {
    // tell Workout Home to reopen the Player, then switch tabs
    await queueWorkoutAction({ resumePlayer: true });
    openTab(navigation, 'Workout');
  }

  return (
    <View style={{ flex: 1 }}>
      <MainTabs />
      {focusedTab !== 'Workout' ? (
        <LiveSessionPill onPress={onPillPress} />
      ) : null}
    </View>
  );
}
