// Movement patterns with an exercise candidate per equipment tier. The generator picks the
// first candidate that the user's injuries allow, so order matters: best option first.
// Refs starting with "free-" resolve to the open exercise library, everything else is a
// local exercise id from data/exercises.js.

const PATTERNS = {
  squat: {
    label: 'Squat',
    primary: ['quads'],
    secondary: ['glutes', 'core'],
    main: true,
    avoidIf: ['knees'],
    bodyweight: ['bodyweight-squat', 'wall-sit'],
    dumbbell: ['free-Dumbbell_Squat', 'bodyweight-squat'],
    gym: ['free-Barbell_Squat', 'free-Leg_Press'],
  },
  hinge: {
    label: 'Hip hinge',
    primary: ['hamstrings', 'glutes'],
    secondary: ['back'],
    main: true,
    avoidIf: ['back'],
    bodyweight: ['hip-hinge', 'glute-bridge'],
    dumbbell: ['free-Romanian_Deadlift', 'hip-hinge'],
    gym: ['free-Barbell_Deadlift', 'free-Romanian_Deadlift'],
  },
  horizontalPush: {
    label: 'Horizontal push',
    primary: ['chest'],
    secondary: ['triceps', 'shoulders'],
    main: true,
    bodyweight: ['push-up', 'knee-push-up'],
    dumbbell: ['free-Dumbbell_Bench_Press', 'push-up'],
    gym: ['free-Barbell_Bench_Press_-_Medium_Grip', 'free-Dumbbell_Bench_Press'],
  },
  inclinePush: {
    label: 'Incline push',
    primary: ['chest'],
    secondary: ['shoulders', 'triceps'],
    bodyweight: ['knee-push-up', 'push-up'],
    dumbbell: ['free-Incline_Dumbbell_Press', 'push-up'],
    gym: ['free-Incline_Dumbbell_Press', 'free-Dips_-_Chest_Version'],
  },
  verticalPush: {
    label: 'Vertical push',
    primary: ['shoulders'],
    secondary: ['triceps'],
    main: true,
    avoidIf: ['shoulders'],
    bodyweight: ['pike-push-up', 'push-up'],
    dumbbell: ['free-Dumbbell_Shoulder_Press', 'pike-push-up'],
    gym: ['free-Barbell_Shoulder_Press', 'free-Dumbbell_Shoulder_Press'],
  },
  horizontalPull: {
    label: 'Horizontal pull',
    primary: ['back'],
    secondary: ['biceps'],
    main: true,
    bodyweight: ['row', 'superman'],
    dumbbell: ['free-One-Arm_Dumbbell_Row', 'row'],
    gym: ['free-Bent_Over_Barbell_Row', 'free-Seated_Cable_Rows'],
  },
  verticalPull: {
    label: 'Vertical pull',
    primary: ['back'],
    secondary: ['biceps'],
    main: true,
    bodyweight: ['row', 'superman'],
    dumbbell: ['free-One-Arm_Dumbbell_Row', 'row'],
    gym: ['free-Pullups', 'free-Wide-Grip_Lat_Pulldown'],
  },
  lunge: {
    label: 'Single-leg',
    primary: ['quads', 'glutes'],
    secondary: ['core'],
    avoidIf: ['knees'],
    bodyweight: ['reverse-lunge', 'split-squat', 'glute-bridge'],
    dumbbell: ['free-Dumbbell_Rear_Lunge', 'reverse-lunge'],
    gym: ['free-Dumbbell_Lunges', 'free-Dumbbell_Rear_Lunge'],
  },
  hipThrust: {
    label: 'Hip extension',
    primary: ['glutes'],
    secondary: ['hamstrings'],
    bodyweight: ['glute-bridge'],
    dumbbell: ['glute-bridge'],
    gym: ['free-Barbell_Hip_Thrust', 'glute-bridge'],
  },
  kneeFlexion: {
    label: 'Hamstring curl',
    primary: ['hamstrings'],
    secondary: [],
    bodyweight: ['glute-bridge'],
    dumbbell: ['free-Romanian_Deadlift'],
    gym: ['free-Lying_Leg_Curls', 'free-Seated_Leg_Curl'],
  },
  lateralRaise: {
    label: 'Side delts',
    primary: ['shoulders'],
    secondary: [],
    avoidIf: ['shoulders'],
    bodyweight: ['arm-circles'],
    dumbbell: ['free-Side_Lateral_Raise'],
    gym: ['free-Side_Lateral_Raise', 'free-Face_Pull'],
  },
  curl: {
    label: 'Elbow flexion',
    primary: ['biceps'],
    secondary: [],
    bodyweight: ['row'],
    dumbbell: ['free-Dumbbell_Bicep_Curl', 'curl-to-press'],
    gym: ['free-Dumbbell_Bicep_Curl', 'free-Chin-Up'],
  },
  tricepExtension: {
    label: 'Elbow extension',
    primary: ['triceps'],
    secondary: [],
    bodyweight: ['tricep-dip', 'knee-push-up'],
    dumbbell: ['tricep-dip', 'free-Dumbbell_Bench_Press'],
    gym: ['free-Triceps_Pushdown', 'free-Dips_-_Triceps_Version'],
  },
  calf: {
    label: 'Calves',
    primary: ['calves'],
    secondary: [],
    bodyweight: ['calf-raise'],
    dumbbell: ['calf-raise'],
    gym: ['free-Standing_Calf_Raises', 'calf-raise'],
  },
  core: {
    label: 'Core',
    primary: ['core'],
    secondary: [],
    bodyweight: ['plank', 'dead-bug', 'side-plank', 'hollow-hold'],
    dumbbell: ['plank', 'dead-bug', 'side-plank'],
    gym: ['free-Hanging_Leg_Raise', 'plank', 'dead-bug'],
  },
  conditioning: {
    label: 'Conditioning',
    primary: [],
    secondary: ['core'],
    timed: true,
    avoidIf: ['knees'],
    bodyweight: ['mountain-climber', 'high-knees', 'burpee', 'march-in-place'],
    dumbbell: ['mountain-climber', 'burpee', 'high-knees'],
    gym: ['mountain-climber', 'burpee', 'high-knees'],
  },
  lowImpactCardio: {
    label: 'Low-impact cardio',
    primary: [],
    secondary: [],
    timed: true,
    bodyweight: ['march-in-place'],
    dumbbell: ['march-in-place'],
    gym: ['march-in-place'],
  },
  mobility: {
    label: 'Mobility',
    primary: [],
    secondary: [],
    timed: true,
    bodyweight: ['cat-cow', 'world-greatest', 'hip-opener', 'hamstring-fold', 'glute-stretch'],
    dumbbell: ['cat-cow', 'world-greatest', 'hip-opener', 'hamstring-fold'],
    gym: ['cat-cow', 'world-greatest', 'hip-opener', 'hamstring-fold'],
  },
  warmup: {
    label: 'Warm-up',
    primary: [],
    secondary: [],
    timed: true,
    bodyweight: ['arm-circles', 'march-in-place', 'cat-cow'],
    dumbbell: ['arm-circles', 'march-in-place', 'cat-cow'],
    gym: ['arm-circles', 'march-in-place', 'cat-cow'],
  },
};

// Day templates are ordered pattern slots. Main patterns come first while you are fresh.
const DAY_TEMPLATES = {
  fullA: { name: 'Full body A', slots: ['squat', 'horizontalPush', 'horizontalPull', 'hinge', 'core'] },
  fullB: { name: 'Full body B', slots: ['hinge', 'verticalPush', 'verticalPull', 'lunge', 'core'] },
  fullC: { name: 'Full body C', slots: ['squat', 'inclinePush', 'horizontalPull', 'hipThrust', 'calf', 'core'] },
  upperA: {
    name: 'Upper A',
    slots: ['horizontalPush', 'horizontalPull', 'verticalPush', 'verticalPull', 'lateralRaise', 'curl'],
  },
  upperB: {
    name: 'Upper B',
    slots: ['verticalPush', 'verticalPull', 'inclinePush', 'horizontalPull', 'tricepExtension', 'curl'],
  },
  lowerA: { name: 'Lower A', slots: ['squat', 'hinge', 'lunge', 'calf', 'core'] },
  lowerB: { name: 'Lower B', slots: ['hinge', 'squat', 'hipThrust', 'kneeFlexion', 'calf', 'core'] },
  push: { name: 'Push', slots: ['horizontalPush', 'verticalPush', 'inclinePush', 'lateralRaise', 'tricepExtension'] },
  pull: { name: 'Pull', slots: ['verticalPull', 'horizontalPull', 'lateralRaise', 'curl'] },
  legs: { name: 'Legs', slots: ['squat', 'hinge', 'lunge', 'calf', 'core'] },
  conditioningDay: {
    name: 'Conditioning',
    slots: ['conditioning', 'conditioning', 'lowImpactCardio', 'core'],
    conditioning: true,
  },
  mobilityDay: {
    name: 'Mobility flow',
    slots: ['mobility', 'mobility', 'mobility', 'core'],
    mobility: true,
  },
};

// Splits by training days per week. Frequency per muscle stays at two or more.
const SPLITS = {
  2: { name: 'Full body twice a week', days: ['fullA', 'fullB'] },
  3: { name: 'Full body three times a week', days: ['fullA', 'fullB', 'fullC'] },
  4: { name: 'Upper / Lower, twice each', days: ['upperA', 'lowerA', 'upperB', 'lowerB'] },
  5: { name: 'Upper / Lower plus Push, Pull, Legs', days: ['upperA', 'lowerA', 'push', 'pull', 'legs'] },
  6: { name: 'Push / Pull / Legs, twice each', days: ['push', 'pull', 'legs', 'upperB', 'lowerB', 'fullC'] },
};

const GOAL_SPLIT_OVERRIDES = {
  endurance: {
    2: { name: 'Full body plus intervals', days: ['fullA', 'conditioningDay'] },
    3: { name: 'Lift, intervals, lift', days: ['fullA', 'conditioningDay', 'fullB'] },
    4: { name: 'Two lifts, two interval days', days: ['fullA', 'conditioningDay', 'fullB', 'conditioningDay'] },
    5: {
      name: 'Three lifts, two interval days',
      days: ['fullA', 'conditioningDay', 'fullB', 'conditioningDay', 'fullC'],
    },
    6: {
      name: 'Three lifts, three interval days',
      days: ['fullA', 'conditioningDay', 'fullB', 'conditioningDay', 'fullC', 'conditioningDay'],
    },
  },
  mobility: {
    2: { name: 'Mobility plus full body', days: ['mobilityDay', 'fullA'] },
    3: { name: 'Mobility flows plus lifting', days: ['mobilityDay', 'fullA', 'mobilityDay'] },
    4: { name: 'Alternating mobility and lifting', days: ['mobilityDay', 'fullA', 'mobilityDay', 'fullB'] },
    5: {
      name: 'Daily mobility with two lifts',
      days: ['mobilityDay', 'fullA', 'mobilityDay', 'fullB', 'mobilityDay'],
    },
    6: {
      name: 'Daily mobility with three lifts',
      days: ['mobilityDay', 'fullA', 'mobilityDay', 'fullB', 'mobilityDay', 'fullC'],
    },
  },
};

export function getPattern(id) {
  return PATTERNS[id];
}

export function getDayTemplate(id) {
  return DAY_TEMPLATES[id];
}

export function getSplit(goalId, daysPerWeek) {
  const days = Math.min(6, Math.max(2, daysPerWeek || 3));
  const override = GOAL_SPLIT_OVERRIDES[goalId]?.[days];
  return override || SPLITS[days];
}

// Ids the generated plans depend on, so the catalog loader can guarantee they are present.
export const planFreeExerciseIds = new Set(
  Object.values(PATTERNS)
    .flatMap((pattern) => [...(pattern.bodyweight || []), ...(pattern.dumbbell || []), ...(pattern.gym || [])])
    .filter((ref) => ref.startsWith('free-'))
    .map((ref) => ref.slice('free-'.length))
);
