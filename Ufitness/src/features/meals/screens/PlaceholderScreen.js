import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import { colors } from '../constants/theme';
import { TABS } from '../data/planner';

export default function PlaceholderScreen({ tabId, onOpenProfile }) {
  const insets = useSafeAreaInsets();
  const tab = TABS.find((item) => item.id === tabId);

  return (
    <View style={styles.screen}>
      <View style={{ paddingTop: insets.top + 6 }}>
        <AppHeader onAvatarPress={onOpenProfile} />
      </View>
      <View style={styles.body}>
        <View style={styles.icon}>
          <Ionicons name={tab?.iconActive || 'ellipse'} size={28} color={colors.primary} />
        </View>
        <Text style={styles.title}>{tab?.label}</Text>
        <Text style={styles.copy}>This tab is coming next. Meal Planner is ready to use.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  copy: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    textAlign: 'center',
  },
});
