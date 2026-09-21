import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import ExerciseGif from '../components/exercisegif';
import { FLOOR_PLAN } from '../data/floorPlan';
import { GlassCard, GlassPanel, GlassScreen } from '../components/glass';
import PrimaryButton from '../components/button';
import { normalizeMoves } from '../lib/session';
import { openWorkoutMusic } from '../lib/music';
import { GOAL_MUSIC } from '../data/music';

const READY_SECONDS = 3;

function buzz(kind = 'light') {
  try {
    const Haptics = require('expo-haptics');
    if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // haptics are optional on web
  }
}

function formatTime(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function Stepper({ label, value, onChange, step = 1, min = 0 }) {
  return (
    <View className="items-center">
      <Text className="mb-1 text-xs text-muted">{label}</Text>
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          className="h-9 w-9 items-center justify-center rounded-full bg-surface"
          onPress={() => onChange(Math.max(min, Math.round((value - step) * 10) / 10))}
        >
          <Ionicons name="remove" size={16} color="#1A1A1A" />
        </TouchableOpacity>
        <Text className="min-w-[48px] text-center text-2xl font-extrabold text-ink">{value}</Text>
        <TouchableOpacity
          className="h-9 w-9 items-center justify-center rounded-full bg-surface"
          onPress={() => onChange(Math.round((value + step) * 10) / 10)}
        >
          <Ionicons name="add" size={16} color="#1A1A1A" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function PlayerScreen({ navigation, route }) {
  const { completeExercise, completeMany, logSession, getExercise, profile } = useApp();
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

  if (!exercise) return null;

  const stage = (
    <GlassCard className="mx-1 my-2 flex-1">
      <View className="min-h-[180px] items-center justify-center">
        {exercise.gifUrl || exercise.photoFrames?.length ? (
          <ExerciseGif
            uri={exercise.gifUrl}
            frames={exercise.photoFrames}
            style={{ height: 180, width: '100%' }}
          />
        ) : (
          <Text className="text-[28px] font-extrabold text-ink">{exercise.name}</Text>
        )}
      </View>
    </GlassCard>
  );

  if (phase === 'done') {
    return (
      <GlassScreen scroll={false} contentClassName="flex-1 items-center justify-center">
        <Text className="text-center text-[22px] font-extrabold text-accent">Workout logged</Text>
        <Text className="mt-2 text-center font-bold text-ink">
          {doneRef.current.size} exercises · {Math.max(1, Math.round((Date.now() - startedAt.current) / 60000))} min
        </Text>
        <Text className="mt-2 text-center text-muted">
          Missed a day? Take the next scheduled session rather than doubling up — recovery is part of the plan.
        </Text>
        <View className="mt-6 w-full">
          <PrimaryButton title="Close" icon="checkmark" onPress={() => navigation.goBack()} />
        </View>
      </GlassScreen>
    );
  }

  if (phase === 'ready' || phase === 'rest') {
    return (
      <GlassScreen scroll={false} contentClassName="flex-1">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity className="p-2" onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={22} color="#8E8E93" />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center gap-1.5 p-2" onPress={startMusic}>
            <Ionicons name="musical-notes" size={18} color="#BA4A0C" />
            <Text className="text-[13px] font-semibold text-accent">Music</Text>
          </TouchableOpacity>
        </View>
        {stage}
        <Text className="text-center text-[22px] font-extrabold text-accent">
          {phase === 'rest' ? 'REST' : 'READY'}
        </Text>
        <Text className="mt-2 px-4 text-center font-bold text-ink">
          {phase === 'rest' && isSets && setNo + 1 < (current.sets || 1)
            ? `Next set ${setNo + 2} · ${exercise.name}`
            : phase === 'rest'
              ? nextExercise?.name || 'Last move done'
              : exercise.name.toUpperCase()}
        </Text>
        <Text className="mt-1.5 text-center text-muted">
          {index + 1} / {moves.length}
          {isSets ? ` · set ${setNo + 1}/${current.sets}` : ''}
        </Text>
        <View className="flex-row items-center justify-center gap-4 py-7">
          <GlassPanel className="h-[88px] w-[88px] rounded-full border-accent">
            <View className="h-full items-center justify-center">
              <Text className="text-[28px] font-extrabold text-ink">{phase === 'rest' ? restLeft : readyLeft}</Text>
            </View>
          </GlassPanel>
          <TouchableOpacity
            onPress={() => {
              if (phase === 'rest') {
                if (isSets && setNo + 1 < (current.sets || 1)) {
                  setSetNo((n) => n + 1);
                  setPhase('go');
                } else setPhase('advance');
              } else setPhase('go');
            }}
            className="p-2"
          >
            <Ionicons name="chevron-forward" size={22} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      </GlassScreen>
    );
  }

  return (
    <GlassScreen scroll={false} contentClassName="flex-1">
      <View className="flex-row items-center justify-between">
        <TouchableOpacity className="p-2" onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color="#8E8E93" />
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center gap-1.5 p-2" onPress={startMusic}>
          <Ionicons name="musical-notes" size={18} color="#BA4A0C" />
          <Text className="text-[13px] font-semibold text-accent">Music</Text>
        </TouchableOpacity>
      </View>
      {stage}
      <Text className="mt-2 px-4 text-center font-bold text-ink">{exercise.name.toUpperCase()}</Text>
      <Text className="mt-1.5 text-center text-muted">
        {index + 1} / {moves.length}
        {nextExercise ? ` · next: ${nextExercise.name}` : ' · last move'}
        {isSets ? ` · set ${setNo + 1}/${current.sets}` : ''}
      </Text>
      {current.note ? (
        <Text className="mt-2 px-6 text-center text-[13px] leading-5 text-muted">{current.note}</Text>
      ) : null}

      {isSets ? (
        <>
          <View className="mt-4 flex-row justify-around">
            <Stepper label="Reps" value={reps} onChange={setReps} min={1} />
            <Stepper label="kg" value={weightKg} onChange={setWeightKg} step={0.5} min={0} />
          </View>
          <View className="mt-5">
            <PrimaryButton title={`Log set ${setNo + 1}`} icon="checkmark" onPress={logSet} />
          </View>
        </>
      ) : (
        <Text className="my-3 text-center text-5xl font-extrabold text-ink">{formatTime(remaining)}</Text>
      )}

      {current.swapId ? (
        <TouchableOpacity onPress={swap} className="items-center py-2">
          <Text className="font-extrabold text-accent">Swap this move</Text>
        </TouchableOpacity>
      ) : null}

      <View className="mt-auto flex-row items-center justify-center gap-7 pb-8">
        <TouchableOpacity onPress={() => index > 0 && setIndex(index - 1)}>
          <Ionicons name="play-skip-back" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        {!isSets ? (
          <TouchableOpacity
            className="h-12 w-16 items-center justify-center rounded-2xl bg-accent"
            onPress={() => setPaused((value) => !value)}
          >
            <Ionicons name={paused ? 'play' : 'pause'} size={26} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity className="h-12 w-16 items-center justify-center rounded-2xl bg-surface" onPress={finishEarly}>
            <Ionicons name="stop" size={22} color="#1A1A1A" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => {
            if (index >= moves.length - 1) finishEarly();
            else setIndex(index + 1);
          }}
        >
          <Ionicons name="play-skip-forward" size={28} color="#1A1A1A" />
        </TouchableOpacity>
      </View>
    </GlassScreen>
  );
}
