function program(item) {
  const exerciseIds = (item.moves || []).map((move) => move.id);
  return { ...item, exerciseIds };
}

export const programShortcuts = [
  { id: 'programs', label: 'Programs', icon: 'calendar-outline', screen: 'Programs' },
  { id: 'exercises', label: 'Exercises', icon: 'barbell-outline', screen: 'Exercises' },
  { id: 'builder', label: 'Build', icon: 'add-circle-outline', screen: 'Builder' },
  { id: 'coaching', label: 'Coaching', icon: 'person-outline', screen: 'Coaching' },
];

export const popularPrograms = [
  program({
    id: 'full-body',
    overlayTitle: 'FULL BODY',
    overlaySubtitle: '',
    name: 'Full Body Strength',
    meta: '8 moves · ~25 min',
    badge: null,
    theme: 'anatomy',
    level: 2,
    tags: ['full-body', 'strength'],
    moves: [
      { id: 'inchworm', mode: 'sets', sets: 2, reps: 6, rest: 20 },
      { id: 'bodyweight-squat', mode: 'sets', sets: 3, reps: 12, rest: 30 },
      { id: 'push-up', mode: 'sets', sets: 3, reps: 8, rest: 30 },
      { id: 'row', mode: 'sets', sets: 3, reps: 10, rest: 30 },
      { id: 'reverse-lunge', mode: 'sets', sets: 3, reps: 8, rest: 30 },
      { id: 'pike-push-up', mode: 'sets', sets: 2, reps: 8, rest: 25 },
      { id: 'plank', mode: 'timed', duration: 40, rest: 20 },
      { id: 'glute-bridge', mode: 'sets', sets: 2, reps: 12, rest: 15 },
    ],
  }),
  program({
    id: 'four-day-split',
    overlayTitle: 'PUSH',
    overlaySubtitle: 'PULL',
    name: 'Push Pull Legs Core',
    meta: 'Upper strength · ~20 min',
    badge: 'Build Muscle',
    theme: 'darkLift',
    level: 3,
    tags: ['strength', 'split'],
    moves: [
      { id: 'push-up', mode: 'sets', sets: 4, reps: 8, rest: 40 },
      { id: 'pike-push-up', mode: 'sets', sets: 3, reps: 8, rest: 30 },
      { id: 'tricep-dip', mode: 'sets', sets: 3, reps: 10, rest: 30 },
      { id: 'row', mode: 'sets', sets: 4, reps: 10, rest: 40 },
      { id: 'curl-to-press', mode: 'sets', sets: 3, reps: 10, rest: 30 },
      { id: 'superman', mode: 'timed', duration: 25, rest: 20 },
    ],
  }),
];

export const recommendedPrograms = [
  program({
    id: 'at-home',
    overlayTitle: 'At Home',
    overlaySubtitle: '',
    name: 'Beginner Mix',
    meta: 'No equipment · ~18 min',
    badge: null,
    theme: 'home',
    level: 1,
    tags: ['beginner', 'home'],
    moves: [
      { id: 'arm-circles', mode: 'timed', duration: 30, rest: 10 },
      { id: 'bodyweight-squat', mode: 'sets', sets: 3, reps: 10, rest: 30 },
      { id: 'knee-push-up', mode: 'sets', sets: 3, reps: 8, rest: 30 },
      { id: 'glute-bridge', mode: 'sets', sets: 3, reps: 10, rest: 25 },
      { id: 'bird-dog', mode: 'sets', sets: 2, reps: 8, rest: 20 },
      { id: 'plank', mode: 'timed', duration: 20, rest: 0 },
    ],
  }),
  program({
    id: 'upper-lower',
    overlayTitle: 'UPPER',
    overlaySubtitle: 'LOWER',
    name: 'Upper / Lower',
    meta: '2-day split · upper day',
    badge: null,
    theme: 'split',
    level: 2,
    tags: ['split', 'strength'],
    moves: [
      { id: 'push-up', mode: 'sets', sets: 3, reps: 10, rest: 30 },
      { id: 'row', mode: 'sets', sets: 3, reps: 10, rest: 30 },
      { id: 'pike-push-up', mode: 'sets', sets: 3, reps: 8, rest: 30 },
      { id: 'tricep-dip', mode: 'sets', sets: 3, reps: 10, rest: 25 },
      { id: 'shoulder-taps', mode: 'sets', sets: 2, reps: 12, rest: 20 },
    ],
  }),
];

export const coachPrograms = [
  program({
    id: 'three-days-mobility',
    overlayTitle: 'MOBILITY',
    overlaySubtitle: '',
    name: '3-Day Mobility',
    meta: 'Recover in 12 min',
    badge: null,
    theme: 'mobility',
    level: 1,
    tags: ['mobility', 'recovery'],
    moves: [
      { id: 'cat-cow', mode: 'timed', duration: 45, rest: 10 },
      { id: 'world-greatest', mode: 'sets', sets: 2, reps: 6, rest: 15 },
      { id: 'hip-opener', mode: 'timed', duration: 40, rest: 10 },
      { id: 'hamstring-fold', mode: 'timed', duration: 30, rest: 10 },
      { id: 'glute-stretch', mode: 'timed', duration: 30, rest: 10 },
      { id: 'dead-bug', mode: 'sets', sets: 2, reps: 6, rest: 15 },
    ],
  }),
  program({
    id: 'abdomen-40',
    overlayTitle: 'CORE',
    overlaySubtitle: '40',
    name: 'Core Builder',
    meta: 'Abs + anti-extension',
    badge: null,
    theme: 'abdomen',
    level: 2,
    tags: ['core', 'beginner'],
    moves: [
      { id: 'dead-bug', mode: 'sets', sets: 3, reps: 8, rest: 20 },
      { id: 'plank', mode: 'timed', duration: 30, rest: 20 },
      { id: 'shoulder-taps', mode: 'sets', sets: 3, reps: 12, rest: 20 },
      { id: 'hollow-hold', mode: 'timed', duration: 20, rest: 20 },
      { id: 'side-plank', mode: 'timed', duration: 20, rest: 15 },
      { id: 'bird-dog', mode: 'sets', sets: 2, reps: 8, rest: 15 },
    ],
  }),
];

export const newCoachPrograms = [
  program({
    id: 'sandro-silva',
    overlayTitle: 'ENGINE',
    overlaySubtitle: '',
    name: 'Conditioning Engine',
    meta: 'Heart + lungs',
    badge: null,
    theme: 'sandro',
    level: 2,
    tags: ['cardio', 'strength'],
    moves: [
      { id: 'march-in-place', mode: 'timed', duration: 40, rest: 10 },
      { id: 'jumping-jacks', mode: 'timed', duration: 30, rest: 15 },
      { id: 'bodyweight-squat', mode: 'sets', sets: 3, reps: 15, rest: 20 },
      { id: 'mountain-climber', mode: 'timed', duration: 25, rest: 20 },
      { id: 'push-up', mode: 'sets', sets: 3, reps: 8, rest: 25 },
      { id: 'high-knees', mode: 'timed', duration: 20, rest: 20 },
    ],
  }),
  program({
    id: 'high-power',
    overlayTitle: 'HIGH',
    overlaySubtitle: 'POWER',
    name: 'High Power',
    meta: 'Short and hard',
    badge: 'Coach pick',
    theme: 'highpower',
    level: 3,
    tags: ['cardio', 'power'],
    moves: [
      { id: 'jump-squat', mode: 'timed', duration: 20, rest: 25 },
      { id: 'burpee', mode: 'timed', duration: 20, rest: 30 },
      { id: 'push-up', mode: 'sets', sets: 3, reps: 10, rest: 25 },
      { id: 'mountain-climber', mode: 'timed', duration: 20, rest: 20 },
      { id: 'split-squat', mode: 'sets', sets: 3, reps: 8, rest: 30 },
    ],
  }),
];

const allPrograms = [
  ...popularPrograms,
  ...recommendedPrograms,
  ...coachPrograms,
  ...newCoachPrograms,
];

export function getProgram(id) {
  return allPrograms.find((item) => item.id === id);
}

export function getAllPrograms() {
  return allPrograms;
}

export function getTodayProgram() {
  return getProgram('full-body');
}
