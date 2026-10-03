import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from './glass';

const themes = {
  anatomy: { icon: 'body', iconColor: '#E8A07A' },
  darkLift: { icon: 'barbell', iconColor: '#FF6A00' },
  home: { icon: 'home', iconColor: '#FF8A1A' },
  split: { icon: 'fitness', iconColor: '#FFFFFF' },
  mobility: { icon: 'leaf', iconColor: '#E8A07A' },
  abdomen: { icon: 'body', iconColor: '#FFB27A' },
  sandro: { icon: 'ribbon', iconColor: '#FF6A00' },
  highpower: { icon: 'flash', iconColor: '#FF6A00' },
};

export default function ProgramCard({ program, onPress }) {
  const theme = themes[program.theme] || themes.darkLift;

  return (
    <TouchableOpacity className="flex-1" onPress={onPress} activeOpacity={0.85}>
      <GlassPanel>
        <View className="h-[150px] items-center justify-center">
          <Ionicons name={theme.icon} size={42} color={theme.iconColor} />
          {program.badge ? (
            <View className="absolute right-2.5 top-2.5 rounded-full bg-accent px-2.5 py-1">
              <Text className="text-[10px] font-extrabold text-white">{program.badge}</Text>
            </View>
          ) : null}
          <View className="absolute bottom-3 left-3">
            <Text
              className="text-xl tracking-wide text-ink"
              style={{ fontFamily: 'Anton_400Regular', textTransform: 'uppercase' }}
            >
              {program.overlayTitle}
            </Text>
            {program.overlaySubtitle ? (
              <Text
                className="text-xl tracking-wide text-ink"
                style={{ fontFamily: 'Anton_400Regular', textTransform: 'uppercase' }}
              >
                {program.overlaySubtitle}
              </Text>
            ) : null}
          </View>
        </View>
      </GlassPanel>
      <Text className="mt-2 text-[13px] font-semibold text-ink">{program.name}</Text>
      {program.reason ? <Text className="mt-1 text-[11px] font-semibold text-accent">{program.reason}</Text> : null}
      {program.meta ? <Text className="mt-0.5 text-xs text-muted">{program.meta}</Text> : null}
      <View className="mt-2 flex-row items-center self-start rounded-full bg-accent px-3 py-1.5">
        <Text className="mr-1 text-[11px] font-extrabold text-white">Start</Text>
        <Ionicons name="play" size={11} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}
