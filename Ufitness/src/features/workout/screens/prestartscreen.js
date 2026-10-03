import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassScreen } from '../components/glass';
import { OrangeStartBar } from '../components/startcard';
import { useTheme, radius, display, spacing } from '../../../context/ThemeContext';
import { imageForWorkout } from '../data/readyWorkouts';

function MetaChip({ icon, label, colors }) {
  return (
    <View style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons name={icon} size={16} color={colors.accent} />
      <Text style={[styles.chipText, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

// Nike-style overview before the player starts.
export default function PreStartScreen({ navigation, route }) {
  const { colors } = useTheme();
  const p = route.params || {};
  const title = p.title || 'Workout';
  const minutes = p.minutes || 15;
  const level = p.level || 'Train';
  const focus = p.focus || 'Full body';
  const moves = p.moves || p.exerciseIds?.length || 0;
  const image = p.image || (p.workoutId ? imageForWorkout({ id: p.workoutId, group: p.group }) : null);
  const exerciseIds = p.exerciseIds || [];

  const start = () => {
    navigation.replace('Player', {
      title,
      exerciseIds,
      moves: p.movesList || undefined,
      programId: p.programId || p.workoutId,
      sessionId: p.sessionId,
      startIndex: 0,
    });
  };

  return (
    <GlassScreen scroll={false} contentClassName="flex-1">
      <View style={styles.top}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={styles.close}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.hero, { backgroundColor: colors.background }]}>
        {image ? (
          <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(14,10,8,0.55)', 'rgba(14,10,8,0.96)']}
          style={styles.heroFade}
        >
          <Text style={[styles.kicker, { color: colors.accentBright }]}>READY TO TRAIN</Text>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </LinearGradient>
      </View>

      <View style={styles.metaRow}>
        <MetaChip icon="time-outline" label={`${minutes} min`} colors={colors} />
        <MetaChip icon="speedometer-outline" label={level} colors={colors} />
        <MetaChip icon="body-outline" label={focus} colors={colors} />
        <MetaChip icon="list-outline" label={`${moves} moves`} colors={colors} />
      </View>

      <Text style={[styles.blurb, { color: colors.muted }]}>
        No setup. Follow each move on screen. Swap or skip anytime.
      </Text>

      <View style={styles.footer}>
        <OrangeStartBar title="Start workout" onPress={start} disabled={!exerciseIds.length} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancel}>
          <Text style={[styles.cancelText, { color: colors.muted }]}>Not now</Text>
        </TouchableOpacity>
      </View>
    </GlassScreen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    height: 260,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  heroFade: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    ...display,
    fontSize: 32,
    letterSpacing: 0.6,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  blurb: {
    marginTop: spacing.card,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.section,
    gap: spacing.gap,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
