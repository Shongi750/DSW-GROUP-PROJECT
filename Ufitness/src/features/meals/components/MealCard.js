import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/theme';
import { useTheme, radius } from '../../../context/ThemeContext';
import { PHOTO_GLASS } from '../../../components/PhotoShell';
import SafeImage from '../../../components/SafeImage';

const TAG_STYLES = {
  carbs: { backgroundColor: colors.primarySoft, color: colors.primary },
  protein: { backgroundColor: colors.proteinBg, color: colors.proteinText },
  balanced: { backgroundColor: colors.balancedBg, color: colors.balancedText },
  prep: { backgroundColor: 'transparent', color: colors.muted },
};

export default function MealCard({ meal, onPress, onSwap, onCookOwn, eaten, onAte }) {
  const { colors: theme } = useTheme();
  return (
    <View
      style={[
        styles.card,
        PHOTO_GLASS,
        { opacity: eaten ? 0.72 : 1 },
      ]}
    >
      <Pressable onPress={() => onPress?.(meal)} style={({ pressed }) => pressed && styles.pressed}>
        <View style={styles.imageWrap}>
          <SafeImage uri={meal.image} style={styles.image} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.imageFade}>
            <Text style={styles.slot}>{meal.slot}</Text>
            <View style={styles.kcalRow}>
              {eaten ? (
                <>
                  <Ionicons name="checkmark-circle" size={14} color="#FF8A1A" />
                  <Text style={styles.kcal}>Eaten</Text>
                </>
              ) : (
                <>
                  <Ionicons name="flame" size={12} color="#FF8A1A" />
                  <Text style={styles.kcal}>{meal.kcal} kcal</Text>
                </>
              )}
            </View>
          </LinearGradient>
        </View>
        <View style={styles.body}>
          <Text style={[styles.title, { color: '#FFFFFF' }]} numberOfLines={2}>
            {meal.title}
          </Text>
          <Text style={[styles.description, { color: '#C9C9C9' }]} numberOfLines={2}>
            {meal.description}
          </Text>
          <View style={styles.tags}>
            {(meal.tags || []).slice(0, 3).map((tag) => {
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
        </View>
      </Pressable>

      <View style={styles.actions}>
        {onAte && !eaten ? (
          <Pressable onPress={() => onAte(meal)} style={[styles.primaryBtn, { backgroundColor: theme.accent }]}>
            <Text style={styles.primaryText}>I ate this</Text>
            <Ionicons name="restaurant" size={12} color="#FFFFFF" />
          </Pressable>
        ) : null}
        {eaten ? (
          <View style={[styles.eatenPill, { backgroundColor: 'rgba(255,106,0,0.16)' }]}>
            <Ionicons name="checkmark" size={14} color={theme.accent} />
            <Text style={[styles.eatenText, { color: theme.accent }]}>Logged</Text>
          </View>
        ) : null}
        {onSwap && !eaten ? (
          <Pressable onPress={() => onSwap(meal)} style={styles.iconBtn}>
            <Ionicons name="shuffle" size={16} color={theme.accent} />
          </Pressable>
        ) : null}
        {onCookOwn && !meal.custom && !eaten ? (
          <Pressable onPress={() => onCookOwn(meal)} style={styles.iconBtn}>
            <Ionicons name="create-outline" size={16} color={theme.muted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageWrap: {
    height: 168,
    backgroundColor: colors.prepBg,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFade: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  slot: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kcal: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  title: {
    fontFamily: 'Anton_400Regular',
    fontSize: 20,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  description: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  primaryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  eatenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  eatenText: {
    fontSize: 12,
    fontWeight: '800',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.92,
  },
});
