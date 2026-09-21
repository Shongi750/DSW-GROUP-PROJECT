import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../constants/theme';
import { useTheme } from '../../../context/ThemeContext';
import SafeImage from '../../../components/SafeImage';

const TAG_STYLES = {
  carbs: { backgroundColor: colors.primarySoft, color: colors.primary },
  protein: { backgroundColor: colors.proteinBg, color: colors.proteinText },
  balanced: { backgroundColor: colors.balancedBg, color: colors.balancedText },
  prep: { backgroundColor: 'transparent', color: colors.muted },
};

export default function MealCard({ meal, onPress, onSwap, onCookOwn }) {
  const { colors: theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Pressable onPress={() => onPress?.(meal)} style={({ pressed }) => pressed && styles.pressed}>
        <SafeImage uri={meal.image} style={styles.image} resizeMode="cover" />
        <View style={styles.body}>
          <View style={styles.meta}>
            <Text style={styles.slot}>{meal.slot}</Text>
            <View style={styles.kcalRow}>
              <Ionicons name="flame" size={12} color={colors.primary} />
              <Text style={styles.kcal}>{meal.kcal} kcal</Text>
            </View>
          </View>
          <Text style={[styles.title, { color: theme.text }]}>{meal.title}</Text>
          <Text style={[styles.description, { color: theme.muted }]}>{meal.description}</Text>
          <View style={styles.tags}>
            {meal.tags.map((tag) => {
              const tone = TAG_STYLES[tag.tone] || TAG_STYLES.prep;
              return (
                <View
                  key={tag.label}
                  style={[styles.tag, tag.tone !== 'prep' && { backgroundColor: tone.backgroundColor }]}
                >
                  <Text style={[styles.tagText, { color: tone.color }]}>{tag.label}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.hint}>
            {meal.custom ? 'Tap to edit your plate' : 'Tap for ingredients, cook steps and portions'}
          </Text>
        </View>
      </Pressable>
      {onSwap || (onCookOwn && !meal.custom) ? (
        <View style={styles.actions}>
          {onSwap ? (
            <Pressable onPress={() => onSwap(meal)} style={styles.ownBtn}>
              <Text style={styles.ownText}>Swap meal</Text>
            </Pressable>
          ) : null}
          {onCookOwn && !meal.custom ? (
            <Pressable onPress={() => onCookOwn(meal)} style={styles.ownBtn}>
              <Text style={styles.ownText}>I'll cook my own</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 158,
    backgroundColor: colors.prepBg,
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  slot: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.muted,
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kcal: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  description: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  hint: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  ownBtn: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ownText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  pressed: {
    opacity: 0.92,
  },
});
