import React from 'react';
import { View, Text } from 'react-native';

export default function WeekHeader({ week, totalWeeks }) {
  const progress = Math.min(week / totalWeeks, 1);

  return (
    <View className="flex-row items-center gap-2.5">
      <View className="h-7 w-7 items-center justify-center rounded-full bg-accent">
        <Text className="text-[13px] font-extrabold text-white">{week}</Text>
      </View>
      <Text className="flex-1 text-[22px] font-bold text-ink">
        Week {week} of {totalWeeks}
      </Text>
      <View className="h-2 w-11 overflow-hidden rounded-full bg-black/10">
        <View className="h-full rounded-full bg-accent" style={{ width: `${progress * 100}%` }} />
      </View>
    </View>
  );
}
