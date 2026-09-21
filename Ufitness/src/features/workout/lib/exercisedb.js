import AsyncStorage from '@react-native-async-storage/async-storage';
import { exercises as localExercises, getExercise as getLocalExercise } from '../data/exercises';
import {
  loadOpenCatalog,
  searchOpenCatalog,
  openCatalogByMuscle,
  loadFreeDatabase,
  enrichLocalWithFree,
  openExtras,
} from './freeExercises';
import { exerciseDbIds } from '../data/gifMap';

const HOST = 'exercisedb.p.rapidapi.com';
const BASE = `https://${HOST}`;
const KEY_STORAGE = 'workoutapp.rapidapi.key';

export const FALLBACK_BODY_PARTS = [
  'back',
  'cardio',
  'chest',
  'lower arms',
  'lower legs',
  'neck',
  'shoulders',
  'upper arms',
  'upper legs',
  'waist',
];

export function getEnvRapidApiKey() {
  return (process.env.EXPO_PUBLIC_RAPIDAPI_KEY || '').trim();
}

export async function getStoredRapidApiKey() {
  try {
    return ((await AsyncStorage.getItem(KEY_STORAGE)) || '').trim();
  } catch {
    return '';
  }
}

export async function getRapidApiKey() {
  return getEnvRapidApiKey() || (await getStoredRapidApiKey());
}

export async function saveRapidApiKey(key) {
  const next = (key || '').trim();
  if (!next) {
    await AsyncStorage.removeItem(KEY_STORAGE);
    return '';
  }
  await AsyncStorage.setItem(KEY_STORAGE, next);
  return next;
}

export function exerciseGifUrl(exerciseId, key) {
  if (!key || !exerciseId) return null;
  return `${BASE}/image?exerciseId=${encodeURIComponent(exerciseId)}&resolution=180&rapidapi-key=${encodeURIComponent(key)}`;
}

function titleCase(value = '') {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeName(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function durationFor(item) {
  if (item.category === 'cardio') return 30;
  if (item.category === 'mobility' || item.category === 'stretching') return 40;
  if (item.difficulty === 'beginner') return 30;
  return 40;
}

export function mapExerciseDbItem(item, key) {
  const id = String(item.id);
  const focus = [item.bodyPart, item.target].filter(Boolean).map(titleCase);
  const extras = (item.secondaryMuscles || []).map(titleCase);
  const instructions =
    Array.isArray(item.instructions) && item.instructions.length
      ? item.instructions
      : ['Follow the demonstration and keep the movement controlled.'];

  return {
    id,
    name: titleCase(item.name),
    duration: durationFor(item),
    focus: focus.length ? focus : ['Full body'],
    howToFocus: extras.length ? extras : focus,
    instructions,
    muscleHint: item.description || `Targets ${focus.join(' and ') || 'the body'}. Equipment: ${item.equipment || 'none'}.`,
    equipment: item.equipment,
    gifUrl: item.gifUrl || exerciseGifUrl(id, key),
    source: 'exercisedb',
  };
}

function mergeCatalog(remote, key, freeList = []) {
  const byName = new Map(remote.map((item) => [normalizeName(item.name), item]));
  const photoBase = freeList.length ? enrichLocalWithFree(localExercises, freeList) : localExercises;

  const local = photoBase.map((item) => {
    const dbGif = exerciseGifUrl(exerciseDbIds[item.id], key);
    const match = byName.get(normalizeName(item.name.replace(/hold/i, ''))) || byName.get(normalizeName(item.name));
    return {
      ...item,
      instructions: match?.instructions?.length ? match.instructions : item.instructions,
      muscleHint: match?.muscleHint || item.muscleHint,
      gifUrl: dbGif || item.gifUrl || null,
      photoFrames: dbGif ? null : item.photoFrames,
      source: exerciseDbIds[item.id] ? 'local+exercisedb' : item.source || 'local',
    };
  });

  const localNames = new Set(local.map((item) => normalizeName(item.name)));
  const remoteExtras = remote.filter((item) => !localNames.has(normalizeName(item.name)));
  const takenNames = new Set([...localNames, ...remoteExtras.map((item) => normalizeName(item.name))]);
  const freeExtras = freeList.length ? openExtras(freeList, takenNames) : [];
  return [...local, ...remoteExtras, ...freeExtras];
}

async function fetchJson(path, key) {
  const response = await fetch(`${BASE}${path}`, {
    headers: {
      'X-RapidAPI-Key': key,
      'X-RapidAPI-Host': HOST,
    },
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('ExerciseDB rejected the RapidAPI key.');
    }
    if (response.status === 429) {
      throw new Error('ExerciseDB rate limit hit. Wait a minute and retry.');
    }
    throw new Error(`ExerciseDB ${response.status}`);
  }
  return response.json();
}

function toList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export async function loadBodyParts(key) {
  const parts = await fetchJson('/exercises/bodyPartList', key);
  return Array.isArray(parts) && parts.length ? parts : FALLBACK_BODY_PARTS;
}

export async function searchExerciseDb(query, key) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  if (!key) return searchOpenCatalog(needle);
  const raw = await fetchJson(`/exercises/name/${encodeURIComponent(needle)}?limit=10`, key);
  return toList(raw).map((item) => mapExerciseDbItem(item, key));
}

export async function loadExercisesByBodyPart(bodyPart, key) {
  if (!key) return openCatalogByMuscle(bodyPart);
  const raw = await fetchJson(`/exercises/bodyPart/${encodeURIComponent(bodyPart)}?limit=10`, key);
  return toList(raw).map((item) => mapExerciseDbItem(item, key));
}

export async function loadExerciseCatalog(passedKey) {
  const key = passedKey || (await getRapidApiKey());
  if (!key) {
    try {
      const open = await loadOpenCatalog();
      return { ...open, error: null, hasKey: false };
    } catch (error) {
      return {
        catalog: localExercises.map((item) => ({ ...item, source: 'local' })),
        bodyParts: FALLBACK_BODY_PARTS,
        source: 'local',
        error: error.message || 'Could not load photos. Check your network.',
        hasKey: false,
      };
    }
  }

  try {
    const [all, cardio, bodyParts, freeList] = await Promise.all([
      fetchJson('/exercises?limit=10', key),
      fetchJson('/exercises/bodyPart/cardio?limit=10', key),
      loadBodyParts(key).catch(() => FALLBACK_BODY_PARTS),
      loadFreeDatabase().catch(() => []),
    ]);
    const raw = [...toList(all), ...toList(cardio)];
    const seen = new Set();
    const remote = raw
      .map((item) => mapExerciseDbItem(item, key))
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    return {
      catalog: mergeCatalog(remote, key, freeList),
      bodyParts,
      source: 'exercisedb',
      error: null,
      hasKey: true,
    };
  } catch (error) {
    try {
      const open = await loadOpenCatalog();
      return { ...open, error: error.message, hasKey: true };
    } catch {
      return {
        catalog: localExercises.map((item) => ({ ...item, source: 'local' })),
        bodyParts: FALLBACK_BODY_PARTS,
        source: 'local',
        error: error.message || 'Could not load ExerciseDB.',
        hasKey: true,
      };
    }
  }
}

export function lookupExercise(id, catalog = []) {
  return catalog.find((item) => item.id === id) || getLocalExercise(id) || null;
}
