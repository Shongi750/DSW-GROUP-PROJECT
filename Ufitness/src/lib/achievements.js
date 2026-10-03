import AsyncStorage from '@react-native-async-storage/async-storage';
import { sessionStreak } from '../features/workout/data/progress';
import { currentUid, fetchCloudDoc, saveCloudDoc } from './cloudCache';

const KEY = 'ufitness.achievements.v1';

/** FR-45 — factual milestones only (no fake body metrics). */
export const BADGE_DEFS = [
  {
    id: 'first-workout',
    title: 'First workout',
    blurb: 'You logged your first session.',
    icon: 'trophy-outline',
    test: ({ sessions }) => sessions >= 1,
  },
  {
    id: 'streak-7',
    title: '7-day streak',
    blurb: 'Trained across seven consecutive days.',
    icon: 'flame-outline',
    test: ({ streak }) => streak >= 7,
  },
  {
    id: 'workouts-10',
    title: '10 workouts',
    blurb: 'Ten sessions on the books.',
    icon: 'barbell-outline',
    test: ({ sessions }) => sessions >= 10,
  },
  {
    id: 'challenge-30',
    title: '30-day challenge',
    blurb: 'Thirty sessions completed — consistency win.',
    icon: 'ribbon-outline',
    test: ({ sessions }) => sessions >= 30,
  },
  {
    id: 'week-complete',
    title: 'Week locked in',
    blurb: 'Hit your weekly session target once.',
    icon: 'checkmark-circle-outline',
    test: ({ weekDone, weekTotal }) => weekTotal > 0 && weekDone >= weekTotal,
  },
];

async function readLocal() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : { unlocked: {} };
    return parsed?.unlocked && typeof parsed.unlocked === 'object' ? parsed : { unlocked: {} };
  } catch {
    return { unlocked: {} };
  }
}

async function writeLocal(state) {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
  const uid = currentUid();
  if (uid) await saveCloudDoc('achievements', uid, state);
}

export async function loadAchievements() {
  const uid = currentUid();
  if (uid) {
    const cloud = await fetchCloudDoc('achievements', uid);
    if (cloud?.unlocked) {
      await AsyncStorage.setItem(KEY, JSON.stringify(cloud));
      return cloud;
    }
  }
  return readLocal();
}

export function evaluateBadges({ history = [], weekDone = 0, weekTotal = 4 } = {}) {
  const sessions = history.length;
  const streak = sessionStreak(history);
  const ctx = { sessions, streak, weekDone, weekTotal };
  return BADGE_DEFS.map((def) => ({
    ...def,
    earned: Boolean(def.test(ctx)),
  }));
}

/** Unlock newly earned badges; returns list that just unlocked. */
export async function syncAchievements(stats) {
  const evaluated = evaluateBadges(stats);
  const state = await loadAchievements();
  const unlocked = { ...(state.unlocked || {}) };
  const freshly = [];
  const now = new Date().toISOString();
  evaluated.forEach((badge) => {
    if (badge.earned && !unlocked[badge.id]) {
      unlocked[badge.id] = { at: now };
      freshly.push(badge);
    }
  });
  if (freshly.length) await writeLocal({ unlocked });
  return {
    badges: evaluated.map((b) => ({
      ...b,
      unlockedAt: unlocked[b.id]?.at || null,
    })),
    freshly,
  };
}
