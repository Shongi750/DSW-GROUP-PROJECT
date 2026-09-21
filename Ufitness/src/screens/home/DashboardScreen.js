import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import SafeImage from '../../components/SafeImage';
import { loadSavedPlan } from '../../features/meals/lib/persist';
import { fallbackSaStaples } from '../../features/meals/lib/saFoodApi';
import { buildTodayMealSummary } from '../../features/meals/lib/todaySummary';
import { loadTodayWorkoutSummary } from '../../features/workout/lib/todaySummary';
import { queueWorkoutAction } from '../../features/workout/lib/pendingStart';
import { promptDueReminders } from '../../lib/reminders';
import { openNested, openTab } from '../../navigation/nav';
import { DEFAULT_AVATAR } from '../../data/profileAvatars';

const WORKOUT_IMAGE =
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80';
const MEAL_FALLBACK =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80';

function formatHeroDate(date = new Date()) {
  return date
    .toLocaleDateString('en-GB', { weekday: 'long', month: 'short', day: 'numeric' })
    .toUpperCase();
}

export default function DashboardScreen({ navigation }) {
  const { profile } = useApp();
  const { colors, isDark } = useTheme();
  const firstName = (profile.name || 'there').split(' ')[0];
  const [todayMeal, setTodayMeal] = useState(null);
  const [todayWorkout, setTodayWorkout] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const saved = await loadSavedPlan();
        const mealSummary = buildTodayMealSummary({
          saved,
          catalog: fallbackSaStaples(),
          monthlyBudget: profile.foodBudgetAmount,
          fundingType: profile.fundingType,
          dietFilters: profile.dietFilters,
        });
        const workoutSummary = await loadTodayWorkoutSummary();
        if (!alive) return;
        setTodayMeal(mealSummary);
        setTodayWorkout(workoutSummary);
        promptDueReminders();
      })();
      return () => {
        alive = false;
      };
    }, [profile.foodBudgetAmount, profile.fundingType, profile.dietFilters])
  );

  const calories = todayMeal?.kcal ?? 0;
  const calorieFill = `${Math.min(100, Math.round((calories / 1800) * 100))}%`;
  const activeMin = todayWorkout?.minutes ?? 0;
  const activeFill = `${Math.min(100, Math.round((activeMin / 60) * 100))}%`;
  const featured = todayMeal?.featured;
  const workoutTitle = todayWorkout?.title || 'Today’s session';
  const workoutDescription =
    todayWorkout?.description || 'Open Workout to see today’s plan.';
  const workoutMeta = todayWorkout?.meta || '—';
  const workoutBadge = todayWorkout?.badge || 'STRENGTH';
  const mealTag = featured?.tag || 'LUNCH';
  const mealTitle = featured?.title || 'Today’s meal';
  const mealKcal = featured?.kcal ?? calories;
  const mealProtein = featured?.protein ?? 0;
  const mealImage = featured?.image || MEAL_FALLBACK;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      {/* Scrollable Content View */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        
        {/* Top Bar Navigation */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <TouchableOpacity onPress={() => openTab(navigation, 'Profile')}>
              <Image
                source={{ uri: profile.avatarUrl || DEFAULT_AVATAR }}
                style={styles.avatarImage}
              />
            </TouchableOpacity>
            <Text style={[styles.brandName, { color: colors.brand }]}>UFitness</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Hero Banner Header */}
        <View style={styles.heroHeader}>
          <Text style={[styles.dateText, { color: colors.muted }]}>{formatHeroDate()}</Text>
          <Text style={[styles.headlineText, { color: colors.text }]}>Ready to crush it, {firstName}?</Text>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsContainer}>
          {/* Calories Stat Card */}
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statHeaderRow}>
              <Ionicons name="flame-outline" size={16} color="#00A8A8" />
              <Text style={[styles.statLabelText, { color: colors.muted }]}>CALORIES</Text>
            </View>
            <View style={styles.statValueRow}>
              <Text style={[styles.statValueText, { color: colors.text }]}>{calories}</Text>
              <Text style={[styles.statUnitText, { color: colors.muted }]}>kcal</Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <View style={[styles.progressBarFill, { width: calorieFill, backgroundColor: '#00A8A8' }]} />
            </View>
          </View>

          {/* Active Time Stat Card */}
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statHeaderRow}>
              <Ionicons name="time-outline" size={16} color="#D96B27" />
              <Text style={[styles.statLabelText, { color: colors.muted }]}>ACTIVE</Text>
            </View>
            <View style={styles.statValueRow}>
              <Text style={[styles.statValueText, { color: colors.text }]}>{activeMin}</Text>
              <Text style={[styles.statUnitText, { color: colors.muted }]}>min</Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <View style={[styles.progressBarFill, { width: activeFill, backgroundColor: '#D96B27' }]} />
            </View>
          </View>
        </View>

        {/* Today's Workout Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Workout</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => openNested(navigation, ['Workout', 'Main', 'Workouts'])}
          >
            <Text style={styles.seeAllText}>SEE ALL</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.workoutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: WORKOUT_IMAGE }}
              style={styles.workoutImage}
            />
            <View style={[styles.workoutBadge, { backgroundColor: colors.card }]}>
              <View style={styles.orangeDot} />
              <Text style={[styles.workoutBadgeText, { color: colors.text }]}>{workoutBadge}</Text>
            </View>
          </View>

          <View style={styles.workoutDetails}>
            <Text style={[styles.workoutTitle, { color: colors.text }]}>{workoutTitle}</Text>
            <Text style={[styles.workoutDescription, { color: colors.muted }]}>
              {workoutDescription}
            </Text>

            <View style={styles.workoutFooterRow}>
              <View style={styles.durationMetaRow}>
                <Ionicons name="time-outline" size={14} color={colors.muted} />
                <Text style={[styles.workoutMetaText, { color: colors.muted }]}>{workoutMeta}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.startBtn}
                onPress={async () => {
                  if (todayWorkout?.type === 'train') {
                    await queueWorkoutAction({ startToday: true });
                  }
                  openTab(navigation, 'Workout');
                }}
              >
                <Text style={styles.startBtnText}>START</Text>
                <Ionicons name="caret-forward" size={12} color="#FFFFFF" style={{ marginLeft: 3 }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Fuel Your Day Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Fuel Your Day</Text>
        </View>

        <TouchableOpacity activeOpacity={0.85} style={[styles.mealCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => openTab(navigation, 'Meals')}>
          <SafeImage uri={mealImage} fallback={MEAL_FALLBACK} style={styles.mealImage} />
          <View style={styles.mealDetails}>
            <Text style={styles.mealCategoryTag}>{mealTag}</Text>
            <Text style={[styles.mealTitle, { color: colors.text }]}>{mealTitle}</Text>
            <View style={styles.mealStatsRow}>
              <View style={styles.mealStatItem}>
                <Ionicons name="flame-outline" size={12} color="#8C7870" />
                <Text style={[styles.mealStatText, { color: colors.muted }]}>{mealKcal} kcal</Text>
              </View>
              <View style={styles.mealStatItem}>
                <FontAwesome5 name="dumbbell" size={10} color="#8C7870" />
                <Text style={[styles.mealStatText, { color: colors.muted }]}>{mealProtein}g Protein</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Campus Connect Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Campus Connect</Text>
        </View>

        <View style={styles.campusGrid}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.campusCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => openNested(navigation, ['Community', 'MentorList'])}
          >
            <View style={[styles.campusIconCircle, { backgroundColor: isDark ? colors.overlay : '#EBF3FB' }]}>
              <Ionicons name="school-outline" size={20} color="#4A709C" />
            </View>
            <Text style={[styles.campusLabel, { color: colors.text }]}>Mentors</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.campusCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => openNested(navigation, ['Community', 'Connect'])}
          >
            <View style={[styles.campusIconCircle, { backgroundColor: isDark ? colors.overlay : '#FDF0E6' }]}>
              <Ionicons name="people-outline" size={20} color="#D96B27" />
            </View>
            <Text style={[styles.campusLabel, { color: colors.text }]}>Buddies</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.campusCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => openTab(navigation, 'Community')}
          >
            <View style={[styles.campusIconCircle, { backgroundColor: isDark ? colors.overlay : '#E6F7F5' }]}>
              <MaterialCommunityIcons name="forum-outline" size={20} color="#00A8A8" />
            </View>
            <Text style={[styles.campusLabel, { color: colors.text }]}>Community</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  scroll: {
    flex: 1,
    minHeight: 0,
    ...(Platform.OS === 'web' ? { overflow: 'scroll' } : null),
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },

  /* Top Bar */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#BD4800',
    letterSpacing: -0.5,
  },
  notificationBtn: {
    padding: 4,
  },

  /* Hero Header */
  heroHeader: {
    marginBottom: 18,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A8A8E',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  headlineText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C1C1E',
  },

  /* Quick Stats */
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F3',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  statLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6C6C70',
    letterSpacing: 0.5,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 12,
  },
  statValueText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  statUnitText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8A8A8E',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#EFEFF4',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D96B27',
    letterSpacing: 0.5,
  },

  /* Workout Card */
  workoutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F3',
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  imageWrapper: {
    position: 'relative',
    height: 180,
    width: '100%',
  },
  workoutImage: {
    width: '100%',
    height: '100%',
  },
  workoutBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orangeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D96B27',
  },
  workoutBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: 0.5,
  },
  workoutDetails: {
    padding: 16,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  workoutDescription: {
    fontSize: 12,
    color: '#6C6C70',
    lineHeight: 18,
    marginBottom: 16,
  },
  workoutFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutMetaText: {
    fontSize: 12,
    color: '#6C6C70',
    fontWeight: '500',
  },
  startBtn: {
    backgroundColor: '#BD4800',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* Fuel Your Day */
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#F0F0F3',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  mealImage: {
    width: 76,
    height: 76,
    borderRadius: 12,
  },
  mealDetails: {
    flex: 1,
  },
  mealCategoryTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00A8A8',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  mealTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  mealStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mealStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mealStatText: {
    fontSize: 11,
    color: '#8A8A8E',
    fontWeight: '500',
  },

  /* Campus Connect */
  campusGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  campusCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F3',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  campusIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  campusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },

  /* Bottom Navigation */
  navBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EFEFF4',
    paddingHorizontal: 10,
  },
  navItemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navIconContainer: {
    width: 42,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    backgroundColor: '#D96B27',
    width: 58,
    height: 30,
    borderRadius: 15,
  },
  navLabel: {
    fontSize: 10,
    color: '#6C6C70',
    marginTop: 2,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#D96B27',
    fontWeight: '700',
  },
});