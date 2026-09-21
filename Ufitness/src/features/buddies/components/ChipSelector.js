// components/ChipSelector.js
//
// Simple row of tappable chips for choosing one (or several) values from a
// small fixed list - used on the Sign Up screen for fields like campus,
// fitness goal, experience level, and training days, without needing a
// picker library.

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

// Props:
// options: string[]
// value: string | string[] (string[] when multiple=true)
// onChange: (newValue) => void
// multiple?: boolean - allow toggling more than one chip on
export default function ChipSelector({ options, value, onChange, multiple = false }) {
  const isSelected = (option) => (multiple ? value.includes(option) : value === option);

  const handlePress = (option) => {
    if (multiple) {
      const next = value.includes(option) ? value.filter((v) => v !== option) : [...value, option];
      onChange(next);
    } else {
      onChange(option);
    }
  };

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = isSelected(option);
        return (
          <Pressable
            key={option}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => handlePress(option)}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  chipSelected: { backgroundColor: '#FF6B35' },
  chipText: { color: '#333', fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: '#fff' },
});
