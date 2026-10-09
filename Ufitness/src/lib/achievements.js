import AsyncStorage from '@react-native-async-storage/async-storage';
import { BADGE_DEFS, evaluateBadges } from './badgeRules';
import { currentUid, fetchCloudDoc, saveCloudDoc } from './cloudCache';

const KEY = 'ufitness.achievements.v1';

export { BADGE_DEFS, evaluateBadges };

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
