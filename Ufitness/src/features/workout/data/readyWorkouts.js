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

// Gym split (idea from Faheem's branch, rebuilt on UFitness ids). Every "free-" id below
// was checked against the open free-exercise-db library the catalog loads, so photos and
// how-to steps come from there. Moves carry their own sets / reps / rest because these are
// heavier sessions than the bodyweight defaults.
function sets(id, setCount, reps, rest) {
  return { id: id, mode: 'sets', sets: setCount, reps: reps, rest: rest };
}

function timed(id, duration, rest) {
  return { id: id, mode: 'timed', duration: duration, rest: rest, sets: 1 };
}

function gymWorkout(item) {
  return {
    ...item,
    group: 'gym',
    equipment: item.equipment || 'Gym',
    exerciseIds: item.moves.map(function (move) { return move.id; }),
  };
}

const GYM_WORKOUTS = [
  gymWorkout({
    id: 'gym-upper-power',
    name: 'Upper Power',
    minutes: 50,
    level: 'Hard',
    focus: 'Chest, back and shoulders',
    moves: [
      sets('free-Barbell_Bench_Press_-_Medium_Grip', 4, 6, 120),
      sets('free-Bent_Over_Barbell_Row', 4, 6, 120),
      sets('free-Barbell_Shoulder_Press', 3, 8, 90),
      sets('free-Pullups', 3, 8, 90),
      sets('free-Dips_-_Triceps_Version', 3, 10, 60),
      sets('free-Barbell_Curl', 3, 10, 60),
    ],
  }),
  gymWorkout({
    id: 'gym-lower-quads',
    name: 'Lower / Quads',
    minutes: 50,
    level: 'Hard',
    focus: 'Quads and calves',
    moves: [
      sets('free-Barbell_Squat', 4, 6, 150),
      sets('free-Leg_Press', 3, 10, 90),
      sets('free-Dumbbell_Lunges', 3, 10, 75),
      sets('free-Leg_Extensions', 3, 12, 60),
      sets('free-Standing_Calf_Raises', 4, 12, 45),
      sets('free-Hanging_Leg_Raise', 3, 10, 45),
    ],
  }),
  gymWorkout({
    id: 'gym-back',
    name: 'Back Builder',
    minutes: 45,
    level: 'Hard',
    focus: 'Back and rear delts',
    moves: [
      sets('free-Barbell_Deadlift', 4, 5, 150),
      sets('free-Wide-Grip_Lat_Pulldown', 3, 10, 75),
      sets('free-Seated_Cable_Rows', 3, 10, 75),
      sets('free-T-Bar_Row_with_Handle', 3, 8, 90),
      sets('free-Face_Pull', 3, 15, 45),
      sets('free-Hyperextensions_Back_Extensions', 3, 12, 45),
    ],
  }),
  gymWorkout({
    id: 'gym-glutes-hams',
    name: 'Glutes / Hams',
    minutes: 45,
    level: 'Hard',
    focus: 'Glutes and hamstrings',
    moves: [
      sets('free-Barbell_Hip_Thrust', 4, 8, 120),
      sets('free-Romanian_Deadlift', 4, 8, 120),
      sets('free-Lying_Leg_Curls', 3, 12, 60),
      sets('free-Dumbbell_Step_Ups', 3, 10, 60),
      sets('free-Glute_Kickback', 3, 12, 45),
      sets('free-Single_Leg_Glute_Bridge', 2, 12, 45),
    ],
  }),
  gymWorkout({
    id: 'gym-full-circuit',
    name: 'Full-Body Circuit',
    minutes: 35,
    level: 'Hard',
    focus: 'Full body',
    equipment: 'Dumbbells, kettlebell, rower',
    moves: [
      sets('free-Goblet_Squat', 3, 12, 30),
      sets('free-Dumbbell_Bench_Press', 3, 10, 30),
      sets('free-One-Arm_Dumbbell_Row', 3, 10, 30),
      sets('free-Dumbbell_Rear_Lunge', 3, 10, 30),
      sets('free-Dumbbell_Shoulder_Press', 3, 10, 30),
      timed('mountain-climber', 40, 20),
      timed('free-Rowing_Stationary', 120, 60),
    ],
  }),
  gymWorkout({
    id: 'gym-recovery',
    name: 'Gym Recovery',
    minutes: 20,
    level: 'Beginner',
    focus: 'Mobility',
    equipment: 'Rower or bike, mat',
    moves: [
      timed('free-Rowing_Stationary', 300, 30),
      timed('cat-cow', 45, 10),
      timed('world-greatest', 60, 10),
      timed('hip-opener', 45, 10),
      timed('hamstring-fold', 40, 10),
      timed('glute-stretch', 40, 0),
    ],
  }),
];

READY_WORKOUTS.push(...GYM_WORKOUTS);

// Open-library ids the ready workouts need. The catalog loader always includes these.
const READY_FREE_EXERCISE_IDS = new Set(
  READY_WORKOUTS.flatMap(function (workout) { return workout.exerciseIds; })
    .filter(function (id) { return id.indexOf('free-') === 0; })
    .map(function (id) { return id.slice('free-'.length); })
);

const GROUPS = [
  { id: 'all', label: 'All' },
  { id: 'quick', label: 'Quick' },
  { id: 'strength', label: 'Strength' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'core', label: 'Core' },
  { id: 'stretch', label: 'Stretch' },
  { id: 'gym', label: 'Gym' },
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
    workoutIds: ['gym-upper-power', 'gym-lower-quads', 'gym-back', 'gym-glutes-hams', 'gym-full-circuit', 'gym-recovery'],
  },
];

const WORKOUT_IMAGES = {
  quick: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800&auto=format&fit=crop&q=80',
  strength: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
  cardio: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800&auto=format&fit=crop&q=80',
  core: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80',
  stretch: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
  gym: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
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
  GYM_WORKOUTS,
  READY_FREE_EXERCISE_IDS,
  GROUPS as WORKOUT_GROUPS,
  COLLECTIONS,
  listWorkouts,
  listCollections,
  workoutsInCollection,
  imageForWorkout,
};
