import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../../../context/ThemeContext';
import ExerciseGif from '../components/exercisegif';
import { FLOOR_PLAN } from '../data/floorPlan';
import { GlassScreen } from '../components/glass';
import PrimaryButton from '../components/button';
import { normalizeMoves } from '../lib/session';
import { openWorkoutMusic } from '../lib/music';
import { GOAL_MUSIC } from '../data/music';
import { useWorkoutLeave } from '../context/LeaveContext';
import { useActiveSession } from '../../../context/ActiveSessionContext';

const READY_SECONDS = 3;

function buzz(kind = 'light') {
  try {
    const Haptics = require('expo-haptics');
    if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // optional
  }
}

function formatTime(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function Stepper({ label, value, onChange, step = 1, min = 0, colors }) {
  return (
    <View style={styles.stepper}>
      <Text style={[styles.stepLabel, { color: colors.muted }]}>{label}</Text>
      <View style={styles.stepRow}>
        <TouchableOpacity
          style={[styles.stepBtn, { backgroundColor: colors.card }]}
          onPress={() => onChange(Math.max(min, Math.round((value - step) * 10) / 10))}
        >
          <Ionicons name="remove" size={16} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.stepValue, { color: colors.text }]}>{value}</Text>
        <TouchableOpacity
          style={[styles.stepBtn, { backgroundColor: colors.card }]}
          onPress={() => onChange(Math.round((value + step) * 10) / 10)}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function PlayerScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { completeExercise, completeMany, logSession, getExercise, profile, program, plan } = useApp();
  const { startSession, updateSession, endSession } = useActiveSession();
  const { onLeave } = useWorkoutLeave();
  const minimize = () => (onLeave ? onLeave() : navigation.goBack());
  const [moves, setMoves] = useState(() =>
    normalizeMoves(
      route.params?.moves || (route.params?.exerciseIds || ['arm-circles']).map((id) => ({ id })),
      getExercise
    )
  );
  const programId = route.params?.programId || FLOOR_PLAN.id;
  const sessionId = route.params?.sessionId;
  const startedAt = useRef(Date.now());
  const [index, setIndex] = useState(route.params?.startIndex || 0);
  const [setNo, setSetNo] = useState(0);
  const [phase, setPhase] = useState('ready');
  const [readyLeft, setReadyLeft] = useState(READY_SECONDS);
  const [remaining, setRemaining] = useState(30);
  const [restLeft, setRestLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reps, setReps] = useState(10);
  const [weightKg, setWeightKg] = useState(0);
  const doneRef = useRef(new Set());
  const setsLogRef = useRef([]);
  const advancedForIndex = useRef(null);

  const musicStarted = useRef(false);
  const platformId = profile.musicPlatform || 'spotify';
  const startMusic = () => {
    const goalQuery = (GOAL_MUSIC[profile.goal] || GOAL_MUSIC.hypertrophy).query;
    return openWorkoutMusic({
      platformId,
      savedLink: profile.musicLinks?.[platformId],
      query: goalQuery,
    });
  };

  useEffect(() => {
    if (!profile.musicAutoOpen || musicStarted.current) return;
    musicStarted.current = true;
    startMusic();
  }, [profile.musicAutoOpen]);

  const current = moves[index];
  const nextMove = moves[index + 1];
  const exercise = useMemo(() => (current ? getExercise(current.id) : null), [current, getExercise]);
  const nextExercise = nextMove ? getExercise(nextMove.id) : null;
  const isSets = current?.mode === 'sets';
  const progress = moves.length ? (index + (phase === 'go' || phase === 'rest' || phase === 'advance' ? 0.35 : 0)) / moves.length : 0;

  useEffect(() => {
    startSession({
      title: route.params?.title || program?.goal?.name || plan?.name || 'Workout',
      startedAt: startedAt.current,
      movesTotal: moves.length,
      currentMove: exercise?.name || '',
    });
    return () => endSession();
  }, []);

  useEffect(() => {
    updateSession({
      movesDone: doneRef.current.size,
      currentMove: exercise?.name || '',
      state: phase === 'rest' ? 'Rest' : paused ? 'Paused' : 'Live',
    });
  }, [index, exercise?.id, phase, paused, updateSession]);

  useEffect(() => {
    advancedForIndex.current = null;
    setPhase('ready');
    setReadyLeft(READY_SECONDS);
    setPaused(false);
    setSetNo(0);
    setRemaining(current?.duration || exercise?.duration || 30);
    const last = profile.lastSets?.[current?.id];
    setReps(last?.reps || current?.reps || 10);
    setWeightKg(last?.weightKg || current?.weightKg || 0);
  }, [index, current?.id]);

  useEffect(() => {
    if (phase !== 'ready') return undefined;
    const timer = setInterval(() => {
      setReadyLeft((value) => {
        if (value <= 1) {
          clearInterval(timer);
          buzz('light');
          setPhase('go');
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, index]);

  useEffect(() => {
    if (phase !== 'go' || paused || isSets) return undefined;
    const timer = setTimeout(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setPhase(current?.rest ? 'rest' : 'advance');
          setRestLeft(current?.rest || 0);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [phase, paused, remaining, index, current?.rest, isSets]);

  useEffect(() => {
    if (phase !== 'rest') return undefined;
    const timer = setTimeout(() => {
      setRestLeft((value) => {
        if (value <= 1) {
          if (isSets && setNo + 1 < (current.sets || 1)) {
            setSetNo((n) => n + 1);
            setPhase('go');
            return 0;
          }
          setPhase('advance');
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [phase, restLeft, index, isSets, setNo, current?.sets]);

  const finishMove = () => {
    if (!exercise) return;
    doneRef.current.add(exercise.id);
    completeExercise(exercise.id);
    buzz(index < moves.length - 1 ? 'light' : 'success');
    if (index < moves.length - 1) {
      setIndex((value) => value + 1);
    } else {
      completeMany([...doneRef.current]);
      logSession({
        exerciseIds: [...doneRef.current],
        minutes: Math.max(1, Math.round((Date.now() - startedAt.current) / 60000)),
        programId,
        sessionId,
        setsLog: setsLogRef.current,
      });
      setPhase('done');
    }
  };

  useEffect(() => {
    if (phase !== 'advance' || !exercise) return;
    if (advancedForIndex.current === index) return;
    advancedForIndex.current = index;
    finishMove();
  }, [phase, exercise, index]);

  const logSet = () => {
    const existing = setsLogRef.current.find((item) => item.id === current.id);
    const row = { reps, weightKg };
    if (existing) existing.sets.push(row);
    else setsLogRef.current.push({ id: current.id, sets: [row] });
    buzz('light');
    if (setNo + 1 < (current.sets || 1)) {
      setRestLeft(current.rest || 20);
      setPhase('rest');
    } else if (current.rest) {
      setRestLeft(current.rest);
      setPhase('rest');
    } else {
      setPhase('advance');
    }
  };

  const swap = () => {
    if (!current?.swapId) return;
    setMoves((list) =>
      list.map((item, i) => (i === index ? { ...item, id: item.swapId, swapId: item.id, swapped: true } : item))
    );
  };

  const finishEarly = () => {
    const finished = [...doneRef.current, exercise?.id].filter(Boolean);
    completeMany(finished);
    logSession({
      exerciseIds: finished,
      minutes: Math.max(1, Math.round((Date.now() - startedAt.current) / 60000)),
      programId,
      sessionId,
      setsLog: setsLogRef.current,
    });
    setPhase('done');
  };

  useEffect(() => {
    if (phase !== 'done') return;
    const minutes = Math.max(1, Math.round((Date.now() - startedAt.current) / 60000));
    navigation.replace('Finish', {
      minutes,
      moves: doneRef.current.size,
      title: 'Workout complete',
      programId,
    });
  }, [phase, navigation, programId]);

  if (phase === 'done') {
    return (
      <GlassScreen scroll={false} contentClassName="flex-1 items-center justify-center">
        <Text className="text-center font-bold text-ink">Saving your session…</Text>
      </GlassScreen>
    );
  }

  if (!exercise) return null;

  const bar = (
    <View style={[styles.track, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
      <View style={[styles.fill, { width: `${Math.min(100, Math.max(6, progress * 100))}%`, backgroundColor: colors.accent }]} />
    </View>
  );

  const header = (
    <View style={styles.header}>
      <TouchableOpacity style={styles.iconBtn} onPress={minimize}>
        <Ionicons name="chevron-down" size={22} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={styles.progressLabel}>
        {index + 1} / {moves.length}
      </Text>
      <TouchableOpacity style={styles.iconBtn} onPress={startMusic}>
        <Ionicons name="musical-notes" size={18} color={colors.accent} />
      </TouchableOpacity>
    </View>
  );

  const media = (
    <View style={styles.media}>
      {exercise.gifUrl || exercise.photoFrames?.length ? (
        <ExerciseGif
          uri={exercise.gifUrl}
          frames={exercise.photoFrames}
          style={{ height: 220, width: '100%' }}
        />
      ) : (
        <Text style={styles.mediaFallback}>{exercise.name}</Text>
      )}
    </View>
  );

  const nextCard = nextExercise ? (
    <View style={[styles.nextCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.nextKicker, { color: colors.accent }]}>UP NEXT</Text>
      <Text style={[styles.nextName, { color: colors.text }]} numberOfLines={1}>
        {nextExercise.name}
      </Text>
    </View>
  ) : (
    <View style={[styles.nextCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.nextKicker, { color: colors.accent }]}>LAST MOVE</Text>
      <Text style={[styles.nextName, { color: colors.text }]}>Finish strong</Text>
    </View>
  );

  if (phase === 'ready' || phase === 'rest') {
    return (
      <GlassScreen scroll={false} contentClassName="flex-1">
        {header}
        {bar}
        {media}
        <Text style={[styles.phaseTag, { color: colors.accent }]}>
          {phase === 'rest' ? 'REST' : 'GET READY'}
        </Text>
        <Text style={[styles.moveTitle, { color: colors.text }]}>
          {phase === 'rest' && isSets && setNo + 1 < (current.sets || 1)
            ? `Set ${setNo + 2} · ${exercise.name}`
            : phase === 'rest'
              ? nextExercise?.name || 'Almost done'
              : exercise.name}
        </Text>
        <View style={styles.countdownWrap}>
          <View style={[styles.countdown, { borderColor: colors.accent }]}>
            <Text style={[styles.countdownNum, { color: colors.text }]}>
              {phase === 'rest' ? restLeft : readyLeft}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (phase === 'rest') {
                if (isSets && setNo + 1 < (current.sets || 1)) {
                  setSetNo((n) => n + 1);
                  setPhase('go');
                } else setPhase('advance');
              } else setPhase('go');
            }}
            style={[styles.skipPill, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
        {nextCard}
      </GlassScreen>
    );
  }

  return (
    <GlassScreen scroll={false} contentClassName="flex-1">
      {header}
      {bar}
      {media}
      <Text style={[styles.moveTitle, { color: colors.text }]}>{exercise.name}</Text>
      {isSets ? (
        <Text style={[styles.meta, { color: colors.muted }]}>
          Set {setNo + 1}/{current.sets}
        </Text>
      ) : (
        <Text style={[styles.timer, { color: colors.text }]}>{formatTime(remaining)}</Text>
      )}

      {isSets ? (
        <>
          <View style={styles.steppers}>
            <Stepper label="Reps" value={reps} onChange={setReps} min={1} colors={colors} />
            <Stepper label="kg" value={weightKg} onChange={setWeightKg} step={0.5} min={0} colors={colors} />
          </View>
          <View style={{ marginTop: 16 }}>
            <PrimaryButton title={`Log set ${setNo + 1}`} icon="checkmark" onPress={logSet} />
          </View>
        </>
      ) : null}

      {current.swapId ? (
        <TouchableOpacity onPress={swap} style={styles.swap}>
          <Text style={{ color: colors.accent, fontWeight: '800' }}>Swap this move</Text>
        </TouchableOpacity>
      ) : null}

      {paused && !isSets ? (
        <TouchableOpacity onPress={finishEarly} style={styles.endLink}>
          <Text style={[styles.endText, { color: colors.muted }]}>End session</Text>
        </TouchableOpacity>
      ) : null}

      {nextCard}

      <View style={styles.controls}>
        <TouchableOpacity onPress={() => index > 0 && setIndex(index - 1)} style={styles.controlBtn}>
          <Ionicons name="play-skip-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        {!isSets ? (
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: colors.accent }]}
            onPress={() => setPaused((value) => !value)}
          >
            <Ionicons name={paused ? 'play' : 'pause'} size={28} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.playBtn, { backgroundColor: colors.card }]} onPress={finishEarly}>
            <Ionicons name="stop" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => {
            if (index >= moves.length - 1) finishEarly();
            else setIndex(index + 1);
          }}
          style={styles.controlBtn}
        >
          <Ionicons name="play-skip-forward" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </GlassScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLabel: {
    color: '#C9C9C9',
    fontWeight: '800',
    fontSize: 13,
  },
  track: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 14,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  media: {
    height: 220,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaFallback: {
    fontFamily: 'Anton_400Regular',
    fontSize: 28,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  phaseTag: {
    marginTop: 18,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  moveTitle: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Anton_400Regular',
    fontSize: 26,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 8,
  },
  meta: {
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '700',
  },
  timer: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 48,
    fontWeight: '800',
  },
  countdownWrap: {
    alignItems: 'center',
    marginTop: 18,
    gap: 14,
  },
  countdown: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNum: {
    fontSize: 36,
    fontWeight: '800',
  },
  skipPill: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  skipText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  nextCard: {
    marginTop: 18,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  nextKicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  nextName: {
    fontSize: 16,
    fontWeight: '800',
  },
  steppers: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stepper: { alignItems: 'center' },
  stepLabel: { fontSize: 12, marginBottom: 6 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { minWidth: 48, textAlign: 'center', fontSize: 24, fontWeight: '800' },
  swap: { alignItems: 'center', marginTop: 12 },
  endLink: { alignItems: 'center', marginTop: 14, paddingVertical: 4 },
  endText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  controls: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    paddingBottom: 20,
    paddingTop: 12,
  },
  controlBtn: { padding: 8 },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
