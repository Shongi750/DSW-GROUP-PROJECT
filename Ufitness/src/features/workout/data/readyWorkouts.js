// Ready-made workouts. Each one is a name plus a list of exercise ids
// that already exist in data/exercises.js. No network call is needed.

const READY_WORKOUTS = [
  {
    id: 'seven-minute',
    name: '7 Minute Starter',
    minutes: 7,
    level: 'Beginner',
    group: 'quick',
    focus: 'Full body',
    exerciseIds: ['jumping-jacks', 'bodyweight-squat', 'knee-push-up', 'plank', 'glute-bridge'],
  },
  {
    id: 'morning-wake',
    name: 'Morning Wake Up',
    minutes: 8,
    level: 'Beginner',
    group: 'quick',
    focus: 'Mobility',
    exerciseIds: ['arm-circles', 'cat-cow', 'march-in-place', 'hip-opener', 'glute-stretch'],
  },
  {
    id: 'desk-break',
    name: 'Desk Break',
    minutes: 6,
    level: 'Beginner',
    group: 'quick',
    focus: 'Full body',
    exerciseIds: ['arm-circles', 'march-in-place', 'wall-sit', 'shoulder-taps', 'hamstring-fold'],
  },
  {
    id: 'dorm-room',
    name: 'Dorm Room Workout',
    minutes: 15,
    level: 'Beginner',
    group: 'strength',
    focus: 'Full body',
    exerciseIds: ['bodyweight-squat', 'knee-push-up', 'glute-bridge', 'row', 'plank', 'calf-raise'],
  },
  {
    id: 'beginner-full',
    name: 'Beginner Full Body',
    minutes: 18,
    level: 'Beginner',
    group: 'strength',
    focus: 'Full body',
    exerciseIds: ['inchworm', 'bodyweight-squat', 'knee-push-up', 'bird-dog', 'glute-bridge', 'dead-bug'],
  },
  {
    id: 'full-body-burn',
    name: 'Full Body Burn',
    minutes: 20,
    level: 'Medium',
    group: 'strength',
    focus: 'Full body',
    exerciseIds: ['bodyweight-squat', 'push-up', 'reverse-lunge', 'row', 'pike-push-up', 'plank'],
  },
  {
    id: 'upper-body',
    name: 'Upper Body',
    minutes: 16,
    level: 'Medium',
    group: 'strength',
    focus: 'Chest and back',
    exerciseIds: ['push-up', 'row', 'pike-push-up', 'tricep-dip', 'curl-to-press', 'shoulder-taps'],
  },
  {
    id: 'lower-body',
    name: 'Lower Body',
    minutes: 16,
    level: 'Medium',
    group: 'strength',
    focus: 'Legs and glutes',
    exerciseIds: ['bodyweight-squat', 'reverse-lunge', 'glute-bridge', 'split-squat', 'calf-raise', 'wall-sit'],
  },
  {
    id: 'push-workout',
    name: 'Push Workout',
    minutes: 14,
    level: 'Medium',
    group: 'strength',
    focus: 'Chest and arms',
    exerciseIds: ['push-up', 'chest-floor-press', 'pike-push-up', 'tricep-dip', 'knee-push-up'],
  },
  {
    id: 'pull-workout',
    name: 'Pull Workout',
    minutes: 14,
    level: 'Medium',
    group: 'strength',
    focus: 'Back and arms',
    exerciseIds: ['row', 'superman', 'curl-to-press', 'bird-dog', 'good-morning'],
  },
  {
    id: 'leg-day',
    name: 'Leg Day',
    minutes: 18,
    level: 'Medium',
    group: 'strength',
    focus: 'Legs',
    exerciseIds: ['bodyweight-squat', 'reverse-lunge', 'split-squat', 'calf-raise', 'wall-sit', 'hip-hinge'],
  },
  {
    id: 'knee-friendly-legs',
    name: 'Knee-Friendly Legs',
    minutes: 12,
    level: 'Beginner',
    group: 'strength',
    focus: 'Legs',
    exerciseIds: ['glute-bridge', 'hip-hinge', 'calf-raise', 'hamstring-fold', 'glute-stretch'],
  },
  {
    id: 'arm-day',
    name: 'Arm Day',
    minutes: 12,
    level: 'Beginner',
    group: 'strength',
    focus: 'Arms',
    exerciseIds: ['tricep-dip', 'curl-to-press', 'knee-push-up', 'arm-circles', 'shoulder-taps'],
  },
  {
    id: 'chest-day',
    name: 'Chest Day',
    minutes: 12,
    level: 'Medium',
    group: 'strength',
    focus: 'Chest',
    exerciseIds: ['push-up', 'knee-push-up', 'chest-floor-press', 'pike-push-up'],
  },
  {
    id: 'back-day',
    name: 'Back Day',
    minutes: 12,
    level: 'Beginner',
    group: 'strength',
    focus: 'Back',
    exerciseIds: ['row', 'superman', 'bird-dog', 'good-morning', 'cat-cow'],
  },
  {
    id: 'shoulder-day',
    name: 'Shoulder Day',
    minutes: 12,
    level: 'Medium',
    group: 'strength',
    focus: 'Shoulders',
    exerciseIds: ['pike-push-up', 'arm-circles', 'curl-to-press', 'shoulder-taps'],
  },
  {
    id: 'glute-builder',
    name: 'Glute Builder',
    minutes: 14,
    level: 'Beginner',
    group: 'strength',
    focus: 'Glutes',
    exerciseIds: ['glute-bridge', 'reverse-lunge', 'split-squat', 'hip-hinge', 'glute-stretch'],
  },
  {
    id: 'core-burn',
    name: 'Core Burn',
    minutes: 10,
    level: 'Medium',
    group: 'core',
    focus: 'Core',
    exerciseIds: ['dead-bug', 'plank', 'shoulder-taps', 'hollow-hold', 'side-plank', 'bird-dog'],
  },
  {
    id: 'quick-abs',
    name: 'Quick Abs',
    minutes: 6,
    level: 'Beginner',
    group: 'core',
    focus: 'Core',
    exerciseIds: ['dead-bug', 'plank', 'hollow-hold'],
  },
  {
    id: 'hiit-blast',
    name: 'HIIT Blast',
    minutes: 12,
    level: 'Hard',
    group: 'cardio',
    focus: 'Cardio',
    exerciseIds: ['jumping-jacks', 'jump-squat', 'burpee', 'mountain-climber', 'high-knees', 'push-up'],
  },
  {
    id: 'cardio-sweat',
    name: 'Cardio Sweat',
    minutes: 10,
    level: 'Medium',
    group: 'cardio',
    focus: 'Cardio',
    exerciseIds: ['march-in-place', 'jumping-jacks', 'high-knees', 'mountain-climber', 'bodyweight-squat'],
  },
  {
    id: 'low-impact-cardio',
    name: 'Low Impact Cardio',
    minutes: 10,
    level: 'Beginner',
    group: 'cardio',
    focus: 'Cardio',
    exerciseIds: ['march-in-place', 'arm-circles', 'glute-bridge', 'wall-sit', 'cat-cow'],
  },
  {
    id: 'stretch-recover',
    name: 'Stretch and Recover',
    minutes: 10,
    level: 'Beginner',
    group: 'stretch',
    focus: 'Mobility',
    exerciseIds: ['cat-cow', 'world-greatest', 'hip-opener', 'hamstring-fold', 'glute-stretch'],
  },
  {
    id: 'cool-down',
    name: 'Cool Down',
    minutes: 6,
    level: 'Beginner',
    group: 'stretch',
    focus: 'Mobility',
    exerciseIds: ['cat-cow', 'hamstring-fold', 'glute-stretch', 'arm-circles'],
  },
];

const GROUPS = [
  { id: 'all', label: 'All' },
  { id: 'quick', label: 'Quick' },
  { id: 'strength', label: 'Strength' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'core', label: 'Core' },
  { id: 'stretch', label: 'Stretch' },
];

// Nike-style collections: short picks for campus life.
const COLLECTIONS = [
  {
    id: 'dorm',
    label: 'Dorm room',
    blurb: 'No gym needed',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=80',
    workoutIds: ['dorm-room', 'desk-break', 'seven-minute', 'morning-wake'],
  },
  {
    id: 'exam',
    label: 'Exam week',
    blurb: 'Short and calming',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
    workoutIds: ['stretch-recover', 'desk-break', 'quick-abs', 'low-impact-cardio'],
  },
  {
    id: 'gym',
    label: 'Gym day',
    blurb: 'Push harder',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    workoutIds: ['full-body-burn', 'leg-day', 'upper-body', 'hiit-blast'],
  },
];

const WORKOUT_IMAGES = {
  quick: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800&auto=format&fit=crop&q=80',
  strength: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
  cardio: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800&auto=format&fit=crop&q=80',
  core: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80',
  stretch: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
};

function imageForWorkout(workout) {
  return WORKOUT_IMAGES[workout.group] || WORKOUT_IMAGES.strength;
}

function listCollections() {
  return COLLECTIONS;
}

function workoutsInCollection(collectionId) {
  const collection = COLLECTIONS.find((item) => item.id === collectionId);
  if (!collection) return [];
  const found = [];
  let i = 0;
  while (i < collection.workoutIds.length) {
    const id = collection.workoutIds[i];
    const workout = READY_WORKOUTS.find((item) => item.id === id);
    if (workout) found.push(workout);
    i = i + 1;
  }
  return found;
}

function textOf(workout) {
  return (workout.name + ' ' + workout.focus + ' ' + workout.level + ' ' + workout.group).toLowerCase();
}

function listWorkouts(query, group) {
  const found = [];
  const needle = (query || '').trim().toLowerCase();
  let i = 0;
  while (i < READY_WORKOUTS.length) {
    const workout = READY_WORKOUTS[i];
    const groupOk = !group || group === 'all' || workout.group === group;
    const textOk = !needle || textOf(workout).indexOf(needle) !== -1;
    if (groupOk && textOk) {
      found.push(workout);
    }
    i = i + 1;
  }
  return found;
}

export {
  READY_WORKOUTS,
  GROUPS as WORKOUT_GROUPS,
  COLLECTIONS,
  listWorkouts,
  listCollections,
  workoutsInCollection,
  imageForWorkout,
};
