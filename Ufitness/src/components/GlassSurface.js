import React from 'react';
import { StyleSheet, View } from 'react-native';
import { glass, radius } from '../context/ThemeContext';

/** Single glass surface — never nest GlassSurface inside GlassSurface. */
export default function GlassSurface({ children, style, soft = false }) {
  return (
    <View style={[soft ? styles.soft : styles.base, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: glass.fill,
    borderColor: glass.border,
    borderWidth: glass.borderWidth,
    borderRadius: radius.card,
  },
  soft: {
    backgroundColor: glass.softFill,
    borderColor: glass.softBorder,
    borderWidth: glass.borderWidth,
    borderRadius: radius.card,
  },
});
