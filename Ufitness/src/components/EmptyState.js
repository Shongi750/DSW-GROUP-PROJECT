import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { type, spacing } from '../context/ThemeContext';

/** Quiet empty — one line, no illustration stack. */
export default function EmptyState({ title, copy, style }) {
  return (
    <View style={[styles.wrap, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {copy ? <Text style={styles.copy}>{copy}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.section,
    paddingHorizontal: spacing.screen,
    alignItems: 'center',
  },
  title: {
    fontSize: type.title,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  copy: {
    marginTop: 8,
    fontSize: type.body,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    maxWidth: 280,
  },
});
