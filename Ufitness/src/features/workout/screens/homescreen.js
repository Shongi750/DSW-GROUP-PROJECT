import React, { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import WeekHeader from '../components/weekheader';
import WeekStrip from '../components/weekstrip';
import SectionTitle from '../components/sectiontitle';
import WorkoutCard from '../components/workoutcard';
import InsightsRow from '../components/insightscard';
import { GlassCard, GlassScreen } from '../components/glass';
import { useApp } from '../context/AppContext';
import { getWeekDays, daysWithSessions } from '../data/week';
import { FLOOR_PLAN } from '../data/floorPlan';
import { formatMoveMeta, estimateMinutes, movesFromIds } from '../lib/session';
import { takeWorkoutAction } from '../lib/pendingStart';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { todayPlan, weekDone, weekTotal, insightPercent, profile, plan, program, getExercise, statusSentence } =
    useApp();
  const planName = program ? program.goal.name : plan.name;
  const totalWeeks = program ? program.weeks : plan.weeks;

  const week = useMemo(() => getWeekDays(), []);
  const completedKeys = useMemo(() => daysWithSessions(profile.history), [profile.history]);
  const [selectedKey, setSelectedKey] = useState(week.find((item) => item.isToday)?.key);

  const startWorkout = useCallback(() => {
    if (todayPlan.type !== 'train' || !todayPlan.moves.length) return;
    navigation.navigate('Player', {
      exerciseIds: todayPlan.moves.map((move) => move.id),
      moves: todayPlan.moves,
      startIndex: 0,
      programId: program?.id || FLOOR_PLAN.id,
      sessionId: todayPlan.session?.id,
    });
  }, [navigation, todayPlan, program]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      takeWorkoutAction().then((pending) => {
        if (!alive || pending?.startToday !== true) return;
        startWorkout();
      });
      return () => {
        alive = false;
      };
    }, [startWorkout]),
  );

  return (
    <GlassScreen>
      <WeekHeader week={todayPlan.week} totalWeeks={totalWeeks} />
      <Text className="mt-2 text-[15px] font-bold leading-6 text-accent">{statusSentence}</Text>
      <WeekStrip
        days={week}
        selectedKey={selectedKey}
        completedKeys={completedKeys}
        onSelect={(item) => setSelectedKey(item.key)}
      />

      <SectionTitle>Today</SectionTitle>
      {todayPlan.type === 'train' ? (
        <>
          <WorkoutCard
            variant="featured"
            eyebrow={
              program
                ? `${program.goal.name} · ${program.splitName}`
                : `${plan.name} · ~${plan.minutes} min · ${plan.equipment}`
            }
            title={todayPlan.session.name}
            progressLabel={`${todayPlan.moves.length} moves · ~${estimateMinutes(todayPlan.moves)} min`}
            onStart={startWorkout}
          />
          <GlassCard className="mt-3">
            <View className="gap-2">
              {todayPlan.moves.map((move, index) => (
                <Text key={`${move.id}-${index}`} className="text-sm text-muted">
                  {index + 1}. {getExercise(move.id)?.name || move.id}
                  {move.swapped ? ' (swapped)' : ''} · {formatMoveMeta(move)}
                </Text>
              ))}
            </View>
          </GlassCard>
        </>
      ) : (
        <WorkoutCard
          variant="compact"
          eyebrow={todayPlan.type === 'done' ? 'Session logged' : 'Rest day'}
          title={todayPlan.type === 'done' ? "You're done for today" : 'No extra work'}
          progressLabel={statusSentence}
          onPress={() => navigation.navigate('Insights')}
        />
      )}

      <View className="mt-3">
        <WorkoutCard
          variant="compact"
          eyebrow={planName}
          title={`${weekDone} of ${weekTotal} sessions this week`}
          progressLabel={program ? 'Open your plan to see sets, reps and weekly volume.' : 'Miss a day and the next free day becomes that session.'}
          onPress={() => navigation.navigate('Plan')}
        />
      </View>

      <View className="mt-3">
        <WorkoutCard
          variant="compact"
          eyebrow="Music"
          title={profile.musicLinks?.[profile.musicPlatform] ? 'Your workout playlist' : 'Pick your music service'}
          progressLabel="Plays in Spotify, Apple Music, YouTube Music and more."
          onPress={() => navigation.navigate('Music')}
        />
      </View>

      <SectionTitle>My workouts</SectionTitle>
      {(profile.customWorkouts || []).length ? (
        (profile.customWorkouts || []).slice(0, 3).map((workout) => (
          <View key={workout.id} className="mb-3">
            <WorkoutCard
              variant="compact"
              eyebrow="Custom"
              title={workout.name}
              progressLabel={`${workout.exerciseIds.length} moves`}
              onPress={() =>
                navigation.navigate('Player', {
                  moves: movesFromIds(workout.exerciseIds, getExercise),
                  exerciseIds: workout.exerciseIds,
                  programId: workout.id,
                })
              }
            />
          </View>
        ))
      ) : (
        <WorkoutCard
          variant="compact"
          eyebrow="Build"
          title="Create your own workout"
          progressLabel="Pick exercises, save, then train."
          onPress={() => navigation.navigate('Workouts', { screen: 'Builder' })}
        />
      )}

      <SectionTitle>On track?</SectionTitle>
      <InsightsRow percent={insightPercent} onStartNew={() => navigation.navigate('Insights')} />
    </GlassScreen>
  );
}
