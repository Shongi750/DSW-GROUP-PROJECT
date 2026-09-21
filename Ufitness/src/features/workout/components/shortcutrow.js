import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from './glass';

export default function ShortcutRow({ items, onPress, activeId }) {
  return (
    <View className="mb-2 mt-5 flex-row justify-around">
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <TouchableOpacity
            key={item.id}
            className="min-w-[84px] items-center gap-2"
            onPress={() => onPress?.(item)}
            activeOpacity={0.8}
          >
            <GlassPanel className={`h-[52px] w-[52px] rounded-full ${active ? 'border-accent' : ''}`}>
              <View className="h-full items-center justify-center">
                <Ionicons name={item.icon} size={22} color="#1A1A1A" />
              </View>
            </GlassPanel>
            <Text className={`text-[13px] font-semibold ${active ? 'text-accent' : 'text-ink'}`}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
