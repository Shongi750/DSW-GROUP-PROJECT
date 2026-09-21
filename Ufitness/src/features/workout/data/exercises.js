function ex(id, name, focus, extra = {}) {
  return {
    id,
    name,
    focus,
    howToFocus: extra.howToFocus || focus,
    duration: extra.duration || 40,
    mode: extra.mode || 'sets',
    sets: extra.sets ?? 3,
    reps: extra.reps ?? 10,
    rest: extra.rest ?? 30,
    equipment: extra.equipment || 'none',
    swapId: extra.swapId,
    avoidIf: extra.avoidIf,
    instructions: extra.instructions || [
      `Set up for ${name} with a stable base.`,
      'Move with control. Stop if you feel sharp pain.',
    ],
    muscleHint: extra.muscleHint || `Keep tension on ${focus[0] || 'the working muscles'}.`,
  };
}

export const exercises = [
  ex('arm-circles', 'Arm Circles', ['Shoulders', 'Arm'], {
    mode: 'timed',
    duration: 30,
    rest: 15,
    sets: 1,
    instructions: ['Arms out at shoulder height.', 'Circle forward, then backward.'],
  }),
  ex('jumping-jacks', 'Jumping Jacks', ['Full body', 'Cardio'], {
    mode: 'timed',
    duration: 30,
    rest: 15,
    swapId: 'march-in-place',
    instructions: ['Feet together, arms at sides.', 'Jump out and raise arms, then return.'],
  }),
  ex('bodyweight-squat', 'Bodyweight Squat', ['Legs', 'Glutes'], {
    howToFocus: ['Quads', 'Glutes'],
    reps: 12,
    swapId: 'wall-sit',
    instructions: ['Feet shoulder-width.', 'Sit hips back and down, then stand.'],
  }),
  ex('push-up', 'Push Up', ['Chest', 'Arm'], {
    howToFocus: ['Chest', 'Triceps'],
    reps: 8,
    instructions: ['Hands under shoulders in a plank.', 'Lower chest, then press up. Knees ok.'],
  }),
  ex('plank', 'Plank Hold', ['Core', 'Shoulders'], {
    mode: 'timed',
    duration: 30,
    rest: 20,
    howToFocus: ['Abs', 'Shoulders'],
  }),
  ex('wall-sit', 'Wall Sit', ['Legs', 'Glutes'], {
    mode: 'timed',
    duration: 30,
    howToFocus: ['Quads'],
  }),
  ex('march-in-place', 'March in Place', ['Cardio', 'Legs'], {
    mode: 'timed',
    duration: 30,
    rest: 15,
  }),
  ex('glute-bridge', 'Glute Bridge', ['Glutes', 'Core'], { reps: 12 }),
  ex('reverse-lunge', 'Reverse Lunge', ['Legs', 'Glutes'], {
    reps: 8,
    swapId: 'glute-bridge',
    instructions: ['Step one foot back and lower.', 'Drive through the front heel. Alternate.'],
  }),
  ex('knee-push-up', 'Knee Push Up', ['Chest', 'Arm'], { reps: 10 }),
  ex('dead-bug', 'Dead Bug', ['Core'], { reps: 8, mode: 'sets' }),
  ex('bird-dog', 'Bird Dog', ['Core', 'Back'], { reps: 8 }),
  ex('superman', 'Superman', ['Back'], { mode: 'timed', duration: 25, rest: 20, sets: 1 }),
  ex('good-morning', 'Bodyweight Good Morning', ['Back', 'Glutes'], { reps: 12 }),
  ex('calf-raise', 'Calf Raise', ['Legs'], { reps: 15, howToFocus: ['Calves'] }),
  ex('side-plank', 'Side Plank', ['Core'], { mode: 'timed', duration: 20, rest: 20, sets: 1 }),
  ex('mountain-climber', 'Mountain Climber', ['Cardio', 'Core'], {
    mode: 'timed',
    duration: 30,
    rest: 20,
    swapId: 'dead-bug',
  }),
  ex('high-knees', 'High Knees', ['Cardio', 'Legs'], {
    mode: 'timed',
    duration: 25,
    rest: 20,
    swapId: 'march-in-place',
  }),
  ex('shoulder-taps', 'Shoulder Taps', ['Core', 'Shoulders'], { reps: 12 }),
  ex('tricep-dip', 'Bench Dip', ['Arm'], { howToFocus: ['Triceps'], reps: 10, equipment: 'chair' }),
  ex('pike-push-up', 'Pike Push Up', ['Shoulders'], { reps: 8 }),
  ex('hollow-hold', 'Hollow Hold', ['Core'], { mode: 'timed', duration: 20, rest: 25, sets: 1 }),
  ex('hip-hinge', 'Hip Hinge', ['Back', 'Glutes'], { reps: 12 }),
  ex('split-squat', 'Split Squat', ['Legs', 'Glutes'], { reps: 8, swapId: 'wall-sit' }),
  ex('curl-to-press', 'Curl to Press', ['Arm', 'Shoulders'], { reps: 10, equipment: 'optional dumbbells' }),
  ex('row', 'Backpack Row', ['Back', 'Arm'], { reps: 10, equipment: 'backpack' }),
  ex('chest-floor-press', 'Floor Press', ['Chest', 'Arm'], { reps: 10, equipment: 'optional dumbbells' }),
  ex('jump-squat', 'Jump Squat', ['Legs', 'Cardio'], {
    mode: 'timed',
    duration: 20,
    rest: 25,
    swapId: 'bodyweight-squat',
  }),
  ex('inchworm', 'Inchworm', ['Full body', 'Core'], { reps: 6, rest: 25 }),
  ex('world-greatest', "World's Greatest Stretch", ['Mobility'], { reps: 6, rest: 15 }),
  ex('cat-cow', 'Cat Cow', ['Mobility', 'Back'], { mode: 'timed', duration: 40, rest: 10, sets: 1 }),
  ex('hip-opener', '90/90 Hip Opener', ['Mobility'], { mode: 'timed', duration: 40, rest: 10, sets: 1 }),
  ex('hamstring-fold', 'Forward Fold', ['Mobility', 'Legs'], { mode: 'timed', duration: 30, rest: 10, sets: 1 }),
  ex('glute-stretch', 'Figure-4 Stretch', ['Mobility', 'Glutes'], { mode: 'timed', duration: 30, rest: 10, sets: 1 }),
  ex('burpee', 'Burpee', ['Full body', 'Cardio'], {
    mode: 'timed',
    duration: 20,
    rest: 30,
    swapId: 'inchworm',
  }),
];

export function getExercise(id) {
  return exercises.find((item) => item.id === id);
}

export function getExercisesByIds(ids) {
  return ids.map((id) => getExercise(id)).filter(Boolean);
}

export function exercisesByFocus(label) {
  const needle = (label || '').toLowerCase();
  if (!needle || needle === 'all') return exercises;
  return exercises.filter((item) =>
    [...item.focus, ...(item.howToFocus || [])].some((tag) => tag.toLowerCase().includes(needle))
  );
}
