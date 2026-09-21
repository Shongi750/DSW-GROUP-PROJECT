import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useWorkoutLeave } from '../context/LeaveContext';

export function GlowBackground() {
  return (
    <View className="absolute inset-0 overflow-hidden" style={{ pointerEvents: 'none' }}>
      <View className="absolute -left-16 -top-10 h-64 w-64 rounded-full bg-accent/15" />
      <View className="absolute right-[-40px] top-24 h-72 w-72 rounded-full bg-teal/10" />
      <View className="absolute bottom-28 left-8 h-56 w-56 rounded-full bg-accent/10" />
      <View className="absolute bottom-0 right-10 h-40 w-40 rounded-full bg-teal/10" />
    </View>
  );
}

export function GlassScreen({ children, edges, contentClassName = '', scroll = true }) {
  const { colors } = useTheme();
  const { consumeTopInset } = useWorkoutLeave();
  const safeEdges = edges || (consumeTopInset ? [] : ['top']);
  const body = scroll ? (
    <ScrollView
      className="flex-1"
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View className={contentClassName}>{children}</View>
    </ScrollView>
  ) : (
    <View className={`flex-1 px-5 pt-2 pb-8 ${contentClassName}`} style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 }}>{children}</View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GlowBackground />
      <SafeAreaView className="flex-1" edges={safeEdges} style={{ flex: 1 }}>
        {body}
      </SafeAreaView>
    </View>
  );
}

export function GlassPanel({ children, className = '', intensity = 28, tint }) {
  const { colors, isDark } = useTheme();
  return (
    <View
      className={`overflow-hidden rounded-3xl ${className}`}
      style={{ borderWidth: 1, borderColor: colors.border }}
    >
      <BlurView intensity={intensity} tint={tint || (isDark ? 'dark' : 'light')} style={StyleSheet.absoluteFill} />
      <View style={{ backgroundColor: isDark ? 'rgba(30,28,27,0.92)' : 'rgba(255,255,255,0.82)' }}>
        {children}
      </View>
    </View>
  );
}

export function GlassCard({ children, className = '', onPress, onLongPress, intensity = 28 }) {
  const inner = (
    <GlassPanel className={className} intensity={intensity}>
      <View className="p-4">{children}</View>
    </GlassPanel>
  );

  if (!onPress && !onLongPress) return inner;

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} onLongPress={onLongPress}>
      {inner}
    </TouchableOpacity>
  );
}
