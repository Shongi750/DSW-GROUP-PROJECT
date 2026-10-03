import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Image, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { popularPrograms, getProgram } from '../data/programs';
import CatalogHeader from '../components/catalogheader';
import SectionTitle from '../components/sectiontitle';
import ProgramGrid from '../components/programgrid';
import ClipRow from '../components/cliprow';
import WeekStrip from '../components/weekstrip';
import WorkoutListRow from '../components/workoutlistrow';
import { GlassCard, GlassScreen } from '../components/glass';
import { StartCard, StartCardRow } from '../components/startcard';
import { useApp } from '../context/AppContext';
import { useTheme } from '../../../context/ThemeContext';
import { loadChallengeFeed, saveClipOffline } from '../lib/clipStore';
import { WORKOUT_SESSIONS, loadSavedSessions, rememberExercises } from '../lib/sessionApi';
import { getWeekDays, daysWithSessions } from '../data/week';
import {
  WORKOUT_GROUPS,
  listWorkouts,
  listCollections,
  workoutsInCollection,
  imageForWorkout,
} from '../data/readyWorkouts';

const GROUP_ICONS = {
  all: 'apps',
  quick: 'flash',
  strength: 'barbell',
  cardio: 'walk',
  core: 'body',
  stretch: 'leaf',
};

function matchesQuery(program, query) {
  const haystack = `${program.overlayTitle} ${program.overlaySubtitle} ${program.name} ${program.reason || ''} ${program.badge || ''}`.toLowerCase();
  return haystack.includes(query);
}

function matchesClip(clip, query) {
  return `${clip.title} ${clip.blurb} ${clip.creator}`.toLowerCase().includes(query);
}

function PopularTile({ workout, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.popularTile}>
      <Image source={{ uri: imageForWorkout(workout) }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.popularFade}>
        <Text style={styles.popularTitle} numberOfLines={2}>
          {workout.name}
        </Text>
        <Text style={styles.popularMeta}>
          {workout.minutes} min · {workout.level}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function WorkoutScreen({ navigation }) {
  const { recommendations, profile } = useApp();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [feed, setFeed] = useState({ date: '', today: [], saved: [] });
  const [savedSessions, setSavedSessions] = useState([]);
  const [workoutGroup, setWorkoutGroup] = useState('all');
  const [collectionId, setCollectionId] = useState('');
  const [showMore, setShowMore] = useState(false);
  const week = useMemo(() => getWeekDays(), []);
  const [selectedKey, setSelectedKey] = useState(week.find((d) => d.isToday)?.key);
  const completedKeys = useMemo(() => daysWithSessions(profile?.history || []), [profile?.history]);

  const normalized = query.trim().toLowerCase();
  const collections = listCollections();
  const readyWorkouts = collectionId
    ? workoutsInCollection(collectionId).filter((item) => matchesQuery(item, normalized) || !normalized)
    : listWorkouts(normalized, workoutGroup);

  const popularTiles = readyWorkouts.slice(0, 4);
  const listRows = readyWorkouts.slice(0, 8);

  const reload = useCallback(() => {
    loadChallengeFeed().then(setFeed);
    loadSavedSessions().then((saved) => setSavedSessions(Object.values(saved)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const popular = useMemo(
    () => (normalized ? popularPrograms.filter((item) => matchesQuery(item, normalized)) : popularPrograms),
    [normalized]
  );
  const recommended = useMemo(
    () => (normalized ? recommendations.filter((item) => matchesQuery(item, normalized)) : recommendations.slice(0, 2)),
    [normalized, recommendations]
  );

  const savedIds = useMemo(() => new Set((feed.saved || []).map((item) => item.id)), [feed.saved]);
  const today = normalized ? feed.today.filter((item) => matchesClip(item, normalized)) : feed.today;
  const saved = (normalized ? feed.saved.filter((item) => matchesClip(item, normalized)) : feed.saved).filter(
    (item) => !today.some((clip) => clip.id === item.id)
  );

  const openProgram = (program) => {
    navigation.navigate('Exercises', { programId: program.id, title: program.name });
  };

  const openSession = (session) => {
    if (session.exercises?.length) rememberExercises(session.exercises);
    navigation.navigate('Exercises', { sessionId: session.id, title: session.name });
  };

  const sessions = useMemo(
    () => (normalized ? WORKOUT_SESSIONS.filter((item) => matchesQuery(item, normalized)) : WORKOUT_SESSIONS),
    [normalized]
  );

  const startClip = (clip) => {
    const program = clip.programId ? getProgram(clip.programId) : null;
    const moves = clip.moves?.length ? clip.moves : program?.moves;
    const exerciseIds = clip.exerciseIds?.length ? clip.exerciseIds : program?.exerciseIds;
    if (!moves?.length && !exerciseIds?.length) {
      navigation.navigate('Clip', { clip });
      return;
    }
    navigation.navigate('PreStart', {
      title: clip.title || 'Clip workout',
      minutes: clip.minutes || 15,
      level: 'Train',
      focus: clip.blurb || 'Clip',
      moves: (exerciseIds || moves).length,
      exerciseIds: exerciseIds || moves.map((move) => move.id),
      programId: clip.programId || clip.id,
    });
  };

  const downloadClip = async (clip) => {
    await saveClipOffline(clip);
    reload();
  };

  const startReadyWorkout = (workout) => {
    navigation.navigate('PreStart', {
      title: workout.name,
      minutes: workout.minutes,
      level: workout.level,
      focus: workout.focus,
      moves: workout.exerciseIds?.length || 0,
      exerciseIds: workout.exerciseIds,
      programId: workout.id,
      workoutId: workout.id,
      group: workout.group,
      image: imageForWorkout(workout),
    });
  };

  const challengeWorkout = readyWorkouts[0] || listWorkouts('', 'all')[0];

  return (
    <GlassScreen>
      <CatalogHeader placeholder="Search workouts..." activeId="programs" onQueryChange={setQuery} />

      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => challengeWorkout && startReadyWorkout(challengeWorkout)}
        style={styles.challengeWrap}
      >
        <LinearGradient
          colors={['#1C1C1C', '#141414', '#0A0A0A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.challenge}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.challengeKicker, { color: colors.accentBright }]}>NEW CHALLENGE</Text>
            <Text style={styles.challengeTitle}>2 weeks of campus energy</Text>
            <Text style={styles.challengeSub}>
              {challengeWorkout ? `Start with ${challengeWorkout.name}` : 'Pick a workout below'}
            </Text>
          </View>
          <View style={[styles.challengeStart, { backgroundColor: colors.accent }]}>
            <Ionicons name="play" size={18} color="#FFFFFF" />
            <Text style={styles.challengeStartText}>Start</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <WeekStrip
        days={week}
        selectedKey={selectedKey}
        completedKeys={completedKeys}
        onSelect={(item) => setSelectedKey(item.key)}
      />

      {!collectionId ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10, marginBottom: 4 }}>
          <View className="flex-row gap-2">
            {WORKOUT_GROUPS.map((group) => {
              const selected = workoutGroup === group.id;
              return (
                <TouchableOpacity
                  key={group.id}
                  onPress={() => setWorkoutGroup(group.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? colors.accent : colors.card,
                    },
                  ]}
                >
                  <Ionicons
                    name={GROUP_ICONS[group.id] || 'ellipse'}
                    size={14}
                    color={selected ? '#FFFFFF' : colors.accent}
                  />
                  <Text style={{ color: selected ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '800' }}>
                    {group.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      ) : null}

      <SectionTitle style={{ marginTop: 16 }}>Popular</SectionTitle>
      {readyWorkouts.length === 0 ? (
        <Text className="mb-3 text-muted">No workouts match that search.</Text>
      ) : (
        <View style={styles.popularGrid}>
          {popularTiles.map((workout) => (
            <PopularTile key={workout.id} workout={workout} onPress={() => startReadyWorkout(workout)} />
          ))}
        </View>
      )}

      <SectionTitle>Workouts</SectionTitle>
      {listRows.map((workout) => (
        <WorkoutListRow
          key={workout.id}
          image={imageForWorkout(workout)}
          title={workout.name}
          meta={`${workout.minutes} min · ${workout.focus}`}
          level={workout.level}
          onPress={() => startReadyWorkout(workout)}
        />
      ))}
      {readyWorkouts.length > 8 ? (
        <TouchableOpacity
          onPress={() => navigation.navigate('Exercises')}
          style={{ paddingVertical: 10, marginBottom: 8 }}
        >
          <Text style={{ textAlign: 'center', color: colors.accent, fontWeight: '800' }}>Browse all exercises</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        onPress={() => setShowMore((v) => !v)}
        className="mt-4 mb-2 flex-row items-center justify-between py-2"
      >
        <Text className="text-base font-bold text-ink">More</Text>
        <Ionicons name={showMore ? 'chevron-up' : 'chevron-down'} size={18} color="#9A9A9A" />
      </TouchableOpacity>
      {showMore ? (
        <>
          <SectionTitle style={{ marginTop: 8 }}>Collections</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            <View className="flex-row gap-3">
              {collections.map((item) => {
                const on = collectionId === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.9}
                    onPress={() => {
                      setCollectionId(on ? '' : item.id);
                      setWorkoutGroup('all');
                    }}
                    style={{ width: 148, height: 88, borderRadius: 6, overflow: 'hidden' }}
                  >
                    <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.88)']}
                      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 10 }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{item.label}</Text>
                      <Text style={{ color: on ? '#FF8A1A' : '#D4D4D4', fontSize: 10 }}>
                        {on ? 'Selected' : item.blurb}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <SectionTitle>Daily clips</SectionTitle>
          <ClipRow
            videos={today}
            savedIds={savedIds}
            onWatch={(clip) => navigation.navigate('Clip', { clip })}
            onStart={startClip}
            onDownload={downloadClip}
          />
          {saved.length ? (
            <>
              <SectionTitle>Saved offline</SectionTitle>
              <ClipRow
                videos={saved}
                savedIds={savedIds}
                onWatch={(clip) => navigation.navigate('Clip', { clip })}
                onStart={startClip}
              />
            </>
          ) : null}

          <SectionTitle>Sessions</SectionTitle>
          <StartCardRow>
            {sessions.map((session) => (
              <StartCard
                key={session.id}
                title={session.name}
                meta={session.meta || 'Session'}
                badge={session.badge || 'Focus'}
                onPress={() => openSession(session)}
              />
            ))}
          </StartCardRow>
          {savedSessions.length ? (
            <>
              <SectionTitle>Downloaded</SectionTitle>
              {savedSessions.map((session) => (
                <GlassCard key={session.id} className="mb-2" onPress={() => openSession(session)}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="font-bold text-ink">{session.name}</Text>
                      <Text className="mt-1 text-xs text-muted">
                        {session.meta || `${session.exercises?.length || 0} moves`}
                      </Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={20} color="#FF6A00" />
                  </View>
                </GlassCard>
              ))}
            </>
          ) : null}
          <SectionTitle>Programs</SectionTitle>
          <ProgramGrid programs={popular} onPressProgram={openProgram} />
          <SectionTitle>For you</SectionTitle>
          <ProgramGrid programs={recommended} onPressProgram={openProgram} />
        </>
      ) : null}
    </GlassScreen>
  );
}

const styles = StyleSheet.create({
  challengeWrap: {
    marginTop: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  challenge: {
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,106,0,0.28)',
  },
  challengeKicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  challengeTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
  challengeSub: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#C9C9C9',
  },
  challengeStart: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    shadowColor: '#FF6A00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  challengeStartText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  popularTile: {
    width: '47.5%',
    height: 148,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
  },
  popularFade: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  popularTitle: {
    color: '#FFFFFF',
    fontFamily: 'Anton_400Regular',
    fontSize: 16,
    textTransform: 'uppercase',
  },
  popularMeta: {
    color: '#D4D4D4',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
});
