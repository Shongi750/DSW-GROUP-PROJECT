// Training parameters per goal, taken from resistance-training meta-analyses rather than
// gym folklore. Every number here should be traceable to an entry in REFERENCES.

export const REFERENCES = {
  volumeDose: {
    label: 'Schoenfeld, Ogborn & Krieger (2017), J Sports Sci',
    takeaway: 'Muscle growth scales with weekly sets per muscle; 10+ sets beats fewer.',
  },
  frequency: {
    label: 'Schoenfeld, Ogborn & Krieger (2016), Sports Medicine',
    takeaway: 'Training a muscle twice a week beats once a week at matched volume.',
  },
  loadRange: {
    label: 'Schoenfeld, Grgic, Ogborn & Krieger (2017), J Strength Cond Res',
    takeaway: 'Hypertrophy is similar across loads taken near failure; strength favours heavy loads.',
  },
  restIntervals: {
    label: 'Grgic et al. (2017), Eur J Sport Sci',
    takeaway: 'Rests of 2 minutes or more beat sub-minute rests for growth and strength.',
  },
  progression: {
    label: 'ACSM Position Stand (2009), Med Sci Sports Exerc',
    takeaway: 'Progressive overload plus planned lighter weeks drives long-term adaptation.',
  },
  rir: {
    label: 'Helms, Cronin, Storey & Zourdos (2016), Strength Cond J',
    takeaway: 'Reps-in-reserve lets you autoregulate effort instead of guessing percentages.',
  },
  intervals: {
    label: 'Helgerud et al. (2007), Med Sci Sports Exerc',
    takeaway: 'Hard 4-minute intervals raise VO2max more than easy steady-state work.',
  },
  hiitBody: {
    label: 'Wewege et al. (2017), Obesity Reviews',
    takeaway: 'Intervals and steady cardio change body composition similarly; intervals take less time.',
  },
  muscleRetention: {
    label: 'Cava, Yeat & Mittendorfer (2017), Advances in Nutrition',
    takeaway: 'Resistance training plus adequate protein protects lean mass while losing fat.',
  },
  protein: {
    label: 'Morton et al. (2018), Br J Sports Med',
    takeaway: 'Protein intake up to about 1.6 g per kg bodyweight improves training gains.',
  },
  stretching: {
    label: 'Behm, Blazevich, Kay & McHugh (2016), Appl Physiol Nutr Metab',
    takeaway: 'Long static holds before lifting hurt performance; save them for after or standalone.',
  },
  landmarks: {
    label: 'Israetel et al., Scientific Principles of Hypertrophy Training (practitioner model)',
    takeaway: 'Useful weekly set landmarks per muscle: roughly 8 minimum, 14 productive, 22 ceiling.',
  },
};

// Weekly direct sets per muscle. Not peer-reviewed law, a planning heuristic.
export const VOLUME_LANDMARKS = { min: 8, target: 14, max: 22 };

export const MUSCLE_LABELS = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  core: 'Core',
};

export const GOALS = [
  {
    id: 'hypertrophy',
    name: 'Build muscle',
    blurb: 'Moderate reps close to failure, enough weekly sets per muscle, twice-weekly frequency.',
    icon: 'barbell-outline',
    mainReps: [6, 12],
    accessoryReps: [10, 15],
    mainSets: 3,
    accessorySets: 3,
    rir: 2,
    restMain: 120,
    restAccessory: 75,
    conditioningPerWeek: 0,
    coreSlots: 1,
    why: [
      'Weekly sets per muscle drive growth, so the split repeats each muscle twice a week.',
      'Loads sit in the 6-12 rep range with 1-3 reps left in reserve.',
      'Rests of about 2 minutes on main lifts protect the total sets you can complete.',
    ],
    references: ['volumeDose', 'frequency', 'loadRange', 'restIntervals', 'protein'],
  },
  {
    id: 'strength',
    name: 'Get stronger',
    blurb: 'Heavy low-rep main lifts first, long rests, lighter accessory work after.',
    icon: 'trophy-outline',
    mainReps: [3, 6],
    accessoryReps: [8, 12],
    mainSets: 4,
    accessorySets: 3,
    rir: 2,
    restMain: 180,
    restAccessory: 90,
    conditioningPerWeek: 0,
    coreSlots: 1,
    why: [
      'Strength is load-specific, so main lifts stay in the 3-6 rep range.',
      'Main lifts get 3 minutes of rest so the next set is not limited by fatigue.',
      'Accessories still use moderate reps to add muscle without wrecking recovery.',
    ],
    references: ['loadRange', 'restIntervals', 'progression', 'rir'],
  },
  {
    id: 'fatloss',
    name: 'Lose fat, keep muscle',
    blurb: 'Full-body lifting to defend lean mass, plus two conditioning sessions a week.',
    icon: 'flame-outline',
    mainReps: [8, 12],
    accessoryReps: [12, 15],
    mainSets: 3,
    accessorySets: 2,
    rir: 2,
    restMain: 90,
    restAccessory: 60,
    conditioningPerWeek: 2,
    coreSlots: 2,
    why: [
      'Lifting is what keeps muscle while you are in a calorie deficit; cardio alone does not.',
      'Conditioning is added on top rather than replacing the lifting.',
      'Fat loss still comes from your food intake, so protein stays high.',
    ],
    references: ['muscleRetention', 'protein', 'hiitBody'],
  },
  {
    id: 'endurance',
    name: 'Build conditioning',
    blurb: 'Interval work for VO2max with enough lifting to keep muscle and joints healthy.',
    icon: 'pulse-outline',
    mainReps: [12, 20],
    accessoryReps: [15, 25],
    mainSets: 3,
    accessorySets: 2,
    rir: 3,
    restMain: 60,
    restAccessory: 45,
    conditioningPerWeek: 3,
    coreSlots: 1,
    why: [
      'Hard intervals near maximum effort raise VO2max faster than easy steady work.',
      'Reps stay higher and rests shorter to build local muscular endurance.',
      'Two lifting slots per week remain so you keep strength while conditioning.',
    ],
    references: ['intervals', 'hiitBody', 'progression'],
  },
  {
    id: 'mobility',
    name: 'Move better',
    blurb: 'Short daily mobility flows with light strength work through full range.',
    icon: 'body-outline',
    mainReps: [8, 12],
    accessoryReps: [10, 15],
    mainSets: 2,
    accessorySets: 2,
    rir: 4,
    restMain: 45,
    restAccessory: 30,
    conditioningPerWeek: 0,
    coreSlots: 2,
    why: [
      'Range of motion improves with frequent short sessions rather than rare long ones.',
      'Long static holds go at the end, since they blunt strength if done first.',
      'Light loaded work through full range keeps the new range usable.',
    ],
    references: ['stretching', 'progression'],
  },
];

export const EQUIPMENT_TIERS = [
  {
    id: 'bodyweight',
    name: 'Bodyweight only',
    blurb: 'Floor space. Progress by reps, tempo and harder variations.',
    icon: 'home-outline',
  },
  {
    id: 'dumbbell',
    name: 'Dumbbells and bands',
    blurb: 'Home setup with adjustable load. The best trade-off for most people.',
    icon: 'fitness-outline',
  },
  {
    id: 'gym',
    name: 'Full gym',
    blurb: 'Barbells, machines and cables for heavy progressive loading.',
    icon: 'business-outline',
  },
];

export const EXPERIENCE_LEVELS = [
  { id: 'new', name: 'New to training', blurb: 'Under 6 months of consistent lifting.' },
  { id: 'returning', name: 'Coming back', blurb: 'Trained before, restarting now.' },
  { id: 'trained', name: 'Trained', blurb: 'A year or more of steady training.' },
];

export function getGoal(id) {
  return GOALS.find((goal) => goal.id === id) || GOALS[0];
}

export function goalReferences(goal) {
  return (goal.references || []).map((key) => ({ key, ...REFERENCES[key] })).filter((item) => item.label);
}
