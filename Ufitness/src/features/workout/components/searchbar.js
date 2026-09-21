import React from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from './glass';

export default function SearchBar({ value, onChangeText, placeholder = 'Search programs...' }) {
  return (
    <GlassPanel className="rounded-full">
      <View className="flex-row items-center gap-2.5 px-4 py-3">
        <Ionicons name="search" size={18} color="#8E8E93" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          className="flex-1 p-0 text-[15px] text-ink"
          autoCorrect={false}
        />
      </View>
    </GlassPanel>
  );
}
