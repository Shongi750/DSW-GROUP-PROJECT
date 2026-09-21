import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GoalPicker from './GoalPicker';
import { colors, radius } from '../constants/theme';
import { PANTRY_ORDER, STAPLE_FOODS } from '../data/foodClasses';
import { formatAmount } from '../data/goals';
import { buildCustomMeal, plateCoach, scorePlate } from '../lib/customPlate';
import { stapleLabel } from '../lib/portions';

export default function CustomDish({
  visible,
  context,
  products,
  goal,
  onChangeGoal,
  onSave,
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const slot = context?.slot || 'DINNER';
  const [name, setName] = useState('');
  const [picks, setPicks] = useState(context?.picks || []);

  useEffect(() => {
    if (!visible) return;
    setName(context?.title && context.custom ? context.title : '');
    setPicks(context?.picks || []);
  }, [visible, context?.id]);

  const score = useMemo(() => scorePlate(picks, slot, goal), [picks, slot, goal]);
  const coach = plateCoach(slot, goal, score);

  function addStaple(staple) {
    setPicks((current) => {
      if (current.some((item) => item.staple === staple)) return current;
      const food = STAPLE_FOODS[staple];
      return [...current, { staple, amount: food.step < 1 ? 1 : food.step }];
    });
  }

  function bump(staple, delta) {
    setPicks((current) =>
      current
        .map((item) => {
          if (item.staple !== staple) return item;
          const food = STAPLE_FOODS[staple];
          const amount = Math.round((item.amount + delta) * 4) / 4;
          return { ...item, amount };
        })
        .filter((item) => item.amount > 0)
    );
  }

  function save() {
    if (!context || !score.complete) return;
    onSave(
      buildCustomMeal({
        dayId: context.dayId,
        slot,
        goalId: goal,
        name,
        picks,
        products,
        score,
      })
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
            <Text style={styles.backText}>Meals</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 28 }]}
        >
          <Text style={styles.slot}>{slot}</Text>
          <Text style={styles.title}>Cook your own</Text>
          <Text style={styles.meta}>
            {context?.title && !context.custom ? `Instead of ${context.title}` : 'Build a plate that still hits your food classes.'}
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Dish name (optional)"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <GoalPicker value={goal} onChange={onChangeGoal} />

          <View style={styles.coach}>
            <Text style={styles.coachTitle}>{score.complete ? 'Plate complete' : 'Food classes to hit'}</Text>
            <Text style={styles.coachBody}>{coach}</Text>
            <Text style={styles.cupNote}>A small cup is a 125 ml tea cup. Macros update as you add food.</Text>
          </View>

          {score.classes
            .filter((item) => item.required || item.needed > 0)
            .map((item) => (
            <View key={item.id} style={styles.classRow}>
              <Ionicons
                name={item.filled ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={item.filled ? colors.proteinText : item.optional ? colors.faint : colors.primary}
              />
              <View style={styles.classCopy}>
                <Text style={styles.classTitle}>
                  {item.label}
                  {item.optional ? ' · optional' : ''}
                </Text>
                <Text style={styles.classHint}>
                  {item.id === 'veg'
                    ? `${item.value} / ${item.needed} small cups`
                    : `${item.value} / ${item.needed} ${item.unit}`}
                </Text>
                {item.suggest ? (
                  <Text style={styles.classNeed}>
                    Still short — {item.id === 'starch' ? 'pour' : 'add'} {item.suggest.display} of {item.suggest.label}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}

          <Text style={styles.heading}>Your dish</Text>
          {picks.length === 0 ? (
            <Text style={styles.empty}>Add staples from the pantry. The classes above tick when the amounts are enough.</Text>
          ) : (
            picks.map((pick) => {
              const food = STAPLE_FOODS[pick.staple];
              return (
                <View key={pick.staple} style={styles.pick}>
                  <View style={styles.pickCopy}>
                    <Text style={styles.pickTitle}>
                      {formatAmount(pick.amount, food.unit)} {food.label}
                    </Text>
                    <Text style={styles.pickSub}>
                      {stapleLabel(pick.staple, products)} · {food.classIds.join(' + ')}
                    </Text>
                  </View>
                  <View style={styles.stepper}>
                    <Pressable onPress={() => bump(pick.staple, -food.step)} style={styles.stepBtn}>
                      <Text style={styles.stepText}>−</Text>
                    </Pressable>
                    <Pressable onPress={() => bump(pick.staple, food.step)} style={styles.stepBtn}>
                      <Text style={styles.stepText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}

          <Text style={styles.heading}>Add from pantry</Text>
          <View style={styles.chips}>
            {PANTRY_ORDER.map((staple) => {
              const on = picks.some((item) => item.staple === staple);
              return (
                <Pressable
                  key={staple}
                  onPress={() => addStaple(staple)}
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{STAPLE_FOODS[staple].label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={save}
            disabled={!score.complete}
            style={[styles.save, !score.complete && styles.saveOff]}
          >
            <Text style={styles.saveText}>
              {score.complete ? 'Use this dish' : 'Hit every required class to save'}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minHeight: 0,
    backgroundColor: colors.white,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  topBar: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    paddingHorizontal: 20,
  },
  slot: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.muted,
  },
  title: {
    marginTop: 4,
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  meta: {
    marginTop: 4,
    fontSize: 13,
    color: colors.muted,
  },
  input: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.prepBg,
  },
  coach: {
    marginTop: 16,
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    padding: 14,
  },
  coachTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  coachBody: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  cupNote: {
    marginTop: 8,
    fontSize: 12,
    color: colors.primaryDark,
  },
  classRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    alignItems: 'flex-start',
  },
  classCopy: {
    flex: 1,
  },
  classTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  classHint: {
    marginTop: 2,
    fontSize: 12,
    color: colors.muted,
  },
  classNeed: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  heading: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  pick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  pickCopy: {
    flex: 1,
  },
  pickTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  pickSub: {
    marginTop: 2,
    fontSize: 12,
    color: colors.muted,
    textTransform: 'capitalize',
  },
  stepper: {
    flexDirection: 'row',
    gap: 8,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.prepBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.prepBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextOn: {
    color: colors.primaryDark,
  },
  save: {
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveOff: {
    backgroundColor: colors.faint,
  },
  saveText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
