import React from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

/** Short enter for tab roots — don't stack on every list row. */
export default function TabEnter({ children, style, delay = 0 }) {
  return (
    <Animated.View entering={FadeInDown.duration(380).delay(delay)} style={style}>
      {children}
    </Animated.View>
  );
}
