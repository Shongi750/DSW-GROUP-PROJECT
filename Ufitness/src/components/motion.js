import React, { useEffect, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Press feedback: whole surface dips on a spring, releases on let-go. */
export function PressScale({ style, onPress, min = 0.965, ...rest }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <AnimatedPressable
      {...rest}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(min, { damping: 15, stiffness: 240 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 13, stiffness: 200 });
      }}
      style={[style, animStyle]}
    />
  );
}

/** rAF ease-out count-up; returns the raw animated number (round at call site). */
export function useCountUp(target, duration = 900) {
  const [display, setDisplay] = useState(0);
  const currentRef = useRef(0);
  useEffect(() => {
    const to = Number(target) || 0;
    const from = currentRef.current;
    if (from === to) {
      setDisplay(to);
      return undefined;
    }
    let raf;
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (to - from) * eased;
      currentRef.current = v;
      setDisplay(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return display;
}

/** Live indicator: breathing orange dot. */
export function PulseDot({ color, size = 6 }) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  useEffect(() => {
    const loop = (from, to) =>
      withRepeat(
        withSequence(
          withTiming(to, { duration: 900 }),
          withTiming(from, { duration: 900 })
        ),
        -1,
        false
      );
    opacity.value = loop(1, 0.3);
    scale.value = loop(1, 1.4);
  }, [opacity, scale]);
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        animStyle,
      ]}
    />
  );
}
