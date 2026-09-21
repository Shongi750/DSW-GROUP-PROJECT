import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

export default function PrimaryButton({ title = 'Start', onPress, icon = 'play' }) {
  return (
    <TouchableOpacity
      className="flex-row items-center justify-center gap-2 rounded-full bg-accent py-3.5"
      style={{
        backgroundColor: colors.accent,
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={16} color={colors.white} />
      <Text className="text-base font-bold text-white" style={{ color: colors.white, fontSize: 16, fontWeight: '700' }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
