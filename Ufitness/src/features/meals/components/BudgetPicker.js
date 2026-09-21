import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import { useTheme } from '../../../context/ThemeContext';
import { weekPlanOptions } from '../lib/budget';

export default function BudgetPicker({ value, onChange, items }) {
  const { colors: theme } = useTheme();
  const budgets = items?.length ? items : weekPlanOptions(1500);
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.text }]}>Weekly grocery budget</Text>
      <View style={styles.row}>
        {budgets.map((item) => {
          const selected = item.id === value;
          return (
            <Pressable
              key={item.id}
              onPress={() => onChange(item.id)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
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
