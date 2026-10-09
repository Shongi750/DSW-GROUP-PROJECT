import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import WeekHeader from '../components/weekheader';
import WeekStrip from '../components/weekstrip';
import SectionTitle from '../components/sectiontitle';
import WorkoutCard from '../components/workoutcard';
import TodayWorkoutCard from '../components/todayworkoutcard';
import InsightsRow from '../components/insightscard';
import { GlassScreen } from '../components/glass';
import { useApp } from '../context/AppContext';
import { getWeekDays, daysWithSessions } from '../data/week';
import { FLOOR_PLAN } from '../data/floorPlan';
import { estimateMinutes, movesFromIds } from '../lib/session';
import { takeWorkoutAction } from '../lib/pendingStart';
import { workoutsInCollection, imageForWorkout } from '../data/readyWorkouts';
import { useActiveSession } from '../../../context/ActiveSessionContext';
import { buildTodayPreview } from '../lib/todayPreview';

// Workout tab home — today’s plan, resume pill, and quick starts.
export default function HomeScreen() {
  const navigation = useNavigation();
  const active = useActiveSession() || {};
  const session = active.session;
  const app = useApp();
  const todayPlan = app.todayPlan;
  const weekDone = app.weekDone;
  const weekTotal = app.weekTotal;
  const insightPercent = app.insightPercent;
  const profile = app.profile;
  const plan = app.plan;
  const program = app.program;
  const getExercise = app.getExercise;
  const statusSentence = app.statusSentence;

  const planName = program ? program.goal.name : plan.name;
  const totalWeeks = program ? program.weeks : plan.weeks;

  const week = getWeekDays();
  const completedKeys = daysWithSessions(profile.history);
  const todayKey = week.find(function (item) { return item.isToday; });
  const [selectedKey, setSelectedKey] = useState(todayKey ? todayKey.key : undefined);
  const campusReady = workoutsInCollection('dorm').slice(0, 3);
  const gymReady = workoutsInCollection('gym').slice(0, 3);
  const todayPreview = buildTodayPreview({ todayPlan: todayPlan, getExercise: getExercise });

  function openPreStart(params) {
    navigation.navigate('PreStart', params);
  }

  function startWorkout() {
    if (todayPlan.type !== 'train' || !todayPlan.moves.length) {
      return;
    }
    openPreStart({
      title: program ? program.goal.name : plan.name,
      minutes: estimateMinutes(todayPlan.moves) || plan.minutes || 30,
      level: plan.equipment || 'Train',
      focus: (program && program.splitName) || 'Today',
      moves: todayPlan.moves.length,
      movesList: todayPlan.moves,
      exerciseIds: todayPlan.moves.map(function (move) { return move.id; }),
      programId: (program && program.id) || FLOOR_PLAN.id,
      sessionId: todayPlan.session && todayPlan.session.id,
    });
  }

  // Put the user back in Player with the saved timer state.
  function resumeLive() {
    const payload = session && session.resume;
    if (!payload) {
      return false;
    }
    const hasMoves = payload.moves && payload.moves.length;
    const hasIds = payload.exerciseIds && payload.exerciseIds.length;
    if (!hasMoves && !hasIds) {
      return false;
    }
    navigation.navigate('Player', {
      title: payload.title || 'Workout',
      programId: payload.programId,
      sessionId: payload.sessionId,
      exerciseIds: payload.exerciseIds,
      moves: payload.moves,
      resume: payload,
    });
    return true;
  }

  // Deep links from notifications / other tabs land here as pending actions.
  useFocusEffect(
    React.useCallback(function () {
      let alive = true;
      takeWorkoutAction().then(function (pending) {
        if (!alive || !pending) {
          return;
        }
        if (pending.resumePlayer === true) {
          resumeLive();
          return;
        }
        // From Profile → Downloads: open the downloaded workout in the normal Exercises screen.
        if (pending.openDownload) {
          const ref = String(pending.openDownload);
          if (ref.startsWith('ready-')) {
            navigation.navigate('PreStart', { workoutId: ref.slice('ready-'.length) });
            return;
          }
          const params = ref.startsWith('session-')
            ? { sessionId: ref.slice('session-'.length) }
            : { programId: ref.replace(/^program-/, '') };
          navigation.navigate('Workouts', { screen: 'Exercises', params: params, initial: false });
          return;
        }
        if (pending.openInsights === true) {
          navigation.navigate('Insights');
          return;
        }
        if (pending.startToday === true) {
          startWorkout();
          return;
        }
        if (pending.preStart && pending.exerciseIds && pending.exerciseIds.length) {
          openPreStart(pending);
          return;
        }
        if (pending.exerciseIds && pending.exerciseIds.length) {
          openPreStart({
            title: pending.title || 'Workout',
            minutes: pending.minutes || 15,
            level: pending.level || 'Train',
            focus: pending.focus || 'Full body',
            moves: pending.moves || pending.exerciseIds.length,
            exerciseIds: pending.exerciseIds,
            programId: pending.programId,
            workoutId: pending.workoutId || pending.programId,
            group: pending.group,
            image: pending.image,
          });
        }
      });
      return function () {
        alive = false;
      };
    }, [navigation])
  );

  return (
    <GlassScreen>
      <WeekHeader week={todayPlan.week} totalWeeks={totalWeeks} />
      <Text className="mt-2 text-[15px] font-bold leading-6 text-accent">{statusSentence}</Text>
      <WeekStrip
        days={week}
        selectedKey={selectedKey}
        completedKeys={completedKeys}
        onSelect={function (item) { setSelectedKey(item.key); }}
      />

      {session && session.minimized && session.resume ? (
        <>
          <SectionTitle>Resume</SectionTitle>
          <WorkoutCard
            variant="featured"
            eyebrow="Paused session"
            title={session.currentMove || session.title || 'Continue workout'}
            progressLabel={
              'Move ' +
              Math.min((session.movesDone || 0) + 1, session.movesTotal || 1) +
              ' of ' +
              (session.movesTotal || 1)
            }
            onStart={resumeLive}
          />
        </>
      ) : null}

      <SectionTitle>{"Today's workout"}</SectionTitle>
      <TodayWorkoutCard
        preview={todayPreview}
        eyebrow={
          todayPlan.type === 'train'
            ? program
              ? program.goal.name + ' · ' + program.splitName
              : plan.name + ' · ' + plan.equipment
            : statusSentence
        }
        onStart={startWorkout}
        onRestPress={function () { navigation.navigate('Insights'); }}
      />

      <SectionTitle>Campus ready</SectionTitle>
      <Text className="mb-2 text-[13px] leading-5 text-muted">
        Dorm / desk sessions — no gym required.
      </Text>
      {campusReady.map(function (workout) {
        return (
          <View key={workout.id} className="mb-3">
            <WorkoutCard
              variant="compact"
              eyebrow={workout.minutes + ' min · ' + workout.level}
              title={workout.name}
              progressLabel={workout.focus}
              onPress={function () {
                openPreStart({
                  title: workout.name,
                  minutes: workout.minutes,
                  level: workout.level,
                  focus: workout.focus,
                  moves: workout.exerciseIds.length,
                  exerciseIds: workout.exerciseIds,
                  programId: workout.id,
                  workoutId: workout.id,
                  group: workout.group,
                  image: imageForWorkout(workout),
                });
              }}
            />
          </View>
        );
      })}
      <SectionTitle>Gym split</SectionTitle>
      <Text className="mb-2 text-[13px] leading-5 text-muted">
        Hard barbell and machine sessions for the campus gym.
      </Text>
      {gymReady.map(function (workout) {
        return (
          <View key={workout.id} className="mb-3">
            <WorkoutCard
              variant="compact"
              eyebrow={workout.minutes + ' min · ' + workout.level}
              title={workout.name}
              progressLabel={workout.focus + ' · ' + workout.exerciseIds.length + ' moves'}
              onPress={function () {
                openPreStart({
                  title: workout.name,
                  minutes: workout.minutes,
                  level: workout.level,
                  focus: workout.focus,
                  moves: workout.exerciseIds.length,
                  movesList: workout.moves,
                  exerciseIds: workout.exerciseIds,
                  programId: workout.id,
                  workoutId: workout.id,
                  group: workout.group,
                  image: imageForWorkout(workout),
                });
              }}
            />
          </View>
        );
      })}
      <WorkoutCard
        variant="compact"
        eyebrow="Explore"
        title="More workouts"
        progressLabel="All gym splits, strength, cardio, and custom builder."
        onPress={function () { navigation.navigate('Workouts'); }}
      />

      <View className="mt-3">
        <WorkoutCard
          variant="compact"
          eyebrow={planName}
          title={weekDone + ' of ' + weekTotal + ' sessions this week'}
          progressLabel={
            program
              ? 'Open your plan to see sets, reps and weekly volume.'
              : 'Miss a day and the next free day becomes that session.'
          }
          onPress={function () { navigation.navigate('Plan'); }}
        />
      </View>

      <SectionTitle>My workouts</SectionTitle>
      {(profile.customWorkouts || []).length ? (
        (profile.customWorkouts || []).slice(0, 3).map(function (workout) {
          return (
            <View key={workout.id} className="mb-3">
              <WorkoutCard
                variant="compact"
                eyebrow="Custom"
                title={workout.name}
                progressLabel={workout.exerciseIds.length + ' moves'}
                onPress={function () {
                  openPreStart({
                    title: workout.name,
                    minutes: Math.max(10, workout.exerciseIds.length * 2),
                    level: 'Custom',
                    focus: 'My workouts',
                    moves: workout.exerciseIds.length,
                    movesList: movesFromIds(workout.exerciseIds, getExercise),
                    exerciseIds: workout.exerciseIds,
                    programId: workout.id,
                  });
                }}
              />
            </View>
          );
        })
      ) : (
        <WorkoutCard
          variant="compact"
          eyebrow="Build"
          title="Create your own workout"
          progressLabel="Pick exercises, save, then train."
          onPress={function () { navigation.navigate('Workouts', { screen: 'Builder' }); }}
        />
      )}

      <SectionTitle>On track?</SectionTitle>
      <InsightsRow percent={insightPercent} onStartNew={function () { navigation.navigate('Insights'); }} />
    </GlassScreen>
  );
}
