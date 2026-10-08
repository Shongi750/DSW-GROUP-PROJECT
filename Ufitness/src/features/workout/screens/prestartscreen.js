import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassScreen } from '../components/glass';
import { OrangeStartBar } from '../components/startcard';
import { useTheme, radius, display, spacing } from '../../../context/ThemeContext';
import { imageForWorkout } from '../data/readyWorkouts';
import { useApp } from '../context/AppContext';
import { getPlatform, playlistForWorkout } from '../data/music';
import { openSpotifyPlaylist } from '../lib/music';

function MetaChip({ icon, label, colors }) {
  return (
    <View style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons name={icon} size={16} color={colors.accent} />
      <Text style={[styles.chipText, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

// Last screen before the Player — summary + "open music?" toggle
export default function PreStartScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { profile, setMusicAutoOpen } = useApp();
  const p = route.params || {};
  const title = p.title || 'Workout';
  const minutes = p.minutes || 15;
  const level = p.level || 'Train';
  const focus = p.focus || 'Full body';
  const moves = p.moves || p.exerciseIds?.length || 0;
  const image = p.image || (p.workoutId ? imageForWorkout({ id: p.workoutId, group: p.group }) : null);
  const exerciseIds = p.exerciseIds || [];

  const platform = getPlatform(profile.musicPlatform || 'spotify');
  const hasPlaylist = Boolean(profile.musicLinks?.[platform.id]);
  const [openMusic, setOpenMusic] = useState(Boolean(profile.musicAutoOpen) || hasPlaylist);
  // Spotify playlist that matches today's workout (HIIT, strength, cardio, stretch…)
  const pick = playlistForWorkout({ title, focus, level, group: p.group, goal: profile.goal });

  const start = () => {
    // Remember the choice for next time.
    setMusicAutoOpen(openMusic);
    navigation.replace('Player', {
      title,
      exerciseIds,
      moves: p.movesList || undefined,
      programId: p.programId || p.workoutId,
      sessionId: p.sessionId,
      startIndex: 0,
      openMusic: openMusic,
    });
  };

  return (
    <GlassScreen>
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

      {/* Suggested Spotify playlist for this workout — opens the app, or open.spotify.com */}
      <TouchableOpacity
        onPress={() => openSpotifyPlaylist(pick.id)}
        style={[styles.musicRow, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={[styles.cover, { backgroundColor: pick.color }]}>
          <Ionicons name={pick.icon} size={20} color="#FFFFFF" />
        </View>
        <View style={styles.musicText}>
          <Text style={[styles.musicTitle, { color: colors.text }]}>Suggested: {pick.name}</Text>
          <Text style={[styles.musicSub, { color: colors.muted }]}>
            {pick.label} playlist on Spotify · matches this workout
          </Text>
        </View>
        <Ionicons name="logo-spotify" size={22} color="#1DB954" />
      </TouchableOpacity>

      {/* Simple music prompt — open their app when the workout starts */}
      <View style={[styles.musicRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.musicText}>
          <Text style={[styles.musicTitle, { color: colors.text }]}>
            Open {platform.name}?
          </Text>
          <Text style={[styles.musicSub, { color: colors.muted }]}>
            {hasPlaylist
              ? 'Uses your saved playlist.'
              : 'Opens a workout search. Tap Music later to save a playlist.'}
          </Text>
        </View>
        <Switch
          value={openMusic}
          onValueChange={setOpenMusic}
          trackColor={{ true: '#FF6A00', false: '#3A3A3A' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Music')} style={styles.musicLink}>
        <Ionicons name="musical-notes" size={16} color={colors.accent} />
        <Text style={[styles.musicLinkText, { color: colors.accent }]}>Music settings</Text>
      </TouchableOpacity>

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
    height: 220,
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
  musicRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  cover: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  musicText: {
    flex: 1,
  },
  musicTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  musicSub: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 16,
  },
  musicLink: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  musicLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    marginTop: 28,
    paddingTop: spacing.section,
    gap: spacing.gap,
    paddingBottom: 16,
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
