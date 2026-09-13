import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';

export default function BudgetScreen({ navigation }) {
  const { theme } = useAppTheme();
  const [budget, setBudget] = useState('450');

  return (
    <View style={[s.page, { backgroundColor: theme.background }]}>
      <Text style={[s.title, { color: theme.text }]}>Meal budget</Text>
      <Text style={[s.copy, { color: theme.muted }]}>
        Set a weekly amount, then continue to the unified meal planner.
      </Text>
      <TextInput
        accessibilityLabel="Weekly food budget"
        value={budget}
        onChangeText={setBudget}
        keyboardType="numeric"
        style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
      />
      <TouchableOpacity
        style={[s.button, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('MealPlanning', { budget: Number(budget) || 450 })}
      >
        <Text style={s.buttonText}>Open meal planner</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 25, fontWeight: '800' },
  copy: { fontSize: 13, lineHeight: 19, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 13, fontSize: 16, marginTop: 20 },
  button: { borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '800' },
});
