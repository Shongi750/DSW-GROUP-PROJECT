import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { useTheme } from '../../../context/ThemeContext';
import {
  EMPTY_DIET_FILTERS,
  addCustomAllergy,
  mergeDietFilters,
  removeCustomAllergy,
} from '../lib/diet';

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
            <Text style={[styles.amount, { color: theme.text }, selected && styles.amountOn]}>
              {item.label}
            </Text>
            <Text style={[styles.hint, selected && styles.hintOn]}>{item.hint}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function DietFilter({ value = EMPTY_DIET_FILTERS, onChange }) {
  const { colors: theme } = useTheme();
  const filters = mergeDietFilters(value);
  const [draft, setDraft] = useState('');
  const toggle = (id) => onChange?.({ ...filters, [id]: !filters[id] });

  const addAllergy = () => {
    const next = addCustomAllergy(filters, draft);
    if (next.customAllergies.length === filters.customAllergies.length) return;
    setDraft('');
    onChange?.(next);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.text }]}>Eat</Text>
      <ChipRow items={DIET} value={filters} onToggle={toggle} theme={theme} />

      <Text style={[styles.label, styles.second, { color: theme.text }]}>Common allergies</Text>
      <ChipRow items={ALLERGY} value={filters} onToggle={toggle} theme={theme} />

      <Text style={[styles.label, styles.second, { color: theme.text }]}>Other allergies</Text>
      <Text style={[styles.help, { color: theme.muted }]}>
        Type anything else you avoid — eggs, gluten, soy, shellfish, sesame…
      </Text>

      <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.overlay }]}>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          value={draft}
          onChangeText={setDraft}
          placeholder="e.g. eggs, gluten"
          placeholderTextColor={theme.muted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={addAllergy}
        />
        <Pressable
          onPress={addAllergy}
          style={[styles.addBtn, { backgroundColor: theme.brand || colors.primary }]}
          hitSlop={6}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {filters.customAllergies.length ? (
        <View style={styles.customWrap}>
          {filters.customAllergies.map((item) => (
            <Pressable
              key={item}
              onPress={() => onChange?.(removeCustomAllergy(filters, item))}
              style={[styles.customChip, { borderColor: theme.brand || colors.primary }]}
            >
              <Text style={[styles.customText, { color: theme.text }]}>{item}</Text>
              <Ionicons name="close" size={14} color={theme.muted} />
            </Pressable>
          ))}
        </View>
      ) : null}
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
  help: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 4,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  customChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  customText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
