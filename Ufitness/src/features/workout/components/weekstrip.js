import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { GlassPanel } from './glass';

export default function WeekStrip({ days, selectedKey, completedKeys, onSelect }) {
  return (
    <GlassPanel className="mt-4">
      <View className="flex-row justify-between px-2 py-3">
        {days.map((item) => {
          const selected = item.key === selectedKey;
          const completed = completedKeys?.has(item.key);
          return (
            <TouchableOpacity
              key={item.key}
              className="items-center gap-1.5"
              onPress={() => onSelect?.(item)}
              activeOpacity={0.8}
            >
              <Text className="text-[11px] font-semibold text-muted">{item.weekday}</Text>
              <View
                className={`h-10 w-10 items-center justify-center rounded-full ${
                  selected ? 'bg-accent' : completed ? 'border border-accent' : 'bg-surface'
                }`}
              >
                <Text
                  className={`text-base font-semibold ${
                    selected ? 'text-white' : completed ? 'text-accent' : 'text-muted'
                  }`}
                >
                  {item.day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </GlassPanel>
  );
}
