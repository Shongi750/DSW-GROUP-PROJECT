import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useIsFocused } from '@react-navigation/native';
import { palettes, radius, spacing } from '../../context/ThemeContext';

// Shared login/register background: gym photos + dark overlay + frosted form card.
const AUTH_FRAMES = [
  require('../../../assets/auth/auth-1.png'),
  require('../../../assets/auth/auth-2.png'),
  require('../../../assets/auth/auth-3.png'),
];

const HOLD_MS = 9000;
const FADE_MS = 1200;

export const AUTH_ORANGE = palettes.dark.accent;
export const AUTH_ORANGE_BRIGHT = palettes.dark.accentBright;

// Login forms sit inside this — blur on phone, solid tint on web (blur is weak there).
export function GlassSheet({ children, style }) {
  const body = <View style={[styles.sheetInner, style]}>{children}</View>;
  if (Platform.OS === 'web') {
    return <View style={[styles.sheet, styles.sheetFallback]}>{body}</View>;
  }
  return (
    <BlurView intensity={48} tint="dark" style={styles.sheet}>
      {body}
    </BlurView>
  );
}

export default function AuthBackdrop({ children }) {
  const focused = useIsFocused();
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const indexRef = useRef(0);

  useEffect(function slideshowTimer() {
    if (!focused) {
      return undefined;
    }

    const tick = setInterval(function advanceFrame() {
      Animated.timing(fade, {
        toValue: 0,
        duration: FADE_MS / 2,
        useNativeDriver: true,
      }).start(function afterFadeOut(result) {
        if (!result.finished) {
          return;
        }
        indexRef.current = (indexRef.current + 1) % AUTH_FRAMES.length;
        setIndex(indexRef.current);
        Animated.timing(fade, {
          toValue: 1,
          duration: FADE_MS / 2,
          useNativeDriver: true,
        }).start();
      });
    }, HOLD_MS);

    return function cleanup() {
      clearInterval(tick);
    };
  }, [focused, fade]);

  const current = AUTH_FRAMES[index];
  const nextIndex = (index + 1) % AUTH_FRAMES.length;
  const next = AUTH_FRAMES[nextIndex];

  return (
    <View style={styles.root}>
      {/* Background stack: next image under current, then gradients so text stays readable */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image source={next} style={styles.frame} resizeMode="cover" />
        <Animated.Image
          source={current}
          style={[styles.frame, { opacity: fade }]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(10,10,10,0.25)', 'rgba(10,10,10,0.55)', 'rgba(10,10,10,0.92)']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['transparent', 'rgba(255,106,0,0.12)', 'rgba(10,10,10,0.85)']}
          locations={[0.35, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palettes.dark.background,
  },
  frame: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  sheet: {
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  sheetFallback: {
    backgroundColor: 'rgba(26,22,18,0.92)',
  },
  sheetInner: {
    paddingHorizontal: spacing.section,
    paddingTop: 22,
    paddingBottom: spacing.section,
    backgroundColor: 'rgba(14,10,8,0.22)',
  },
});
