import React from 'react';
import { View } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import MainTabs from './MainTabs';
import LiveSessionPill from '../components/LiveSessionPill';

export default function MainStack() {
  const navigation = useNavigation();
  const focusedTab = useNavigationState((state) => {
    const current = state.routes[state.index];
    const nested = current?.state;
    return nested ? nested.routeNames[nested.index] : null;
  });

  return (
    <View style={{ flex: 1 }}>
      <MainTabs />
      {focusedTab !== 'Workout' ? (
        <LiveSessionPill
          onPress={() => navigation.navigate('Main', { screen: 'Workout' })}
        />
      ) : null}
    </View>
  );
}
