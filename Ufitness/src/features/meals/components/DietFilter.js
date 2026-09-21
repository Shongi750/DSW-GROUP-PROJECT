import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import { useTheme } from '../../../context/ThemeContext';
import { EMPTY_DIET_FILTERS } from '../lib/diet';

const DIET = [
  { id: 'halaal', label: 'Halaal', hint: 'No wors/polony' },
  { id: 'vegetarian', label: 'Veg', hint: 'No meat/fish' },
  { id: 'noDairy', label: 'No dairy', hint: 'Skip milk' },
];

const ALLERGY = [
  { id: 'noPeanuts', label: 'Peanuts', hint: 'Allergy' },
  { id: 'noFish', label: 'Fish', hint: 'Allergy' },
];

function ChipRow({ items, value, onToggle, theme }) {
  return (
    <View style={styles.row}>
      {items.map((item) => {
        const selected = Boolean(value?.[item.id]);
        return (
          <Pressable
            key={item.id}
            onPress={() => onToggle(item.id)}
            style={[
              styles.chip,
              { backgroundColor: theme.overlay, borderColor: theme.border },
              selected && styles.chipOn,
            ]}
          >
            <Text style={[styles.amount, { color: theme.text }, selected && styles.amountOn]}>{item.label}</Text>
            <Text style={[styles.hint, selected && styles.hintOn]}>{item.hint}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function DietFilter({ value = EMPTY_DIET_FILTERS, onChange }) {
  const { colors: theme } = useTheme();
  const toggle = (id) => onChange?.({ ...value, [id]: !value[id] });

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.text }]}>Eat</Text>
      <ChipRow items={DIET} value={value} onToggle={toggle} theme={theme} />
      <Text style={[styles.label, styles.second, { color: theme.text }]}>Allergies</Text>
      <ChipRow items={ALLERGY} value={value} onToggle={toggle} theme={theme} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  second: {
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.prepBg,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  chipOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  amount: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  amountOn: {
    color: colors.white,
  },
  hint: {
    marginTop: 2,
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
  },
  hintOn: {
    color: 'rgba(255,255,255,0.85)',
  },
});
