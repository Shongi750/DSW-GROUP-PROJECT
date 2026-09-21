import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

export default function DaySelector({ days, selectedId, onSelect }) {
  return (
    <View style={styles.row}>
      {days.map((day) => {
        const selected = day.id === selectedId;
        return (
          <Pressable
            key={day.id}
            onPress={() => onSelect(day.id)}
            style={[styles.pill, selected && styles.pillSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{day.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 16,
  },
  pill: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  pillSelected: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  labelSelected: {
    color: colors.white,
    fontWeight: '700',
  },
});
