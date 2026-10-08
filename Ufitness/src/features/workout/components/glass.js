import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { spacing, radius, useTheme } from '../../../context/ThemeContext';
import { useWorkoutLeave } from '../context/LeaveContext';
import InspoBackground from '../../../components/InspoBackground';

export function GlowBackground() {
  return <InspoBackground plate="workout" />;
}

// Wrapper used by almost every workout screen.
//
// scroll = true  → normal pages (home, finish, music…) — user can scroll to the bottom
// scroll = false → player only — fixed layout, no scroll
export function GlassScreen({ children, edges, contentClassName = '', scroll = true }) {
  const leave = useWorkoutLeave();

  // If the leave bar is showing, SafeArea already handled the top inset
  let safeEdges = ['top'];
  if (edges) {
    safeEdges = edges;
  } else if (leave.consumeTopInset) {
    safeEdges = [];
  }

  // leave room under the content so buttons aren't hidden by the tab bar
  const bottomPad = 100;

  let body;
  if (scroll) {
    body = (
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={{
          paddingHorizontal: spacing.section,
          paddingTop: spacing.gap,
          paddingBottom: bottomPad,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <View className={contentClassName}>{children}</View>
      </ScrollView>
    );
  } else {
    body = (
      <View
        className={contentClassName}
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
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <GlowBackground />
      <SafeAreaView edges={safeEdges} style={{ flex: 1, backgroundColor: 'transparent' }}>
        {body}
      </SafeAreaView>
    </View>
  );
}

// Frosted card background (blur + light glass colour)
export function GlassPanel({ children, className = '', intensity = 22, tint }) {
  const theme = useTheme();
  const blurTint = tint || (theme.isDark ? 'dark' : 'light');

  return (
    <View
      className={'overflow-hidden rounded-3xl ' + className}
      style={{
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        borderRadius: radius.card,
        overflow: 'hidden',
      }}
    >
      <BlurView intensity={intensity} tint={blurTint} style={StyleSheet.absoluteFill} />
      <View style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>{children}</View>
    </View>
  );
}

// Same as GlassPanel but tappable when onPress is passed in
export function GlassCard({ children, className = '', onPress, onLongPress, intensity = 28 }) {
  const inner = (
    <GlassPanel className={className} intensity={intensity}>
      <View className="p-4">{children}</View>
    </GlassPanel>
  );

  if (!onPress && !onLongPress) {
    return inner;
  }

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} onLongPress={onLongPress}>
      {inner}
    </TouchableOpacity>
  );
}
