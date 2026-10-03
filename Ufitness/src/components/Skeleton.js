import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { glass, radius, spacing } from '../context/ThemeContext';

function Bone({ width = '100%', height = 14, style }) {
  const opacity = useSharedValue(0.35);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 900 }), -1, true);
  }, [opacity]);
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        styles.bone,
        { width, height, borderRadius: radius.input },
        anim,
        style,
      ]}
    />
  );
}

/** Shared loading shimmer — use instead of blank flashes. */
export default function Skeleton({ rows = 3, style }) {
  return (
    <View style={[styles.wrap, style]}>
      {Array.from({ length: rows }, (_, i) => (
        <Bone key={i} width={i === rows - 1 ? '62%' : '100%'} height={i === 0 ? 18 : 14} />
      ))}
    </View>
  );
}

export function SkeletonCard({ style }) {
  return (
    <View style={[styles.card, style]}>
      <Bone width={48} height={48} style={{ borderRadius: 24, marginBottom: 12 }} />
      <Bone width="70%" height={16} />
      <Bone width="45%" height={12} style={{ marginTop: 8 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.screen,
    gap: 10,
  },
  bone: {
    backgroundColor: glass.fill,
  },
  card: {
    backgroundColor: glass.fill,
    borderColor: glass.border,
    borderWidth: glass.borderWidth,
    borderRadius: radius.card,
    padding: spacing.card,
    marginHorizontal: spacing.screen,
    marginBottom: spacing.gap,
  },
});
