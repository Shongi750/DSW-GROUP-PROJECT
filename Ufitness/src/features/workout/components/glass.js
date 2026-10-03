import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, spacing, radius } from '../../../context/ThemeContext';
import { useWorkoutLeave } from '../context/LeaveContext';
import InspoBackground from '../../../components/InspoBackground';

export function GlowBackground() {
  return <InspoBackground plate="workout" />;
}

export function GlassScreen({ children, edges, contentClassName = '', scroll = true }) {
  const { consumeTopInset } = useWorkoutLeave();
  const safeEdges = edges || (consumeTopInset ? [] : ['top']);
  const body = scroll ? (
    <ScrollView
      className="flex-1 bg-transparent"
      style={{ flex: 1, backgroundColor: 'transparent' }}
      contentContainerStyle={{
        paddingHorizontal: spacing.section,
        paddingTop: spacing.gap,
        paddingBottom: 40,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View className={contentClassName}>{children}</View>
    </ScrollView>
  ) : (
    <View
      className={`flex-1 bg-transparent px-5 pt-2 pb-8 ${contentClassName}`}
      style={{
        flex: 1,
        paddingHorizontal: spacing.section,
        paddingTop: spacing.gap,
        paddingBottom: 40,
        backgroundColor: 'transparent',
      }}
    >
      {children}
    </View>
  );

  return (
    <View className="flex-1 bg-background" style={{ flex: 1, backgroundColor: 'transparent' }}>
      <GlowBackground />
      <SafeAreaView className="flex-1" edges={safeEdges} style={{ flex: 1, backgroundColor: 'transparent' }}>
        {body}
      </SafeAreaView>
    </View>
  );
}

export function GlassPanel({ children, className = '', intensity = 22, tint }) {
  const { isDark } = useTheme();
  return (
    <View
      className={`overflow-hidden rounded-3xl ${className}`}
      style={{
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        borderRadius: radius.card,
        overflow: 'hidden',
      }}
    >
      <BlurView intensity={intensity} tint={tint || (isDark ? 'dark' : 'light')} style={StyleSheet.absoluteFill} />
      {/* Match Home frosted glass on photo */}
      <View style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
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
