// components/ChipSelector.js
//
// Simple row of tappable chips for choosing one (or several) values from a
// small fixed list - used on the Sign Up screen for fields like campus,
// fitness goal, experience level, and training days, without needing a
// picker library.

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

// Props:
// options: string[]
// value: string | string[] (string[] when multiple=true)
// onChange: (newValue) => void
// multiple?: boolean - allow toggling more than one chip on
export default function ChipSelector({ options, value, onChange, multiple = false }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
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

function createStyles(colors, isDark) {
  return StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 999,
      backgroundColor: isDark ? colors.overlay : '#F0F0F0',
      borderWidth: 1,
      borderColor: isDark ? colors.border : 'transparent',
    },
    chipSelected: { backgroundColor: colors.brand, borderColor: colors.brand },
    chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
    chipTextSelected: { color: '#FFFFFF' },
  });
}
