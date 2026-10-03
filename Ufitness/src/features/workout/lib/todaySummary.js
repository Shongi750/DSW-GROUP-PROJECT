import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayPlan } from '../data/planEngine';
import { toDateKey } from '../data/week';
import { estimateMinutes } from './session';

const STORAGE_KEY = 'workoutapp.profile.v1';

const defaultProfile = {
  onboarded: true,
  daysPerWeek: 3,
  trainWeekdays: [1, 3, 5],
  goal: null,
  history: [],
  completedExerciseIds: [],
  injuries: [],
  planStartedAt: new Date().toISOString(),
};

export async function loadTodayWorkoutSummary() {
  let profile = defaultProfile;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      profile = { ...defaultProfile, ...parsed };
    }
  } catch {
    /* keep default */
  }

  const todayPlan = getTodayPlan(profile) || { type: 'rest', moves: [], session: null, status: '' };
  const today = toDateKey();
  const minutes = (profile.history || [])
    .filter((item) => item.date === today)
    .reduce((sum, item) => sum + Number(item.minutes || 0), 0);
  const plannedMinutes = todayPlan.type === 'train' ? estimateMinutes(todayPlan.moves || []) : 0;
  const type = todayPlan.type || 'rest';

  if (type === 'train') {
    return {
      type,
      title: todayPlan.session?.name || 'Today’s session',
      description: todayPlan.status || 'Follow the same session as the Workout tab.',
      minutes: 0,
      plannedMinutes,
      badge: 'STRENGTH',
      meta: `Not started · ${plannedMinutes} min planned`,
      history: profile.history || [],
    };
  }

  if (type === 'done') {
    return {
      type,
      title: "You're done for today",
      description: todayPlan.status || 'Session logged.',
      minutes,
      plannedMinutes: minutes,
      badge: 'DONE',
      meta: minutes ? `${minutes} min logged` : 'Session logged',
      history: profile.history || [],
    };
  }

  return {
    type: 'rest',
    title: 'Rest day',
    description: todayPlan.status || 'No extra work today.',
    minutes: 0,
    plannedMinutes: 0,
    badge: 'REST',
    meta: 'Recovery day',
    history: profile.history || [],
  };
}
