import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

const tabs = [
  ['Meals', 'MealPlanning', '♨'],
  ['Buddies', 'BuddySystem', '♣'],
  ['List', 'ShoppingList', '☰'],
  ['Budget', 'Budget', 'R'],
  ['Profile', 'Profile', '♙'],
];

export default function BottomNav({ navigation, active }) {
  const { theme } = useAppTheme();

  return (
    <View style={[s.nav, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {tabs.map(([label, route, icon]) => {
        const selected = active === label || (active === 'Meals' && route === 'MealPlanning');
        return (
          <TouchableOpacity
            key={route}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`Open ${label}`}
            style={s.item}
            onPress={() => navigation.navigate(route)}
          >
            <Text style={[s.icon, { color: selected ? theme.primary : theme.muted }]}>{icon}</Text>
            <Text style={[s.label, { color: selected ? theme.primary : theme.muted }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingBottom: 16,
  },
  item: { flex: 1, alignItems: 'center' },
  icon: { fontSize: 16 },
  label: { fontSize: 11, fontWeight: '700', marginTop: 4 },
});
