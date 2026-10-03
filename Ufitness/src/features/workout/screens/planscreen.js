import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { GlassCard, GlassScreen } from '../components/glass';
import SectionTitle from '../components/sectiontitle';
import PrimaryButton from '../components/button';
import { GOALS, EQUIPMENT_TIERS, VOLUME_LANDMARKS, MUSCLE_LABELS, goalReferences } from '../data/goals';
import { buildProgram, weekSessions, weeklyVolume, weekLabel } from '../lib/programming';
import { estimateMinutes, formatMoveMeta } from '../lib/session';
import TrainDaysPicker from '../components/traindayspicker';
import { DAY_NAMES, resolveTrainWeekdays } from '../lib/trainDays';

const STATUS_COLOR = { low: '#FFB020', ok: '#FF6A00', high: '#FF4D4F' };

function VolumeRow({ entry }) {
  const width = Math.min(100, (entry.direct / VOLUME_LANDMARKS.max) * 100);
  return (
    <View className="mb-2.5">
      <View className="mb-1 flex-row justify-between">
        <Text className="text-[13px] font-semibold text-ink">{MUSCLE_LABELS[entry.muscle] || entry.muscle}</Text>
        <Text className="text-[13px] text-muted">
          {entry.direct} direct{entry.indirect ? ` · ${entry.indirect} assisting` : ''}
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-surface">
        <View
          className="h-2 rounded-full"
          style={{ width: `${width}%`, backgroundColor: STATUS_COLOR[entry.status] }}
        />
      </View>
    </View>
  );
}

export default function PlanScreen({ navigation }) {
  const { profile, updateProfile, todayPlan, getExercise } = useApp();
  const [showWhy, setShowWhy] = useState(false);

  if (!profile.goal) {
    return (
      <GlassScreen>
        <Text className="text-[28px] font-display uppercase text-ink">Choose a training goal</Text>
        <Text className="mb-5 mt-2 leading-5 text-muted">
          Pick what you are training for and we will build a plan around it: the split, weekly sets per muscle, rep
          ranges, rests and a planned deload.
        </Text>
        {GOALS.map((goal) => (
          <GlassCard key={goal.id} className="mb-3" onPress={() => updateProfile({ goal: goal.id })}>
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                <Ionicons name={goal.icon} size={20} color="#FF6A00" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-extrabold text-ink">{goal.name}</Text>
                <Text className="mt-1 leading-5 text-muted">{goal.blurb}</Text>
              </View>
            </View>
          </GlassCard>
        ))}
      </GlassScreen>
    );
  }

  const trainDays = resolveTrainWeekdays(profile);
  const program = buildProgram({ ...profile, daysPerWeek: trainDays.length });
  const weekIndex = todayPlan?.weekIndex || 0;
  const sessions = weekSessions(program, weekIndex);
  const volume = weeklyVolume(program, weekIndex);
  const { goal } = program;
  const tier = EQUIPMENT_TIERS.find((item) => item.id === program.tier);
  const lowMuscles = volume.filter((entry) => entry.status === 'low');

  const startSession = (session) => {
    navigation.navigate('Player', {
      exerciseIds: session.moves.map((move) => move.id),
      moves: session.moves,
      startIndex: 0,
      programId: program.id,
      sessionId: session.id,
    });
  };

  return (
    <GlassScreen>
      <Text className="text-[28px] font-display uppercase text-ink">{goal.name}</Text>
      <Text className="mt-2 leading-5 text-muted">
        {program.splitName} · {tier?.name} · week {weekIndex + 1} of {program.weeks} ({weekLabel(weekIndex)})
      </Text>

      <Text className="mb-2 mt-5 text-[13px] font-bold text-muted">TRAINING DAYS</Text>
      <TrainDaysPicker
        days={trainDays}
        onChange={(next) => updateProfile({ trainWeekdays: next, daysPerWeek: next.length })}
      />

      <GlassCard className="mt-4">
        <View className="flex-row justify-between">
          {[
            ['Reps', `${goal.mainReps[0]}-${goal.mainReps[1]}`],
            ['Rest', `${Math.round(goal.restMain / 60)} min`],
            ['Effort', `${goal.rir} RIR`],
            ['Days', `${program.daysPerWeek}`],
          ].map(([label, value]) => (
            <View key={label} className="items-center">
              <Text className="text-lg font-extrabold text-ink">{value}</Text>
              <Text className="mt-0.5 text-[12px] text-muted">{label}</Text>
            </View>
          ))}
        </View>
      </GlassCard>

      <SectionTitle>This week</SectionTitle>
      {sessions.map((session, index) => (
        <GlassCard key={session.id} className="mb-3" onPress={() => startSession(session)}>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-base font-extrabold text-ink">
              {DAY_NAMES[trainDays[index]] || `Day ${index + 1}`} · {session.name}
            </Text>
            <Text className="text-[12px] text-muted">~{estimateMinutes(session.moves)} min</Text>
          </View>
          {session.moves.map((move, moveIndex) => {
            const exercise = getExercise(move.id);
            return (
              <View key={`${move.id}-${moveIndex}`} className="mb-1 flex-row justify-between">
                <Text className="mr-3 flex-1 text-[13px] text-ink" numberOfLines={1}>
                  {exercise?.name || move.id}
                </Text>
                <Text className="text-[13px] text-muted">{formatMoveMeta(move)}</Text>
              </View>
            );
          })}
          {session.deload ? (
            <Text className="mt-2 text-[12px] text-accent">Planned deload week — lighter on purpose.</Text>
          ) : null}
        </GlassCard>
      ))}

      <SectionTitle>Weekly sets per muscle</SectionTitle>
      <GlassCard>
        {volume.map((entry) => (
          <VolumeRow key={entry.muscle} entry={entry} />
        ))}
        <Text className="mt-2 text-[12px] leading-5 text-muted">
          Target band is {VOLUME_LANDMARKS.min}-{VOLUME_LANDMARKS.max} direct sets per muscle per week, with about{' '}
          {VOLUME_LANDMARKS.target} being productive for most people. Assisting sets are listed for context and are
          not counted against the band.
          {lowMuscles.length
            ? ` Below the band right now: ${lowMuscles.map((entry) => MUSCLE_LABELS[entry.muscle]).join(', ')} — add a day or a set if that matters to you.`
            : ''}
        </Text>
      </GlassCard>

      <SectionTitle>Why this plan</SectionTitle>
      <GlassCard onPress={() => setShowWhy((current) => !current)}>
        {goal.why.map((line) => (
          <View key={line} className="mb-2 flex-row gap-2">
            <Text className="text-accent">•</Text>
            <Text className="flex-1 text-[14px] leading-5 text-ink">{line}</Text>
          </View>
        ))}
        <Text className="mt-1 text-[12px] text-muted">
          {showWhy ? 'Sources below.' : 'Tap to see the research these numbers come from.'}
        </Text>
        {showWhy
          ? goalReferences(goal).map((reference) => (
              <View key={reference.key} className="mt-3 border-t border-white/10 pt-3">
                <Text className="text-[13px] font-semibold text-ink">{reference.label}</Text>
                <Text className="mt-1 text-[13px] leading-5 text-muted">{reference.takeaway}</Text>
              </View>
            ))
          : null}
      </GlassCard>

      <SectionTitle>Adjust</SectionTitle>
      <View className="flex-row flex-wrap gap-2">
        {GOALS.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => updateProfile({ goal: item.id })}
            className={`rounded-full border px-4 py-2.5 ${
              item.id === goal.id ? 'border-accent bg-accent/15' : 'border-white/10 bg-surface'
            }`}
          >
            <Text className={`text-[13px] font-semibold ${item.id === goal.id ? 'text-ink' : 'text-muted'}`}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {EQUIPMENT_TIERS.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => updateProfile({ equipmentTier: item.id })}
            className={`rounded-full border px-4 py-2.5 ${
              item.id === program.tier ? 'border-accent bg-accent/15' : 'border-white/10 bg-surface'
            }`}
          >
            <Text className={`text-[13px] font-semibold ${item.id === program.tier ? 'text-ink' : 'text-muted'}`}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {[2, 3, 4, 5, 6].map((days) => (
          <TouchableOpacity
            key={days}
            onPress={() => updateProfile({ daysPerWeek: days })}
            className={`rounded-full border px-4 py-2.5 ${
              days === program.daysPerWeek ? 'border-accent bg-accent/15' : 'border-white/10 bg-surface'
            }`}
          >
            <Text
              className={`text-[13px] font-semibold ${days === program.daysPerWeek ? 'text-ink' : 'text-muted'}`}
            >
              {days} days
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="mt-6">
        <PrimaryButton title="Music for this session" icon="musical-notes" onPress={() => navigation.navigate('Music')} />
      </View>
    </GlassScreen>
  );
}
