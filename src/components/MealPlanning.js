import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function MealPlanScreen({ navigation, route }) {
  useEffect(() => {
    navigation.replace('MealPlanning', route.params || {});
  }, [navigation, route.params]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}
