import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadFreeDatabase, mapFreeItem } from './freeExercises';
import { estimateMinutes } from './session';

const SAVED_KEY = 'ufitness.workout.savedSessions.v1';

// Sessions a student can choose. Muscles match the free exercise library's primaryMuscles.
export const WORKOUT_SESSIONS = [
  {
    id: 'arms',
    name: 'Arm workout',
    overlayTitle: 'ARMS',
    theme: 'darkLift',
    muscles: ['biceps', 'triceps', 'forearms'],
    meta: 'Biceps, triceps, forearms',
    exerciseDbPart: 'upper arms',
  },
  {
    id: 'legs',
    name: 'Leg workout',
    overlayTitle: 'LEGS',
    theme: 'anatomy',
    muscles: ['quadriceps', 'hamstrings', 'calves'],
    meta: 'Quads, hamstrings, calves',
    exerciseDbPart: 'upper legs',
  },
  {
    id: 'chest',
    name: 'Chest workout',
    overlayTitle: 'CHEST',
    theme: 'highpower',
    muscles: ['chest'],
    meta: 'Presses and flyes',
    exerciseDbPart: 'chest',
  },
  {
    id: 'back',
    name: 'Back workout',
    overlayTitle: 'BACK',
    theme: 'split',
    muscles: ['lats', 'middle back', 'lower back'],
    meta: 'Rows and pulldowns',
    exerciseDbPart: 'back',
  },
  {
    id: 'shoulders',
    name: 'Shoulder workout',
    overlayTitle: 'SHOULDERS',
    theme: 'sandro',
    muscles: ['shoulders'],
    meta: 'Presses and raises',
    exerciseDbPart: 'shoulders',
  },
  {
    id: 'core',
    name: 'Core workout',
    overlayTitle: 'CORE',
    theme: 'abdomen',
    muscles: ['abdominals'],
    meta: 'Abs and anti-extension',
    exerciseDbPart: 'waist',
  },
  {
    id: 'glutes',
    name: 'Glute workout',
    overlayTitle: 'GLUTES',
    theme: 'home',
    muscles: ['glutes'],
    meta: 'Hip extension',
    exerciseDbPart: 'upper legs',
  },
];

const remembered = new Map();

export function rememberExercises(list = []) {
  list.forEach((item) => {
    if (item?.id) remembered.set(item.id, item);
  });
}

export function rememberedExercise(id) {
  return remembered.get(id) || null;
}

export function getSessionType(id) {
  return WORKOUT_SESSIONS.find((item) => item.id === id) || null;
}

function muscleTags(item) {
  return [...(item.primaryMuscles || []), ...(item.secondaryMuscles || [])].map((tag) =>
    String(tag).toLowerCase()
  );
}

function matchesMuscles(item, muscles) {
  const tags = muscleTags(item);
  return muscles.some((muscle) => tags.includes(muscle));
}

function isBodyweight(item) {
  return /body only|none|bodyweight/i.test(item.equipment || '');
}

function spreadPick(items, muscles, limit) {
  const buckets = muscles.map((muscle) =>
    items.filter((item) =>
      (item.primaryMuscles || []).some((tag) => String(tag).toLowerCase() === muscle)
    )
  );
  const picked = [];
  const seen = new Set();
  let step = 0;
  while (picked.length < limit && step < limit * buckets.length + items.length) {
    const bucket = buckets[step % Math.max(1, buckets.length)] || [];
    const next = bucket.find((item) => !seen.has(item.id));
    if (next) {
      seen.add(next.id);
      picked.push(next);
    }
    step += 1;
    if (step > buckets.length && buckets.every((bucket) => bucket.every((item) => seen.has(item.id)))) break;
  }
  items.forEach((item) => {
    if (picked.length >= limit || seen.has(item.id)) return;
    seen.add(item.id);
    picked.push(item);
  });
  return picked.slice(0, limit);
}

function toMove(exercise, index) {
  if (exercise.mode === 'timed') {
    return { id: exercise.id, mode: 'timed', duration: exercise.duration || 30, rest: 15, sets: 1 };
  }
  const main = index < 2;
  return {
    id: exercise.id,
    mode: 'sets',
    sets: main ? 4 : 3,
    reps: main ? 8 : 12,
    rest: main ? 45 : 30,
  };
}

async function fromExerciseDb(session, limit) {
  try {
    const { getRapidApiKey, loadExercisesByBodyPart } = await import('./exercisedb');
    const key = await getRapidApiKey();
    if (!key || !session.exerciseDbPart) return [];
    const rows = await loadExercisesByBodyPart(session.exerciseDbPart, key);
    return rows.slice(0, limit).map((item) => ({
      ...item,
      mode: item.mode || 'sets',
      sets: item.sets || 3,
      reps: item.reps || 10,
      rest: item.rest || 30,
    }));
  } catch {
    return [];
  }
}

export async function buildSession(sessionId, { tier = 'bodyweight' } = {}) {
  const session = getSessionType(sessionId);
  if (!session) throw new Error('Unknown workout session.');

  const remote = await fromExerciseDb(session, 6);
  let exercises = remote;

  if (exercises.length < 6) {
    let library = [];
    try {
      library = await loadFreeDatabase();
    } catch (error) {
      if (!exercises.length) {
        const saved = await loadSavedSessions();
        const cached = saved[sessionId];
        if (cached?.exercises?.length) {
          rememberExercises(cached.exercises);
          return cached;
        }
        throw error;
      }
    }
    const matched = library.filter((item) => matchesMuscles(item, session.muscles));
    const pool = tier === 'bodyweight' ? matched.filter(isBodyweight) : matched;
    const usable = pool.length >= 4 ? pool : matched;
    const picked = spreadPick(usable, session.muscles, 6 - exercises.length);
    const taken = new Set(exercises.map((item) => item.name.toLowerCase()));
    picked.forEach((item) => {
      const mapped = mapFreeItem(item);
      if (taken.has(mapped.name.toLowerCase())) return;
      taken.add(mapped.name.toLowerCase());
      exercises.push(mapped);
    });
  }

  if (!exercises.length) {
    const saved = await loadSavedSessions();
    const cached = saved[sessionId];
    if (cached?.exercises?.length) {
      rememberExercises(cached.exercises);
      return cached;
    }
    throw new Error(`No ${session.name.toLowerCase()} moves came back. Check your connection and try again.`);
  }

  exercises = exercises.slice(0, 6);
  rememberExercises(exercises);
  const moves = exercises.map(toMove);
  const minutes = estimateMinutes(moves);
  return {
    id: session.id,
    name: session.name,
    overlayTitle: session.overlayTitle,
    theme: session.theme,
    muscles: session.muscles,
    meta: `${exercises.length} moves · ~${minutes} min`,
    source: remote.length ? 'exercisedb' : 'exercise-library',
    exerciseIds: exercises.map((item) => item.id),
    exercises,
    moves,
  };
}

export async function loadSavedSessions() {
  try {
    const raw = await AsyncStorage.getItem(SAVED_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveSessionOffline(session) {
  if (!session?.id || !session.exercises?.length) return null;
  const saved = await loadSavedSessions();
  const next = {
    ...saved,
    [session.id]: { ...session, savedAt: new Date().toISOString() },
  };
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
  rememberExercises(session.exercises);
  return next[session.id];
}

export async function removeSavedSession(id) {
  const saved = await loadSavedSessions();
  delete saved[id];
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  return saved;
}
