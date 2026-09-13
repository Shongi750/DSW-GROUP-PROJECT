import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { featuredMeal } from '../data/catalog';

export default function MealDetailScreen({ navigation, route }) {
  const { theme } = useAppTheme();
  const meal = route?.params?.meal || featuredMeal;
  const ingredients = meal.ingredients || [
    'Chicken breast',
    'Rice',
    'Mixed vegetables',
    'Olive oil & spices',
  ];

  return (
    <View style={[s.page, { backgroundColor: theme.background }]}>
      <ScrollView>
        <Image
          source={{
            uri:
              meal.image ||
              'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=80',
          }}
          style={s.image}
        />
        <View style={s.content}>
          <Text style={[s.eyebrow, { color: theme.teal }]}>POST-WORKOUT</Text>
          <Text style={[s.title, { color: theme.text }]}>{meal.name}</Text>
          <Text style={[s.copy, { color: theme.muted }]}>
            A balanced, student-friendly bowl designed for recovery and steady energy.
          </Text>
          <View style={[s.stats, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Stat label="CALORIES" value={`${meal.calories || 520} kcal`} t={theme} />
            <Stat label="PROTEIN" value={`${meal.protein || 42} g`} t={theme} />
            <Stat label="EST. COST" value={`R ${meal.cost || 55}`} t={theme} />
          </View>
          <Text style={[s.heading, { color: theme.text }]}>Ingredients</Text>
          {ingredients.map((item) => (
            <View key={item} style={[s.ingredient, { borderColor: theme.border }]}>
              <Text style={[s.tick, { color: theme.teal }]}>✓</Text>
              <Text style={[s.ingredientText, { color: theme.text }]}>{item}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={[s.button, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('MealPlanning')}
          >
            <Text style={s.buttonText}>View meal plan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, t }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statLabel, { color: t.muted }]}>{label}</Text>
      <Text style={[s.statValue, { color: t.text }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1 },
  image: { height: 270, width: '100%' },
  content: { padding: 20, paddingBottom: 38 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { fontSize: 25, fontWeight: '800', marginTop: 6 },
  copy: { fontSize: 13, lineHeight: 20, marginTop: 8 },
  stats: { borderWidth: 1, borderRadius: 14, flexDirection: 'row', marginTop: 20, paddingVertical: 14 },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 9, fontWeight: '800' },
  statValue: { fontSize: 13, fontWeight: '800', marginTop: 5 },
  heading: { fontSize: 18, fontWeight: '800', marginTop: 22 },
  ingredient: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1 },
  tick: { fontWeight: '800', marginRight: 10 },
  ingredientText: { fontSize: 13 },
  button: { alignItems: 'center', padding: 16, borderRadius: 12, marginTop: 24 },
  buttonText: { color: '#fff', fontWeight: '800' },
});
