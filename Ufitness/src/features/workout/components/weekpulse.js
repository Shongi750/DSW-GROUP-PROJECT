import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useCountUp } from '../../../components/motion';

// Seven day dots. Filled = trained that day.
// onPhoto: force glass-on-dark look (Home is photo in light and dark).
export default function WeekPulse({
  week = [],
  streak = 0,
  onPhoto = false,
  onPress,
  weekDone,
  weekTotal,
  showChevron = false,
}) {
  const { colors, isDark } = useTheme();
  const days = week.length
    ? week
    : [
        { weekday: 'S' },
        { weekday: 'M' },
        { weekday: 'T' },
        { weekday: 'W' },
        { weekday: 'T' },
        { weekday: 'F' },
        { weekday: 'S' },
      ];

  const photo = onPhoto || isDark;
  const text = photo ? '#FFFFFF' : colors.text;
  const muted = photo ? '#C9C9C9' : colors.muted;
  const cardBg = photo ? '#141414' : colors.card;
  const border = photo ? 'rgba(255,255,255,0.10)' : colors.border;
  const done = weekDone != null ? weekDone : days.filter((d) => (d.sessions || 0) > 0 || (d.minutes || 0) > 0).length;
  const total = weekTotal != null ? weekTotal : Math.max(done, 4);
  const pct = Math.round((Math.min(done, total) / Math.max(total, 1)) * 100);

  const draw = useSharedValue(0);
  useEffect(() => {
    draw.value = withTiming(Math.min(100, pct), {
      duration: 1100,
      easing: Easing.out(Easing.cubic),
    });
  }, [pct]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${draw.value}%` }));
  const pctCount = Math.round(useCountUp(pct, 1100));

  const body = (
    <>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: text }]}>This week</Text>
          {weekDone != null || weekTotal != null ? (
            <Text style={[styles.sub, { color: muted }]}>
              {done} of {total} sessions · {pctCount}%
            </Text>
          ) : null}
        </View>
        <View style={styles.right}>
          <Text style={[styles.streak, { color: colors.accent }]}>
            {streak > 0 ? `${streak} day streak` : 'Start a streak'}
          </Text>
          {showChevron || onPress ? (
            <Ionicons name="chevron-forward" size={16} color={muted} style={{ marginLeft: 6 }} />
          ) : null}
        </View>
      </View>
      <View style={styles.row}>
        {days.map((day, index) => {
          const on = (day.sessions || 0) > 0 || (day.minutes || 0) > 0;
          const label = (day.weekday || day.label || '?').toString().slice(0, 1).toUpperCase();
          return (
            <View key={`${label}-${index}`} style={styles.day}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: on ? colors.accent : 'transparent',
                    borderColor: on ? colors.accent : border,
                  },
                ]}
              />
              <Text style={[styles.dayLabel, { color: muted }]}>{label}</Text>
            </View>
          );
        })}
      </View>
      {(weekDone != null || weekTotal != null) && (
        <View style={[styles.track, { backgroundColor: photo ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)' }]}>
          <Animated.View
            style={[
              styles.fill,
              { backgroundColor: colors.accent },
              fillStyle,
            ]}
          />
        </View>
      )}
    </>
  );

  const wrapStyle = [
    styles.wrap,
    {
      backgroundColor: cardBg,
      borderColor: border,
      borderWidth: 1,
    },
  ];

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={wrapStyle}>
        {body}
      </TouchableOpacity>
    );
  }

  return <View style={wrapStyle}>{body}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 22,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Anton_400Regular',
    fontSize: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sub: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streak: {
    fontSize: 13,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  track: {
    height: 5,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 14,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
