import AsyncStorage from '@react-native-async-storage/async-storage';
import { CLIP_FEED } from '../data/clips';
import { getProgram } from '../data/programs';
import { toDateKey } from '../data/week';

const DAILY_KEY = 'ufitness.workout.dailyClips.v1';
const SAVED_KEY = 'ufitness.workout.savedClips.v1';
const DAILY_COUNT = 3;

function dayOffset(dateKey) {
  return [...String(dateKey)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function snapshotClip(clip) {
  const program = clip.programId ? getProgram(clip.programId) : null;
  return {
    ...clip,
    exerciseIds: program?.exerciseIds || clip.exerciseIds || [],
    moves: program?.moves || clip.moves || [],
    savedAt: clip.savedAt,
  };
}

export function pickDailyClips(dateKey = toDateKey(), pool = CLIP_FEED) {
  const ordered = [...pool].sort((a, b) => a.id.localeCompare(b.id));
  if (!ordered.length) return [];
  const start = dayOffset(dateKey) % ordered.length;
  const picked = [];
  const seen = new Set();
  for (let step = 0; picked.length < Math.min(DAILY_COUNT, ordered.length) && step < ordered.length * 2; step += 1) {
    const clip = ordered[(start + step * 2) % ordered.length];
    if (seen.has(clip.id)) continue;
    seen.add(clip.id);
    picked.push(snapshotClip(clip));
  }
  return picked;
}

export async function loadSavedClips() {
  try {
    const raw = await AsyncStorage.getItem(SAVED_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveClipOffline(clip) {
  const saved = await loadSavedClips();
  const next = {
    ...saved,
    [clip.id]: { ...snapshotClip(clip), savedAt: new Date().toISOString() },
  };
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
  return next[clip.id];
}

export async function removeSavedClip(id) {
  const saved = await loadSavedClips();
  delete saved[id];
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  return saved;
}

export async function loadDailyClips() {
  const today = toDateKey();
  try {
    const raw = await AsyncStorage.getItem(DAILY_KEY);
    const cached = raw ? JSON.parse(raw) : null;
    if (cached?.date === today && Array.isArray(cached.videos) && cached.videos.length) {
      return cached;
    }
  } catch {
    /* rebuild */
  }
  const videos = pickDailyClips(today);
  const next = { date: today, videos };
  await AsyncStorage.setItem(DAILY_KEY, JSON.stringify(next)).catch(() => {});
  return next;
}

export async function loadChallengeFeed() {
  const [daily, savedMap] = await Promise.all([loadDailyClips(), loadSavedClips()]);
  const saved = Object.values(savedMap).sort((a, b) => String(b.savedAt || '').localeCompare(String(a.savedAt || '')));
  const savedIds = new Set(saved.map((item) => item.id));
  return {
    date: daily.date,
    today: (daily.videos || []).map((clip) => ({ ...clip, downloaded: savedIds.has(clip.id) })),
    saved,
  };
}
