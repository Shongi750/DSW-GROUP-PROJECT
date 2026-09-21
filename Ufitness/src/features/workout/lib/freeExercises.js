import { exercises as localExercises } from '../data/exercises';
import { planFreeExerciseIds } from '../data/movements';

const FREE_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const NAME_ALIASES = {
  'armcircles': ['armcircles'],
  'jumpingjacks': ['jumpingjack'],
  'bodyweightsquat': ['bodyweightsquat', 'squat'],
  'pushup': ['pushups', 'pushup'],
  'plank': ['plank'],
  'wallsit': ['wallsquat', 'wallsit'],
  'glutebridge': ['glutebridge', 'bridge'],
  'reverselunge': ['bodyweightreverselunge', 'reverselunge'],
  'kneepushup': ['kneepushup', 'kneelingpushup'],
  'deadbug': ['deadbug'],
  'birddog': ['birddog'],
  'superman': ['superman'],
  'calfraise': ['calfraise', 'standingcalfraise'],
  'sideplank': ['sideplank'],
  'mountainclimber': ['mountainclimbers'],
  'highknees': ['highknee', 'highknees'],
  'tricepdip': ['benchdips', 'tricepsdip'],
  'pikepushup': ['handstandpushup', 'pikepushup'],
  'splitsquat': ['splitsquat', 'bulgarian'],
  'row': ['bentoverbarbellrow', 'dumbbellrow', 'invertedrow'],
  'burpee': ['burpee'],
  'inchworm': ['inchworm'],
  'catcow': ['catcow', 'catstretch'],
  'hipopener': ['kneelinghipflexor', 'standinghipflexors'],
  'jumpsquat': ['jumpsquat', 'squatjump'],
  'hollowhold': ['hollowhold', 'hollowbody'],
  'hiphinge': ['goodmorning', 'romaniandeadlift'],
  'shouldertaps': ['plank', 'shouldertap'],
};

function normalizeName(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function titleCase(value = '') {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function imageUrl(item) {
  const path = item.images?.[0];
  return path ? `${IMAGE_BASE}${path}` : null;
}

// The open library ships two stills per exercise (start and end position), which we
// alternate to fake an animation when no ExerciseDB gif is available.
function imageFrames(item) {
  return (item.images || []).slice(0, 2).map((path) => `${IMAGE_BASE}${path}`);
}

export function mapFreeItem(item) {
  const focus = (item.primaryMuscles || []).map(titleCase);
  const secondary = (item.secondaryMuscles || []).map(titleCase);
  const timed = item.category === 'stretching' || item.category === 'cardio';
  return {
    id: `free-${item.id}`,
    name: item.name,
    focus: focus.length ? focus : ['Full body'],
    howToFocus: secondary.length ? secondary : focus,
    duration: timed ? 30 : 40,
    mode: timed ? 'timed' : 'sets',
    sets: timed ? 1 : 3,
    reps: 10,
    rest: 20,
    equipment: item.equipment || 'none',
    instructions: item.instructions || [],
    muscleHint: `${item.level || 'all levels'} · ${(focus || []).join(', ') || 'full body'}`,
    gifUrl: imageUrl(item),
    photoFrames: imageFrames(item),
    source: 'free-db',
    bodyPart: focus[0] || 'full body',
  };
}

let cached = null;

export async function loadFreeDatabase() {
  if (cached) return cached;
  const response = await fetch(FREE_URL);
  if (!response.ok) throw new Error('Could not load the free exercise library.');
  const raw = await response.json();
  cached = Array.isArray(raw) ? raw : [];
  return cached;
}

export function enrichLocalWithFree(local, freeList) {
  const byName = new Map();
  freeList.forEach((item) => {
    byName.set(normalizeName(item.name), item);
    byName.set(normalizeName(item.id), item);
  });

  return local.map((exercise) => {
    const key = normalizeName(exercise.name);
    const aliases = NAME_ALIASES[normalizeName(exercise.id)] || [];
    const match =
      byName.get(key) ||
      aliases.map((alias) => byName.get(alias)).find(Boolean) ||
      freeList.find((item) => normalizeName(item.name).includes(key) || key.includes(normalizeName(item.name)));
    if (!match) return { ...exercise, source: exercise.source || 'local' };
    return {
      ...exercise,
      instructions: match.instructions?.length ? match.instructions : exercise.instructions,
      gifUrl: imageUrl(match) || exercise.gifUrl,
      photoFrames: imageFrames(match),
      source: 'local+photos',
    };
  });
}

// Exercises the generated plans reference are always included; the rest of the browse
// catalog stays bodyweight-friendly and capped so the list is not endless.
export function openExtras(freeList, excludeNames = new Set()) {
  const mapped = freeList.map(mapFreeItem);
  const available = mapped.filter((item) => !excludeNames.has(normalizeName(item.name)));
  const required = available.filter((item) => planFreeExerciseIds.has(item.id.slice('free-'.length)));
  const requiredIds = new Set(required.map((item) => item.id));
  const browse = available
    .filter((item) => !requiredIds.has(item.id))
    .filter((item) => /body only|none/i.test(item.equipment || ''))
    .slice(0, 80);
  return [...required, ...browse];
}

export async function loadOpenCatalog() {
  const freeList = await loadFreeDatabase();
  const mapped = freeList.map(mapFreeItem);
  const local = enrichLocalWithFree(localExercises, freeList);
  const localNames = new Set(local.map((item) => normalizeName(item.name)));
  const extras = openExtras(freeList, localNames);
  const muscles = [...new Set(mapped.flatMap((item) => item.focus.map((tag) => tag.toLowerCase())))].slice(0, 12);
  return {
    catalog: [...local, ...extras],
    bodyParts: muscles.length ? muscles : ['chest', 'back', 'legs', 'shoulders', 'core', 'cardio'],
    source: 'open',
  };
}

export async function searchOpenCatalog(query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const { catalog } = await loadOpenCatalog();
  return catalog.filter((item) =>
    `${item.name} ${item.focus?.join(' ') || ''} ${item.equipment || ''}`.toLowerCase().includes(needle)
  ).slice(0, 20);
}

export async function openCatalogByMuscle(part) {
  const needle = (part || '').toLowerCase();
  const { catalog } = await loadOpenCatalog();
  return catalog
    .filter((item) => (item.focus || []).some((tag) => tag.toLowerCase().includes(needle)))
    .slice(0, 20);
}
