import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import DietFilter from '../../features/meals/components/DietFilter';
import { mergeDietFilters } from '../../features/meals/lib/diet';
import { loadSavedPlan, saveSavedPlan } from '../../features/meals/lib/persist';

const display = { fontFamily: 'Anton_400Regular', letterSpacing: 0.8 };

export default function DietPreferencesScreen({ navigation }) {
  const { colors } = useTheme();
  const { profile, updateFields } = useApp();
  const value = mergeDietFilters(profile?.dietFilters);

  const onChange = async (next) => {
    const dietFilters = mergeDietFilters(next);
    updateFields?.({ dietFilters });
    const saved = await loadSavedPlan();
    await saveSavedPlan({ ...(saved || {}), dietFilters });
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => navigation.canGoBack() && navigation.goBack()}
          hitSlop={10}
          style={styles.iconBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Eat & Allergies</Text>
        <View style={styles.iconBtn} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Tap common filters, or type any other allergy. The Meals week skips matching ingredients.
        </Text>
        <DietFilter value={value} onChange={onChange} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...display, flex: 1, textAlign: 'center', fontSize: 18, textTransform: 'uppercase' },
  content: { padding: 16, paddingBottom: 40 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
});
