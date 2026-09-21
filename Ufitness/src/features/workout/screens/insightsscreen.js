import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { getProgram } from '../data/programs';
import { sessionStreak, weekActivity, muscleBreakdown, personalRecords, weekVolume } from '../data/progress';
import WeekStrip from '../components/weekstrip';
import { daysWithSessions } from '../data/week';
import { GlassCard, GlassScreen } from '../components/glass';
import SectionTitle from '../components/sectiontitle';
import PrimaryButton from '../components/button';

function BarChart({ days }) {
  const max = Math.max(1, ...days.map((item) => item.minutes || item.sessions));
  return (
    <View className="h-24 flex-row items-end justify-between gap-2">
      {days.map((item) => {
        const value = item.minutes || item.sessions;
        const height = 8 + (value / max) * 72;
        return (
          <View key={item.key} className="h-full flex-1 items-center justify-end">
            <View
              className={`w-[70%] min-h-[8px] rounded-md ${value > 0 ? 'bg-accent' : 'bg-black/10'}`}
              style={{ height }}
            />
            <Text className="mt-1.5 text-[11px] text-muted">{item.weekday}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function InsightsScreen({ navigation }) {
  const { profile, todayPlan, statusSentence, weekDone, weekTotal, getExercise } = useApp();

  const history = profile.history || [];
  const weekDays = useMemo(() => weekActivity(history), [history]);
  const streak = sessionStreak(history);
  const weekMinutes = weekDays.reduce((sum, day) => sum + day.minutes, 0);
  const weekPercent = Math.round((Math.min(weekDone, weekTotal) / Math.max(weekTotal, 1)) * 100);
  const muscles = muscleBreakdown(profile.completedExerciseIds || [], getExercise);
  const records = personalRecords(history);
  const volume = weekVolume(history.filter((item) => weekDays.some((day) => day.key === item.date)));
  const completedKeys = daysWithSessions(history);

  const startToday = () => {
    if (todayPlan.type !== 'train') {
      navigation.navigate('Home');
      return;
    }
    navigation.navigate('Player', {
      exerciseIds: todayPlan.moves.map((move) => move.id),
      moves: todayPlan.moves,
      startIndex: 0,
      programId: 'floor-25',
      sessionId: todayPlan.session?.id,
    });
  };

  return (
    <GlassScreen>
      <Text className="text-[28px] font-extrabold text-ink">Your progress</Text>
      <Text className="mb-5 mt-1.5 leading-5 text-muted">{statusSentence}</Text>

      <GlassCard>
        <View className="flex-row items-center gap-4">
          <View className="h-[88px] w-[88px] items-center justify-center rounded-full border-8 border-accent">
            <Text className="text-[22px] font-extrabold text-ink">{weekPercent}%</Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-ink">Are you on track?</Text>
            <Text className="mt-1 text-[13px] text-muted">
              {weekDone} of {weekTotal} uFitness sessions this week
            </Text>
          </View>
        </View>
      </GlassCard>

      <WeekStrip days={weekDays} selectedKey={weekDays.find((d) => d.isToday)?.key} completedKeys={completedKeys} />

      <View className="mb-2 mt-4 flex-row gap-2.5">
        {[
          ['flame', streak, 'Day streak'],
          ['time-outline', weekMinutes, 'Minutes'],
          ['checkmark-circle-outline', profile.completedExerciseIds.length, 'Moves done'],
        ].map(([icon, value, label]) => (
          <GlassCard key={label} className="flex-1">
            <View className="items-center gap-1">
              <Ionicons name={icon} size={18} color="#BA4A0C" />
              <Text className="text-xl font-extrabold text-ink">{value}</Text>
              <Text className="text-center text-[11px] text-muted">{label}</Text>
            </View>
          </GlassCard>
        ))}
      </View>

      <SectionTitle>Personal records</SectionTitle>
      <GlassCard>
        {Object.keys(records).length === 0 ? (
          <Text className="leading-5 text-muted">Log sets in the player to store your best reps and load. Week set-volume: {volume}.</Text>
        ) : (
          Object.entries(records)
            .slice(0, 6)
            .map(([id, rec]) => (
              <View key={id} className="mb-2 flex-row items-center justify-between">
                <Text className="flex-1 font-semibold text-ink">{getExercise(id)?.name || id}</Text>
                <Text className="text-[13px] text-muted">
                  {rec.reps} reps{rec.weightKg ? ` · ${rec.weightKg} kg` : ''}
                </Text>
              </View>
            ))
        )}
      </GlassCard>

      <SectionTitle>This week</SectionTitle>
      <GlassCard>
        <BarChart days={weekDays} />
        <Text className="mt-3 text-xs text-muted">Bar height is minutes trained each day.</Text>
      </GlassCard>

      <SectionTitle>Muscle focus</SectionTitle>
      <GlassCard>
        {muscles.length === 0 ? (
          <Text className="leading-5 text-muted">Finish a workout to see which areas you train most.</Text>
        ) : (
          muscles.map((item) => (
            <View key={item.label} className="mb-2.5 flex-row items-center gap-2">
              <Text className="w-[78px] text-[13px] font-semibold text-ink">{item.label}</Text>
              <View className="h-2 flex-1 overflow-hidden rounded bg-black/10">
                <View className="h-full rounded bg-accent" style={{ width: `${Math.round(item.ratio * 100)}%` }} />
              </View>
              <Text className="w-5 text-right text-xs text-muted">{item.count}</Text>
            </View>
          ))
        )}
      </GlassCard>

      <SectionTitle>Recent sessions</SectionTitle>
      {history.length === 0 ? (
        <GlassCard>
          <Text className="leading-5 text-muted">No sessions yet. Start today’s workout to log the first one.</Text>
        </GlassCard>
      ) : (
        history.slice(0, 8).map((item) => {
          const program = getProgram(item.programId);
          return (
            <GlassCard key={item.id} className="mb-2">
              <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-[10px] bg-accent/20">
                  <Ionicons name="barbell" size={16} color="#BA4A0C" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-ink">{program?.name || 'Custom session'}</Text>
                  <Text className="mt-0.5 text-xs text-muted">
                    {item.date} · {item.exerciseIds.length} moves · {item.minutes} min
                  </Text>
                </View>
              </View>
            </GlassCard>
          );
        })
      )}

      <View className="mt-6">
        <PrimaryButton
          title={todayPlan.type === 'train' ? "Start today's session" : 'See the plan on Home'}
          onPress={startToday}
          icon="play"
        />
      </View>
      <TouchableOpacity className="items-center py-3.5" onPress={() => navigation.navigate('Workouts')}>
        <Text className="font-bold text-muted">Browse programs</Text>
      </TouchableOpacity>
    </GlassScreen>
  );
}
