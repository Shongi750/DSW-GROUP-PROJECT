import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { TRAIN_DAY_OPTIONS, toggleTrainDay } from '../lib/trainDays';

export default function TrainDaysPicker({ days, onChange }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {TRAIN_DAY_OPTIONS.map((item) => {
        const selected = days.includes(item.value);
        return (
          <TouchableOpacity
            key={item.value}
            onPress={() => onChange(toggleTrainDay(days, item.value))}
            className={`min-w-[40px] items-center rounded-full px-3 py-2 ${selected ? 'bg-accent' : 'bg-surface'}`}
          >
            <Text className={`text-[13px] font-bold ${selected ? 'text-white' : 'text-ink'}`}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
