import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CookVideo from './CookVideo';
import GoalPicker from './GoalPicker';
import { colors, radius } from '../constants/theme';
import { useTheme } from '../../../context/ThemeContext';
import { scaleMeal, stapleLabel } from '../lib/portions';
import SafeImage from '../../../components/SafeImage';

export default function MealDetail({ meal, products, goal, onChangeGoal, onSwap, onCookOwn, onShare, onClose }) {
  const insets = useSafeAreaInsets();
  const { colors: theme } = useTheme();
  const recipe = meal ? scaleMeal(meal.recipeId, goal) : null;

  return (
    <Modal visible={Boolean(meal)} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: theme.background }]}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={theme.text} />
            <Text style={[styles.backText, { color: theme.text }]}>Meals</Text>
          </Pressable>
        </View>

        {meal && recipe ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}
          >
            <SafeImage uri={meal.image} style={styles.image} resizeMode="cover" />
            <Text style={styles.slot}>{meal.slot}</Text>
            <Text style={[styles.title, { color: theme.text }]}>{meal.title}</Text>
            <Text style={[styles.meta, { color: theme.muted }]}>
              {recipe.time} · {recipe.carbs}g carbs · {recipe.protein}g protein
            </Text>

            <GoalPicker value={goal} onChange={onChangeGoal} />

            <View style={styles.coach}>
              <Text style={styles.coachTitle}>{recipe.coach.title} plate</Text>
              <Text style={styles.coachBody}>{recipe.coach.detail}</Text>
              <Text style={styles.cupNote}>A small cup is a 125 ml tea cup — the one in most residences.</Text>
            </View>

            <Text style={[styles.heading, { color: theme.text }]}>Ingredients</Text>
            {recipe.ingredients.map((item) => (
              <View key={`${item.staple}-${item.label}`} style={styles.row}>
                <View style={styles.bullet} />
                <View style={styles.rowCopy}>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>
                    {item.display} {item.label}
                  </Text>
                  <Text style={[styles.rowSub, { color: theme.muted }]}>
                    {stapleLabel(item.staple, products)}
                    {item.carbs ? ` · ${item.carbs}g carbs` : ''}
                    {item.protein ? ` · ${item.protein}g protein` : ''}
                  </Text>
                </View>
              </View>
            ))}

            <Text style={[styles.heading, { color: theme.text }]}>How to cook</Text>
            {(recipe.steps || []).map((step, index) => (
              <View key={`${index}-${step}`} style={styles.row}>
                <Text style={styles.stepNum}>{index + 1}</Text>
                <Text style={[styles.stepText, { color: theme.text }]}>{step}</Text>
              </View>
            ))}
            <CookVideo video={recipe.video} mealTitle={meal.title} />

            <Text style={[styles.source, { color: theme.muted }]}>{recipe.source}</Text>

            {onSwap ? (
              <Pressable onPress={() => onSwap(meal)} style={styles.swapBtn}>
                <Text style={styles.swapText}>Swap this meal</Text>
              </Pressable>
            ) : null}
            {onShare ? (
              <Pressable onPress={() => onShare(meal)} style={styles.swapBtn}>
                <Text style={styles.swapText}>Share to Community</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => onCookOwn?.(meal)} style={styles.ownBtn}>
              <Text style={styles.ownText}>I'll cook my own — check food classes</Text>
            </Pressable>
          </ScrollView>
        ) : null}
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
  image: {
    width: '100%',
    height: 180,
    borderRadius: radius.card,
    backgroundColor: colors.prepBg,
    marginBottom: 14,
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
  heading: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  rowSub: {
    marginTop: 2,
    fontSize: 12,
    color: colors.muted,
  },
  stepNum: {
    width: 22,
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  source: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
  swapBtn: {
    marginTop: 22,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    paddingVertical: 14,
    alignItems: 'center',
  },
  swapText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  ownBtn: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ownText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
});
