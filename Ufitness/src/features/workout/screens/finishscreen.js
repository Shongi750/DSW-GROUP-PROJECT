import React, { useEffect, useRef, useState } from 'react';
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassScreen } from '../components/glass';
import PrimaryButton from '../components/button';
import WeekPulse from '../components/weekpulse';
import { loadWeekPulse } from '../lib/weekPulse';
import { shareWorkoutToCommunity } from '../lib/shareWorkout';
import { useCountUp } from '../../../components/motion';
import { useTheme, type } from '../../../context/ThemeContext';
import { useApp as useMainApp } from '../../../context/AppContext';
import { useApp as useWorkoutApp } from '../context/AppContext';
import { hapticSuccess } from '../../../lib/haptics';
import { planAdaptationMessage } from '../data/planAdaptation';
import { syncAchievements } from '../../../lib/achievements';
import BadgeStrip from '../../../components/BadgeStrip';

const SPARK_COLORS = ['#FF6A00', '#FF8A1A', '#FFFFFF', '#FFB25C'];
const BARCODE = [2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2, 1];

function Spark({ index, total }) {
  const spark = useRef(null);
  if (!spark.current) {
    const angle = (index / total) * Math.PI * 2 + (Math.random() - 0.5) * 0.55;
    const dist = 58 + Math.random() * 46;
    spark.current = {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      delay: 80 + Math.random() * 160,
      size: 2.5 + Math.random() * 4,
      ray: Math.random() > 0.45,
      rot: (angle * 180) / Math.PI,
      color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
    };
  }
  const s = spark.current;
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    const fly = { duration: 760, easing: Easing.out(Easing.cubic) };
    x.value = withDelay(s.delay, withTiming(s.dx, fly));
    y.value = withDelay(s.delay, withTiming(s.dy, fly));
    opacity.value = withDelay(
      s.delay,
      withSequence(withTiming(1, { duration: 60 }), withTiming(0, { duration: 700, easing: Easing.in(Easing.quad) }))
    );
    scale.value = withDelay(s.delay, withTiming(1, { duration: 760, easing: Easing.out(Easing.back(2)) }));
  }, [x, y, opacity, scale, s.delay, s.dx, s.dy]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { rotate: `${s.rot}deg` }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const base = s.ray
    ? { left: -6, top: -1, width: 12 + s.size, height: 2.5, borderRadius: 1.5 }
    : { left: -s.size / 2, top: -s.size / 2, width: s.size, height: s.size, borderRadius: s.size / 2 };

  return <Animated.View style={[styles.spark, base, { backgroundColor: s.color }, animStyle]} />;
}

function SparkBurst({ count = 16 }) {
  return (
    <View style={styles.burst} pointerEvents="none">
      {Array.from({ length: count }, (_, i) => (
        <Spark key={i} index={i} total={count} />
      ))}
    </View>
  );
}

function StreakFlame({ color }) {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withDelay(
      700,
      withSequence(
        withSpring(1, { damping: 9, stiffness: 170 }),
        withRepeat(withSequence(withTiming(1.16, { duration: 620 }), withTiming(1, { duration: 620 })), -1, false)
      )
    );
  }, [scale]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animStyle}>
      <Ionicons name="flame" size={18} color={color} />
    </Animated.View>
  );
}

function Stat({ value, label, colors, accent, flame }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statValueRow}>
        {flame ? <StreakFlame color={colors.accent} /> : null}
        <Text style={[styles.statValue, { color: accent ? colors.accent : colors.text }]}>{value}</Text>
      </View>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

export default function FinishScreen({ navigation, route }) {
  const { colors } = useTheme();
  const main = useMainApp();
  const workout = useWorkoutApp();
  const author = main?.profile?.name || workout?.profile?.name || 'You';
  const minutes = route.params?.minutes || 1;
  const moves = route.params?.moves || 0;
  const title = route.params?.title || 'Workout complete';
  const [pulse, setPulse] = useState({ streak: 0, week: [] });
  const [posted, setPosted] = useState(false);
  const [adaptation, setAdaptation] = useState(null);
  const [badges, setBadges] = useState([]);
  const [freshBadge, setFreshBadge] = useState(null);
  const contentScale = useSharedValue(0.86);
  const contentOpacity = useSharedValue(0);
  const minutesCount = useCountUp(minutes, 1100);
  const movesCount = useCountUp(moves, 1100);
  const streakCount = useCountUp(pulse.streak, 1100);

  const now = new Date();
  const dateStamp = `${now
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase()} · ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  useEffect(() => {
    hapticSuccess();
    loadWeekPulse().then(async (next) => {
      setPulse(next);
      const history = workout?.profile?.history || [];
      setAdaptation(planAdaptationMessage(history));
      const result = await syncAchievements({
        history,
        weekDone: next.week?.filter((d) => d.done)?.length || 0,
        weekTotal: workout?.profile?.daysPerWeek || 4,
      });
      setBadges(result.badges);
      if (result.freshly?.[0]) setFreshBadge(result.freshly[0]);
    });
    contentScale.value = withSpring(1, { damping: 14, stiffness: 150 });
    contentOpacity.value = withTiming(1, { duration: 420 });
  }, []);

  const entrance = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  const shareText = `Crushed a ${minutes}-min session on UFitness — ${moves} moves${
    pulse.streak > 0 ? `, ${pulse.streak}-day streak` : ''
  }. #UFitness #UJ`;

  const onShare = async () => {
    try {
      await Share.share({ message: shareText });
    } catch {
      // cancelled
    }
  };

  const onPostCampus = async () => {
    try {
      await shareWorkoutToCommunity({
        author,
        title,
        minutes,
        moves,
        streak: pulse.streak,
      });
      setPosted(true);
      Alert.alert('Posted', 'Your session is on the Campus feed.');
    } catch (error) {
      Alert.alert('Could not post', error?.message || 'Try again.');
    }
  };

  const goDone = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Main');
  };

  return (
    <GlassScreen scroll={false} contentClassName="flex-1">
      <Animated.View style={[{ flex: 1 }, entrance]}>
        <View style={styles.hero}>
          <LinearGradient
            colors={['rgba(255,106,0,0.28)', 'rgba(255,106,0,0.06)', 'transparent']}
            style={styles.glow}
          />
          <View style={styles.badgeWrap}>
            <SparkBurst />
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Ionicons name="checkmark" size={32} color="#FFFFFF" />
            </View>
          </View>
          <Text style={[styles.kicker, { color: colors.accentBright || colors.accent }]}>Session complete</Text>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.sub, { color: colors.muted }]}>
            {pulse.streak > 0
              ? `${pulse.streak}-day streak. Keep showing up.`
              : 'Session logged. Your week just got stronger.'}
          </Text>
          <Text style={[styles.tip, { color: colors.muted }]}>
            Next tip: protein within an hour — campus cafeteria or a shake works.
          </Text>
          {freshBadge ? (
            <Text style={[styles.freshBadge, { color: colors.accent }]}>
              Milestone unlocked · {freshBadge.title}
            </Text>
          ) : null}
          {adaptation ? (
            <View style={[styles.adaptCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.adaptKicker, { color: colors.accent }]}>
                {adaptation.kicker.toUpperCase()}
              </Text>
              <Text style={[styles.adaptTitle, { color: colors.text }]}>{adaptation.title}</Text>
              <Text style={[styles.adaptBody, { color: colors.muted }]}>{adaptation.body}</Text>
            </View>
          ) : null}
        </View>

        <View
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          entering={FadeInDown.delay(160).duration(420)}
        >
          <View style={styles.cardHead}>
            <Text style={[styles.cardBrand, { color: colors.accent }]}>UFITNESS</Text>
            <Text style={[styles.cardDate, { color: colors.muted }]}>{dateStamp}</Text>
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.statsRow}>
            <Stat value={`${Math.round(minutesCount)}`} label="min" colors={colors} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Stat value={`${Math.round(movesCount)}`} label="moves" colors={colors} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Stat
              value={pulse.streak > 0 ? `${Math.round(streakCount)}` : '—'}
              label="streak"
              colors={colors}
              accent={pulse.streak > 0}
              flame={pulse.streak > 0}
            />
          </View>
          <View style={[styles.barcodeRow, { opacity: 0.9 }]}>
            {BARCODE.map((w, i) => (
              <View key={i} style={[styles.bar, { width: w, backgroundColor: colors.text }]} />
            ))}
          </View>
          <Text style={[styles.cardFoot, { color: colors.muted }]}>UJ CAMPUS EDITION</Text>
        </View>

        <View style={{ marginTop: 18 }} entering={FadeInDown.delay(300).duration(420)}>
          <WeekPulse week={pulse.week} streak={pulse.streak} />
          <BadgeStrip badges={badges} title="Milestones" />
        </View>

        <View style={styles.actions} entering={FadeInDown.delay(420).duration(420)}>
          <PrimaryButton title="Share activity" icon="share-outline" onPress={onShare} />
          <TouchableOpacity
            onPress={onPostCampus}
            disabled={posted}
            style={[
              styles.campusBtn,
              {
                borderColor: colors.accent,
                opacity: posted ? 0.55 : 1,
              },
            ]}
          >
            <Ionicons name={posted ? 'checkmark-circle' : 'people-outline'} size={18} color={colors.accent} />
            <Text style={[styles.campusText, { color: colors.accent }]}>
              {posted ? 'Posted to campus' : 'Post to campus'}
            </Text>
          </TouchableOpacity>
          <PrimaryButton
            title="More workouts"
            icon="barbell"
            onPress={() => navigation.navigate('Main', { screen: 'Workouts' })}
          />
          <TouchableOpacity onPress={goDone} style={styles.doneLink}>
            <Text style={[styles.doneText, { color: colors.muted }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </GlassScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: 12,
    marginBottom: 8,
  },
  glow: {
    position: 'absolute',
    top: -20,
    left: 40,
    right: 40,
    height: 160,
    borderRadius: 80,
  },
  badgeWrap: {
    width: 72,
    height: 72,
    marginBottom: 16,
  },
  burst: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 0,
    height: 0,
    zIndex: 6,
  },
  spark: {
    position: 'absolute',
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6A00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  title: {
    fontFamily: 'Anton_400Regular',
    fontSize: 34,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  sub: {
    marginTop: 8,
    fontSize: type.body,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  tip: {
    marginTop: 14,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 28,
    lineHeight: 18,
    fontStyle: 'italic',
    opacity: 0.85,
  },
  freshBadge: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  adaptCard: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 6,
    padding: 14,
    width: '100%',
  },
  adaptKicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  adaptTitle: {
    marginTop: 6,
    fontSize: 17,
    fontWeight: '800',
  },
  adaptBody: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    marginTop: 20,
    borderRadius: 6,
    borderWidth: 1,
    padding: 18,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBrand: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  cardDate: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  divider: {
    width: 1,
    height: 36,
  },
  barcodeRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  bar: {
    height: 22,
  },
  cardFoot: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  actions: {
    marginTop: 'auto',
    gap: 10,
    paddingBottom: 12,
  },
  campusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 6,
    paddingVertical: 14,
  },
  campusText: {
    fontSize: 15,
    fontWeight: '800',
  },
  doneLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  doneText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
