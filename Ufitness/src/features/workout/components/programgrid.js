import React from 'react';
import { View, Text } from 'react-native';
import ProgramCard from './programcard';

export default function ProgramGrid({ programs, onPressProgram }) {
  if (programs.length === 0) {
    return <Text className="text-[13px] text-muted">No programs match your search.</Text>;
  }

  const rows = [];
  for (let i = 0; i < programs.length; i += 2) {
    rows.push(programs.slice(i, i + 2));
  }

  return (
    <View className="gap-4">
      {rows.map((row) => (
        <View key={row.map((item) => item.id).join('-')} className="flex-row gap-3">
          {row.map((program) => (
            <ProgramCard key={program.id} program={program} onPress={() => onPressProgram?.(program)} />
          ))}
          {row.length === 1 ? <View className="flex-1" /> : null}
        </View>
      ))}
    </View>
  );
}
