import { defaultTrainWeekdays } from './trainDays';

const GOAL_MAP = {
  weight: 'fatloss',
  'Weight mgmt': 'fatloss',
  'Weight Management': 'fatloss',
  muscle: 'hypertrophy',
  'Muscle building': 'hypertrophy',
  'Build Muscle': 'hypertrophy',
  'Build strength': 'hypertrophy',
  general: 'hypertrophy',
  'General fitness': 'hypertrophy',
  'Improve general fitness': 'hypertrophy',
  endurance: 'endurance',
  Endurance: 'endurance',
  'Improve endurance': 'endurance',
};

const EXPERIENCE_MAP = {
  Beginner: 'new',
  Intermediate: 'returning',
  Advanced: 'trained',
};

const EQUIPMENT_MAP = {
  Home: 'bodyweight',
  Outdoor: 'bodyweight',
  Gym: 'gym',
  'Campus gym': 'gym',
};

export function mapMainGoal(value) {
  return GOAL_MAP[value] || null;
}

export function applyMainProfileSeed(main = {}, workout = {}) {
  if (!main?.fitnessGoal && !main?.campus && !main?.workoutPreference && !main?.daysPerWeek) return null;

  const next = {};
  if (!workout.goal) {
    const goal = mapMainGoal(main.fitnessGoal);
    if (goal) next.goal = goal;
    const experience = EXPERIENCE_MAP[main.experienceLevel];
    if (experience) next.experience = experience;
    const equipment = EQUIPMENT_MAP[main.workoutPreference];
    if (equipment) next.equipmentTier = equipment;
  }
  if (!workout.campus && main.campus) next.campus = main.campus;
  if (!workout.gender && main.gender) next.gender = main.gender;
  if (!workout.trainWeekdays?.length) {
    next.trainWeekdays = defaultTrainWeekdays(workout.daysPerWeek || main.daysPerWeek || 4);
    next.daysPerWeek = next.trainWeekdays.length;
  }
  if (!workout.planStartedAt) next.planStartedAt = new Date().toISOString();

  return Object.keys(next).length ? next : null;
}
