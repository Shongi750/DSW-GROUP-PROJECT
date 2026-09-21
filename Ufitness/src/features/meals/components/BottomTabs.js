import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';
import { TABS } from '../data/planner';

export default function BottomTabs({ activeId, onChange }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((tab) => {
        const selected = tab.id === activeId;
        return (
          <Pressable key={tab.id} style={styles.item} onPress={() => onChange(tab.id)}>
            <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
              <Ionicons
                name={selected ? tab.iconActive : tab.icon}
                size={selected ? 20 : 22}
                color={selected ? colors.white : colors.muted}
              />
            </View>
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingHorizontal: 6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
  },
  labelSelected: {
    color: colors.primary,
  },
});
