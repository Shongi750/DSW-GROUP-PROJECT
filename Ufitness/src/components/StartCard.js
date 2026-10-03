import React, { useRef } from 'react';
import { Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

// Shared Nike/VA start card: photo + meta + orange START.
// Press scale gives the app a bit of life without noise.

export function StartCard({
  image,
  title,
  meta,
  onPress,
  width = 212,
  height = 228,
  badge,
  fullWidth = false,
}) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.97, friction: 7, tension: 160, useNativeDriver: true }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], marginRight: fullWidth ? 0 : 14, marginBottom: fullWidth ? 14 : 0 }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[
          styles.card,
          {
            width: fullWidth ? '100%' : width,
            height,
            backgroundColor: '#0A0A0A',
          },
        ]}
      >
        {image ? (
          <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.94)']}
          locations={[0.2, 0.55, 1]}
          style={styles.gradient}
        >
          {badge ? (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {meta ? (
            <Text style={styles.meta} numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
          <View style={[styles.startBtn, { backgroundColor: colors.accent }]}>
            <Text style={styles.startText}>Start</Text>
            <Ionicons name="play" size={12} color="#FFFFFF" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function StartCardRow({ children, contentStyle }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, contentStyle]}
    >
      {children}
    </ScrollView>
  );
}

export function MovePlayRow({ image, title, meta, onPress, onPlay, done }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.moveRow, { backgroundColor: colors.card }]}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.moveThumb} />
      ) : (
        <View style={[styles.moveThumb, { backgroundColor: 'rgba(255,106,0,0.16)', alignItems: 'center', justifyContent: 'center' }]}>
          <Ionicons name="barbell" size={20} color={colors.accent} />
        </View>
      )}
      <View style={styles.moveCopy}>
        <Text style={[styles.moveTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {meta ? (
          <Text style={[styles.moveMeta, { color: colors.muted }]} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {done ? <Ionicons name="checkmark-circle" size={20} color={colors.accent} style={{ marginRight: 8 }} /> : null}
      <TouchableOpacity
        onPress={onPlay || onPress}
        style={[styles.playCircle, { backgroundColor: colors.accent }]}
        hitSlop={8}
      >
        <Ionicons name="play" size={14} color="#FFFFFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export function OrangeStartBar({ title = 'Start', onPress, disabled }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      disabled={disabled}
      onPress={onPress}
      style={[styles.bar, { backgroundColor: colors.accent, opacity: disabled ? 0.5 : 1 }]}
    >
      <Text style={styles.barText}>{title}</Text>
      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontFamily: 'Anton_400Regular',
    fontSize: 20,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  meta: {
    color: '#D4D4D4',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 10,
    fontWeight: '600',
  },
  startBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  startText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  row: {
    paddingRight: 8,
    paddingBottom: 4,
  },
  moveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    padding: 12,
    marginBottom: 12,
  },
  moveThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  moveCopy: {
    flex: 1,
    marginHorizontal: 12,
  },
  moveTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  moveMeta: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
  },
  playCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  barText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
