import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { hairline, useTheme } from '../context/ThemeContext';
import { useActiveSession } from '../context/ActiveSessionContext';
import { PressScale, PulseDot } from './motion';

function clock(startedAt, now) {
  const total = Math.max(0, Math.floor((now - startedAt) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function LiveSessionPill({ onPress }) {
  const { colors } = useTheme();
  const { session } = useActiveSession();
  const startedAt = session?.startedAt;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  if (!session) return null;

  const done = session.movesDone || 0;
  const total = session.movesTotal || 0;
  const live = session.state === 'Live';
  const badge = live ? colors.accent : colors.muted;
  const pct = total ? Math.min(1, done / total) : 0;

  return (
    <Animated.View
      style={styles.wrap}
      entering={FadeInDown.duration(360)}
      exiting={FadeOutDown.duration(200)}
    >
      <PressScale
        onPress={onPress}
        style={[
          styles.pill,
          {
            backgroundColor: colors.cardElevated,
            borderColor: hairline,
            shadowColor: colors.accent,
          },
        ]}
      >
        <View style={styles.badge}>
          <PulseDot color={badge} size={7} />
          <Text style={[styles.badgeText, { color: badge }]}>{session.state || 'LIVE'}</Text>
        </View>

        <Text style={[styles.time, { color: colors.text }]}>{clock(startedAt, now)}</Text>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.mid}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {session.currentMove || session.title}
          </Text>
          <Text style={[styles.sub, { color: colors.muted }]} numberOfLines={1}>
            {session.title} · Move {Math.min(done + 1, total || 1)} of {total || 1}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.accent} />

        <View style={[styles.track, { backgroundColor: 'rgba(255,255,255,0.10)' }]}>
          <View
            style={[
              styles.fill,
              { width: `${Math.max(pct * 100, total ? 8 : 0)}%`, backgroundColor: colors.accent },
            ]}
          />
        </View>
      </PressScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 92,
    zIndex: 30,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 15,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  time: {
    fontFamily: 'Anton_400Regular',
    fontSize: 20,
    letterSpacing: 0.6,
    minWidth: 54,
  },
  divider: {
    width: 1,
    height: 26,
  },
  mid: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: 'Anton_400Regular',
    fontSize: 14,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sub: {
    marginTop: 2,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  track: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 6,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: 3,
    borderRadius: 2,
  },
});
