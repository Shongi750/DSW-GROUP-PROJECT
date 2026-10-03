import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

// Inspo-style week strip: weekday labels + circle dates, orange ring on selected.
export default function WeekStrip({ days, selectedKey, completedKeys, onSelect }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      {days.map((item) => {
        const selected = item.key === selectedKey;
        const completed = completedKeys?.has(item.key);
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.day}
            onPress={() => onSelect?.(item)}
            activeOpacity={0.8}
          >
            <Text style={[styles.weekday, { color: colors.muted }]}>{item.weekday}</Text>
            <View
              style={[
                styles.circle,
                {
                  borderColor: selected ? colors.accent : completed ? 'rgba(255,106,0,0.55)' : 'transparent',
                  backgroundColor: selected ? 'rgba(255,106,0,0.18)' : 'transparent',
                  borderWidth: selected || completed ? 2 : 0,
                },
              ]}
            >
              <Text
                style={[
                  styles.date,
                  { color: selected || completed ? colors.accent : colors.text },
                ]}
              >
                {item.day}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 8,
  },
  day: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  weekday: {
    fontSize: 11,
    fontWeight: '700',
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: {
    fontSize: 15,
    fontWeight: '700',
  },
});
