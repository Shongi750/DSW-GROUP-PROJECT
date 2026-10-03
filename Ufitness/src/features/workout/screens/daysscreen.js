import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useApp } from '../context/AppContext';
import { GlassScreen } from '../components/glass';
import PrimaryButton from '../components/button';
import TrainDaysPicker from '../components/traindayspicker';
import { getSplit } from '../data/movements';
import { resolveTrainWeekdays, trainDayLabels } from '../lib/trainDays';

export default function DaysScreen({ navigation }) {
  const { profile, updateProfile } = useApp();
  const [days, setDays] = useState(() => resolveTrainWeekdays(profile));
  const split = getSplit(profile.goal, days.length);

  return (
    <GlassScreen>
      <View className="mt-2 h-1 w-[78%] rounded bg-accent" />
      <Text className="mt-6 text-[26px] font-display uppercase text-ink">Which days can you train?</Text>
      <Text className="mb-6 mt-2 leading-5 text-muted">
        Tap the weekdays that fit your timetable. Miss one and the next free day becomes that session, not a double.
      </Text>

      <TrainDaysPicker days={days} onChange={setDays} />
      <Text className="mt-3 text-[13px] leading-5 text-muted">
        {days.length} days: {trainDayLabels(days).join(', ')}.
      </Text>

      {split ? (
        <Text className="mt-1 text-[13px] leading-5 text-muted">{days.length} days gives you: {split.name}.</Text>
      ) : null}

      <View className="mt-6">
        <PrimaryButton
          title="NEXT"
          icon="arrow-forward"
          onPress={() => {
            updateProfile({ trainWeekdays: days, daysPerWeek: days.length });
            navigation.navigate('Campus');
          }}
        />
      </View>
    </GlassScreen>
  );
}
