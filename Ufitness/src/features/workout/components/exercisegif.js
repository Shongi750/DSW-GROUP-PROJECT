import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { colors } from '../constants/theme';

export default function ExerciseGif({ uri, frames, style, iconSize = 42 }) {
  const stills = (frames || []).filter(Boolean);
  const animated = stills.length > 1;
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!animated) return undefined;
    const timer = setInterval(() => setFrame((current) => (current + 1) % stills.length), 700);
    return () => clearInterval(timer);
  }, [animated, stills.length]);

  const source = animated ? stills[frame] : uri;

  if (!source) {
    return (
      <View style={[styles.fallback, style]}>
        <Ionicons name="body" size={iconSize} color={colors.accent} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: source }}
      style={[styles.gif, style]}
      contentFit="contain"
      transition={animated ? 250 : 0}
    />
  );
}

const styles = StyleSheet.create({
  gif: {
    width: '100%',
    height: 180,
    backgroundColor: '#111',
    borderRadius: 16,
  },
  fallback: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    backgroundColor: colors.lightCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
