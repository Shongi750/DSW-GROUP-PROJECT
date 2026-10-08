import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PressScale, PulseDot, useCountUp } from '../../components/motion';
import { gymStatus, liveFeed } from '../../features/campus/livePulse';
import {
  checkInCounts as loadCheckInCounts,
  tryGymCheckIn,
} from '../../features/campus/gymCheckIn';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { useTheme, spacing, radius, display } from '../../context/ThemeContext';
import PhotoShell, { PHOTO_GLASS } from '../../components/PhotoShell';
import SafeImage from '../../components/SafeImage';
import { loadEatenToday, logEatenMeal } from '../../features/meals/lib/eaten';
import { loadSavedPlan } from '../../features/meals/lib/persist';
import { fallbackSaStaples } from '../../features/meals/lib/saFoodApi';
import { buildTodayMealSummary } from '../../features/meals/lib/todaySummary';
import { loadTodayWorkoutSummary } from '../../features/workout/lib/todaySummary';
import { loadWeekPulse } from '../../features/workout/lib/weekPulse';
import WeekPulse from '../../features/workout/components/weekpulse';
import { queueWorkoutAction } from '../../features/workout/lib/pendingStart';
import { listWorkouts, imageForWorkout } from '../../features/workout/data/readyWorkouts';
import { StartCard, StartCardRow } from '../../components/StartCard';
import { promptDueReminders, showNotificationsSheet } from '../../lib/reminders';

// Home / Dashboard
// Sections (top → bottom):
// 1. Greeting + today workout card
// 2. Week pulse / upcoming strip
// 3. Budget + kcal stats
// 4. Quick-start ready workouts
// 5. Today’s meal suggestion
// 6. Campus pulse + gym check-in (fixed pins, not tracking)
//
// Starting a workout writes a small “pending action” to AsyncStorage,
// then we switch to the Workout tab — Workout Home reads it and opens PreStart.
import { openNested, openTab } from '../../navigation/nav';
import { DEFAULT_AVATAR } from '../../data/profileAvatars';
import { personName } from '../../lib/ujEmail';
import { hapticMedium } from '../../lib/haptics';
import { getMatchedBuddies } from '../../features/buddies/services/buddyService';
import { syncAchievements } from '../../lib/achievements';
import { planAdaptationMessage } from '../../features/workout/data/planAdaptation';
import SyncStatus from '../../components/SyncStatus';

/*
 * Home tab — one screen so judges see meals + workout + campus in one place.
 * Top bar → hero workout → week streak → budget stats → quick workouts → meal → gym pulse.
 */

const HERO_IMAGE = require('../../../assets/images/hero-strength.png');
const MEAL_FALLBACK =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80';

function formatHeroDate(date) {
  const d = date || new Date();
  return d
    .toLocaleDateString('en-GB', { weekday: 'long', month: 'short', day: 'numeric' })
    .toUpperCase();
}

function upcomingWorkoutLine(todayWorkout, workoutTitle) {
  if (!todayWorkout) {
    return 'Rest day · recovery';
  }
  if (todayWorkout.type === 'train') {
    return 'Workout · ' + workoutTitle;
  }
  if (todayWorkout.type === 'done') {
    return 'Workout done for today';
  }
  return 'Rest day · recovery';
}

function countWeekDaysWithActivity(week) {
  let count = 0;
  const days = week || [];
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const sessions = day.sessions || 0;
    const minutes = day.minutes || 0;
    if (sessions > 0 || minutes > 0) {
      count = count + 1;
    }
  }
  return count;
}

export default function DashboardScreen({ navigation }) {
  const { profile, user } = useApp();
  const { colors } = useTheme();
  const firstName = (personName(profile.name) || 'there').split(' ')[0];
  const [todayMeal, setTodayMeal] = useState(null);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [eaten, setEaten] = useState({ items: [], kcal: 0, protein: 0 });
  const [pulse, setPulse] = useState({ streak: 0, week: [] });
  const [now, setNow] = useState(() => new Date());
  const [buddyName, setBuddyName] = useState('');
  const [adaptation, setAdaptation] = useState(null);
  const [milestoneCount, setMilestoneCount] = useState(0);
  // fresh gym check-ins (last hour) bump the Campus pulse %
  const [checkCounts, setCheckCounts] = useState({});
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkMsg, setCheckMsg] = useState('');

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const scrollY = useSharedValue(0);
  const breathe = useSharedValue(1);
  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.07, { duration: 9000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: Math.min(scrollY.value * 0.28, 70) },
      { scale: breathe.value },
    ],
  }));

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      async function refreshHome() {
        const saved = await loadSavedPlan();
        const mealSummary = buildTodayMealSummary({
          saved,
          catalog: fallbackSaStaples(),
          monthlyBudget: profile.foodBudgetAmount,
          fundingType: profile.fundingType,
          dietFilters: profile.dietFilters,
        });
        const workoutSummary = await loadTodayWorkoutSummary();
        const userId = user && user.id;
        const eatenToday = await loadEatenToday(userId);
        const weekPulse = await loadWeekPulse();
        const counts = await loadCheckInCounts(Date.now());

        let buddies = [];
        if (userId) {
          try {
            buddies = await getMatchedBuddies(userId);
          } catch (err) {
            buddies = [];
          }
        }

        const history =
          workoutSummary && workoutSummary.history ? workoutSummary.history : [];
        let weekDone = 0;
        const pulseWeek = weekPulse && weekPulse.week ? weekPulse.week : [];
        for (let i = 0; i < pulseWeek.length; i++) {
          if (pulseWeek[i].done) {
            weekDone = weekDone + 1;
          }
        }
        const weekTotal = profile.daysPerWeek || 4;
        const ach = await syncAchievements({ history, weekDone, weekTotal });

        if (!alive) {
          return;
        }

        setTodayMeal(mealSummary);
        setTodayWorkout(workoutSummary);
        setEaten(eatenToday);
        setPulse(weekPulse);
        setCheckCounts(counts);

        const firstBuddy = buddies[0];
        setBuddyName(firstBuddy && firstBuddy.name ? firstBuddy.name : '');

        setAdaptation(planAdaptationMessage(history));

        let badgesEarned = 0;
        for (let j = 0; j < ach.badges.length; j++) {
          const b = ach.badges[j];
          if (b.earned || b.unlockedAt) {
            badgesEarned = badgesEarned + 1;
          }
        }
        setMilestoneCount(badgesEarned);
        promptDueReminders();
      }

      refreshHome();

      return function cleanup() {
        alive = false;
      };
    }, [
      profile.foodBudgetAmount,
      profile.fundingType,
      profile.dietFilters,
      profile.daysPerWeek,
      user && user.id,
    ])
  );

  const calories = eaten.kcal;
  const activeMin =
    todayWorkout && todayWorkout.minutes != null ? todayWorkout.minutes : 0;
  const loggedMeal = eaten.items[eaten.items.length - 1];
  const featured =
    loggedMeal || (todayMeal && todayMeal.featured ? todayMeal.featured : null);
  const workoutTitle =
    todayWorkout && todayWorkout.title ? todayWorkout.title : "Today's session";
  const workoutMeta =
    todayWorkout && todayWorkout.meta ? todayWorkout.meta : 'Not started';
  const workoutBadge =
    todayWorkout && todayWorkout.badge ? todayWorkout.badge : 'STRENGTH';
  const mealTag = loggedMeal ? 'LOGGED' : 'SUGGESTED';
  const mealTitle = featured?.title || 'No meal logged yet';
  const mealKcal = featured?.kcal ?? 0;
  const mealProtein = featured?.protein ?? 0;
  const mealImage = featured?.image || MEAL_FALLBACK;

  const readyStrip = listWorkouts('', 'all').slice(0, 3);
  const foodLeft = profile.foodBudgetRemaining ?? null;
  const budgetCount = useCountUp(foodLeft ?? 0);
  const kcalCount = useCountUp(calories);
  const minCount = useCountUp(activeMin);
  const gyms = gymStatus(now, checkCounts);
  const feed = liveFeed(now);

  async function startWorkout() {
    hapticMedium();
    if (todayWorkout && todayWorkout.type === 'train') {
      await queueWorkoutAction({ startToday: true });
    }
    openTab(navigation, 'Workout');
  }

  // GPS near a fixed UJ gym pin → check-in. Web / denied → campus preference.
  async function onGymCheckIn() {
    if (checkingIn) return;
    setCheckingIn(true);
    hapticMedium();
    try {
      const result = await tryGymCheckIn({
        campusPreference: profile.campus || 'APK',
        allowManual: true,
      });
      if (result && result.ok) {
        const counts = await loadCheckInCounts(Date.now());
        setCheckCounts(counts);
        setCheckMsg(result.message || 'Checked in.');
        Alert.alert('Gym check-in', result.message || 'Checked in.');
      } else {
        const msg =
          (result && result.message) || 'Could not check in right now.';
        setCheckMsg(msg);
        Alert.alert('Gym check-in', msg);
      }
    } catch (err) {
      Alert.alert('Gym check-in', 'Something went wrong. Try again.');
    }
    setCheckingIn(false);
  }

  async function startReadyFromHome(workout) {
    hapticMedium();
    const moveCount =
      workout.exerciseIds && workout.exerciseIds.length
        ? workout.exerciseIds.length
        : 0;
    await queueWorkoutAction({
      preStart: true,
      title: workout.name,
      minutes: workout.minutes,
      level: workout.level,
      focus: workout.focus,
      moves: moveCount,
      exerciseIds: workout.exerciseIds,
      programId: workout.id,
      workoutId: workout.id,
      group: workout.group,
      image: imageForWorkout(workout),
    });
    openTab(navigation, 'Workout');
  }

  async function openProgress() {
    await queueWorkoutAction({ openInsights: true });
    openTab(navigation, 'Workout');
  }

  const weekDoneCount = countWeekDaysWithActivity(pulse.week);
  const weekTarget = profile.daysPerWeek || 4;

  async function logSuggestedMeal() {
    const suggestion = todayMeal && todayMeal.featured ? todayMeal.featured : null;
    if (!suggestion) {
      return;
    }
    const userId = user && user.id;
    const next = await logEatenMeal(userId, {
      id: todayMeal.dayId + '-' + suggestion.title,
      title: suggestion.title,
      kcal: suggestion.kcal,
      protein: suggestion.protein,
    });
    setEaten(next);
  }

  const glass = PHOTO_GLASS;
  const fg = '#FFFFFF';
  const soft = '#C9C9C9';

  return (
    <PhotoShell plate="home">
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <Animated.ScrollView
          style={[styles.scroll, { backgroundColor: 'transparent' }]}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.section }]}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          <View style={styles.topBar}>
            {/* same width as the two icons on the right, so UFITNESS stays centred */}
            <TouchableOpacity onPress={() => openTab(navigation, 'Profile')} style={{ width: 76 }}>
              <Image
                source={{ uri: profile.avatarUrl || DEFAULT_AVATAR }}
                style={[styles.avatarImage, { borderColor: 'rgba(255,255,255,0.25)' }]}
              />
            </TouchableOpacity>
            <View style={styles.brandRow}>
              <Text style={[styles.brandName, { color: fg }]}>U</Text>
              <Text style={[styles.brandName, { color: colors.accent }]}>FITNESS</Text>
            </View>
            <View style={styles.headerIcons}>
              {/* Downloads for offline use (lives under Profile → Downloads) */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.notificationBtn}
                onPress={() => openNested(navigation, ['Profile', 'Downloads'])}
                accessibilityLabel="Downloads"
              >
                <Ionicons name="download-outline" size={22} color={fg} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={styles.notificationBtn} onPress={showNotificationsSheet}>
                <Ionicons name="notifications-outline" size={22} color={fg} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Where your data is saved: Synced / Saving… / phone only / cloud not set up */}
          <SyncStatus style={{ marginBottom: 10 }} />

          <Animated.View entering={FadeInDown.duration(480)}>
            <Text style={[styles.dateText, { color: soft }]}>{formatHeroDate()}</Text>
            <Text style={[styles.headlineText, { color: fg }]}>
              {firstName}, today at UJ.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(90).duration(560)}>
            <PressScale style={styles.workoutCard} onPress={startWorkout}>
            <Animated.Image
              source={HERO_IMAGE}
              style={[styles.workoutImage, heroStyle]}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(10,10,10,0.72)', 'rgba(0,0,0,0)']}
              locations={[0, 0.42]}
              style={styles.heroTopScrim}
              pointerEvents="none"
            />
            <View style={[styles.workoutBadge, { backgroundColor: 'rgba(10,10,10,0.72)' }]}>
              <View style={[styles.orangeDot, { backgroundColor: colors.accent }]} />
              <Text style={styles.workoutBadgeText}>{workoutBadge}</Text>
            </View>
            <Text style={styles.heroToday}>TODAY</Text>
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)', 'rgba(10,10,10,0.98)']}
              locations={[0, 0.45, 1]}
              style={styles.workoutOverlay}
            >
              <View style={styles.workoutOverlayText}>
                <Text style={styles.workoutTitle} numberOfLines={1}>
                  {workoutTitle}
                </Text>
                <Text style={styles.workoutMetaText}>{workoutMeta}</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.startBtn, { backgroundColor: colors.accent, shadowColor: colors.accent }]}
                onPress={startWorkout}
              >
                <Text style={styles.startBtnText}>START</Text>
                <Ionicons name="caret-forward" size={12} color="#0A0A0A" style={{ marginLeft: 3 }} />
              </TouchableOpacity>
            </LinearGradient>
            </PressScale>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(170).duration(560)}>
            <WeekPulse
              week={pulse.week}
              streak={pulse.streak}
              onPhoto
              onPress={openProgress}
              weekDone={weekDoneCount}
              weekTotal={weekTarget}
              showChevron
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(520)} style={[styles.upcoming, glass]}>
            <Text style={[styles.upcomingKicker, { color: colors.accent }]}>UPCOMING</Text>
            <Text style={[styles.upcomingLine, { color: fg }]}>
              {upcomingWorkoutLine(todayWorkout, workoutTitle)}
            </Text>
            <Text style={[styles.upcomingSub, { color: soft }]}>
              Meals · {foodLeft != null ? `R${Math.round(foodLeft)} left this week` : 'Open plan'}
              {buddyName ? `  ·  Buddy · ${buddyName}` : ''}
              {milestoneCount ? `  ·  ${milestoneCount} milestones` : ''}
            </Text>
            {adaptation ? (
              <Text style={[styles.upcomingAdapt, { color: soft }]} numberOfLines={2}>
                {adaptation.kicker}: {adaptation.title}
              </Text>
            ) : null}
          </Animated.View>

          <Animated.View style={styles.statStrip} entering={FadeInDown.delay(240).duration(520)}>
            <PressScale
              onPress={() => openTab(navigation, 'Meals')}
              style={styles.statCell}
            >
              <Text style={[styles.statValue, { color: fg }]}>
                {foodLeft != null ? `R${Math.round(budgetCount)}` : '—'}
              </Text>
              <Text style={[styles.statUnit, { color: soft }]}>BUDGET LEFT</Text>
            </PressScale>
            <View style={[styles.statCell, styles.statDivider]}>
              <Text style={[styles.statValue, { color: fg }]}>{Math.round(kcalCount)}</Text>
              <Text style={[styles.statUnit, { color: soft }]}>KCAL</Text>
            </View>
            <PressScale
              onPress={openProgress}
              style={[styles.statCell, styles.statDivider]}
            >
              <Text style={[styles.statValue, { color: fg }]}>{Math.round(minCount)}</Text>
              <Text style={[styles.statUnit, { color: soft }]}>MIN</Text>
            </PressScale>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(310).duration(520)}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: fg }]}>Quick start</Text>
              <TouchableOpacity onPress={() => openTab(navigation, 'Workout')}>
                <Text style={[styles.sectionAction, { color: colors.accent }]}>SEE ALL</Text>
              </TouchableOpacity>
            </View>
            <StartCardRow contentStyle={{ paddingBottom: 4 }}>
              {readyStrip.map((workout) => (
                <StartCard
                  key={workout.id}
                  image={imageForWorkout(workout)}
                  title={workout.name}
                  meta={`${workout.minutes} min · ${workout.level}`}
                  onPress={() => startReadyFromHome(workout)}
                />
              ))}
            </StartCardRow>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(380).duration(520)}>
            <PressScale
              style={[styles.mealCard, glass]}
              onPress={() => openTab(navigation, 'Meals')}
            >
            <SafeImage uri={mealImage} fallback={MEAL_FALLBACK} style={styles.mealImage} />
            <View style={styles.mealDetails}>
              <Text style={[styles.mealCategoryTag, { color: colors.accent }]}>{mealTag}</Text>
              <Text style={[styles.mealTitle, { color: fg }]} numberOfLines={1}>
                {mealTitle}
              </Text>
              <Text style={[styles.mealStatText, { color: soft }]}>
                {mealKcal} kcal · {mealProtein}g protein
              </Text>
              {loggedMeal ? null : (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.logMealBtn, { borderColor: colors.accent }]}
                  onPress={logSuggestedMeal}
                >
                  <Text style={[styles.logMealBtnText, { color: colors.accent }]}>I ate this</Text>
                </TouchableOpacity>
              )}
            </View>
            </PressScale>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(420).duration(520)} style={[styles.pulseCard, glass]}>
            <View style={styles.pulseHeader}>
              <PulseDot color={colors.accent} size={7} />
              <Text style={[styles.pulseTitle, { color: fg }]}>Campus pulse</Text>
              <View style={{ flex: 1 }} />
              <Text style={[styles.pulseLive, { color: colors.accent }]}>LIVE</Text>
            </View>
            <View style={styles.pulseRow}>
              {gyms.map((gym, i) => (
                <View key={gym.id} style={[styles.pulseCell, i > 0 ? styles.statDivider : null]}>
                  <Text style={[styles.statValue, { color: fg, fontSize: 22, lineHeight: 24 }]}>
                    {gym.occupancy}%
                  </Text>
                  <Text style={[styles.pulseGym, { color: soft }]}>{gym.short}</Text>
                  <Text
                    style={[
                      styles.pulseLevel,
                      { color: gym.level === 'CHILL' ? soft : colors.accent },
                    ]}
                  >
                    {gym.level}
                  </Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.checkInBtn, { borderColor: colors.accent }]}
              onPress={onGymCheckIn}
              disabled={checkingIn}
              activeOpacity={0.85}
            >
              <Ionicons
                name="location-outline"
                size={16}
                color={colors.accent}
              />
              <Text style={[styles.checkInBtnText, { color: colors.accent }]}>
                {checkingIn ? 'Checking in…' : 'Check in at gym'}
              </Text>
            </TouchableOpacity>
            {checkMsg ? (
              <Text style={[styles.checkInMsg, { color: soft }]}>{checkMsg}</Text>
            ) : null}
            <View style={styles.pulseFeed}>
              {gyms.every((gym) => gym.occupancy < 25) ? (
                <Text style={[styles.pulseQuiet, { color: colors.accent }]}>
                  Gyms quiet now · peaks 17:00–19:00
                </Text>
              ) : null}
              <Text style={[styles.pulseFeedText, { color: soft }]}>
                <Text style={{ color: fg, fontWeight: '800' }}>{feed[0].name}</Text>
                {' '}
                {feed[0].action} · {feed[0].minutesAgo}m ago
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(450).duration(520)}>
            <PressScale
              style={[styles.campusCta, glass]}
              onPress={() => openTab(navigation, 'Community')}
            >
            <View style={styles.campusIconCircle}>
              <FontAwesome5 name="users" size={16} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.campusTitle, { color: fg }]}>Campus community</Text>
              <Text style={[styles.campusSub, { color: soft }]}>Groups, buddies, gym status</Text>
            </View>
              <Ionicons name="chevron-forward" size={18} color={soft} />
            </PressScale>
          </Animated.View>
        </Animated.ScrollView>
      </SafeAreaView>
    </PhotoShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flex: 1,
    minHeight: 0,
    ...(Platform.OS === 'web' ? { overflowY: 'scroll', overflowX: 'hidden' } : null),
  },
  scrollContent: {
    paddingHorizontal: spacing.section,
    paddingTop: spacing.card,
    paddingBottom: 110,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
  },
  brandRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    ...display,
    fontSize: 22,
    letterSpacing: 1.2,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  headlineText: {
    ...display,
    fontSize: 42,
    lineHeight: 44,
    marginBottom: 18,
  },
  workoutCard: {
    height: 420,
    marginHorizontal: -spacing.section,
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: spacing.card,
    backgroundColor: '#0A0A0A',
  },
  workoutImage: {
    position: 'absolute',
    left: 0,
    top: -70,
    width: '100%',
    height: 560,
  },
  heroTopScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  workoutBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orangeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  workoutBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  heroToday: {
    position: 'absolute',
    top: 6,
    left: 16,
    fontFamily: 'Anton_400Regular',
    fontSize: 76,
    lineHeight: 78,
    letterSpacing: 1,
    color: '#FFFFFF',
  },
  workoutOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 80,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  workoutOverlayText: { flex: 1 },
  workoutTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  workoutMetaText: {
    fontSize: 12,
    color: '#C9C9C9',
    fontWeight: '500',
  },
  startBtn: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 6,
  },
  startBtnText: {
    color: '#0A0A0A',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  challengeBanner: {
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  challengeCopy: {
    flex: 1,
  },
  challengeKicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: 'rgba(10,10,10,0.65)',
    marginBottom: 4,
  },
  challengeTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#0A0A0A',
  },
  challengeSub: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(10,10,10,0.72)',
  },
  challengeJoin: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  challengeJoinText: {
    color: '#0A0A0A',
    fontSize: 14,
    fontWeight: '800',
  },
  statStrip: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    marginBottom: 22,
  },
  upcoming: {
    borderRadius: radius.card,
    padding: 14,
    marginBottom: 14,
  },
  upcomingKicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  upcomingLine: {
    fontSize: 16,
    fontWeight: '800',
  },
  upcomingSub: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  upcomingAdapt: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
  },
  statCell: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'flex-start',
  },
  statDivider: {
    borderLeftWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingLeft: 14,
  },
  statValue: {
    fontFamily: 'Anton_400Regular',
    fontSize: 26,
    lineHeight: 28,
    letterSpacing: 0.6,
  },
  statUnit: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: 'Anton_400Regular',
    fontSize: 20,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sectionAction: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  mealCard: {
    borderRadius: radius.card,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    marginBottom: 18,
  },
  mealImage: {
    width: 100,
    height: 100,
    borderRadius: radius.image,
  },
  mealDetails: { flex: 1 },
  mealCategoryTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  mealStatText: {
    fontSize: 12,
    fontWeight: '500',
  },
  logMealBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  logMealBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  campusCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  campusIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,106,0,0.14)',
  },
  campusTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  campusSub: {
    fontSize: 12,
    marginTop: 2,
  },
  pulseCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 18,
  },
  pulseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  pulseTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  pulseLive: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  pulseRow: {
    flexDirection: 'row',
  },
  pulseCell: {
    flex: 1,
    alignItems: 'flex-start',
  },
  pulseGym: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 3,
  },
  pulseLevel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginTop: 3,
  },
  pulseFeed: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
    marginTop: 14,
    paddingTop: 12,
  },
  pulseFeedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pulseQuiet: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  checkInBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  checkInBtnText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  checkInMsg: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
