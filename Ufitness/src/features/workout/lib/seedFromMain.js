import { defaultTrainWeekdays } from './trainDays';

// The main app and the workout tab used different words for the same things.
// These maps turn main-profile answers into workout-profile values.

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

// If they already finished the main UFitness setup, we can skip the workout onboarding
export function mainProfileReadyForWorkout(main) {
  if (!main) return false;
  if (main.fitnessGoal) return true;
  if (main.onboardingComplete) return true;
  return false;
}

export function mapMainGoal(value) {
  if (!value) return null;
  if (GOAL_MAP[value]) return GOAL_MAP[value];
  return null;
}

// Copy useful fields from the main profile into the workout profile.
// Returns null if nothing needs to change.
export function applyMainProfileSeed(main, workout) {
  if (!main) return null;
  if (!workout) workout = {};

  // nothing useful on the main side yet
  if (
    !main.fitnessGoal &&
    !main.campus &&
    !main.workoutPreference &&
    !main.daysPerWeek &&
    !main.onboardingComplete
  ) {
    return null;
  }

  const next = {};

  // goal
  const goal = mapMainGoal(main.fitnessGoal);
  if (goal && workout.goal !== goal) {
    next.goal = goal;
  }

  // experience — leave it alone if planBoost already bumped them up
  const experience = EXPERIENCE_MAP[main.experienceLevel];
  if (experience && !workout.planBoost && workout.experience !== experience) {
    next.experience = experience;
  }

  // equipment
  const equipment = EQUIPMENT_MAP[main.workoutPreference];
  if (equipment && workout.equipmentTier !== equipment) {
    next.equipmentTier = equipment;
  }

  // campus + gender
  if (main.campus && workout.campus !== main.campus) {
    next.campus = main.campus;
  }
  if (main.gender && workout.gender !== main.gender) {
    next.gender = main.gender;
  }

  // training days
  const days = Number(main.daysPerWeek) || 0;
  if (days > 0) {
    const want = defaultTrainWeekdays(days);
    const have = workout.trainWeekdays || [];
    let same = have.length === want.length;
    if (same) {
      let i = 0;
      while (i < want.length) {
        if (want[i] !== have[i]) {
          same = false;
          break;
        }
        i = i + 1;
      }
    }
    if (!same) {
      next.trainWeekdays = want;
      next.daysPerWeek = want.length;
    }
  } else if (!workout.trainWeekdays || workout.trainWeekdays.length === 0) {
    next.trainWeekdays = defaultTrainWeekdays(workout.daysPerWeek || 4);
    next.daysPerWeek = next.trainWeekdays.length;
  }

  if (!workout.planStartedAt) {
    next.planStartedAt = new Date().toISOString();
  }

  // skip the nested workout signup if main is already done
  if (mainProfileReadyForWorkout(main)) {
    if (!workout.onboarded) next.onboarded = true;
    if (!workout.acceptedDisclaimer) next.acceptedDisclaimer = true;
  }

  // if we didn't change anything, tell the caller to skip
  if (Object.keys(next).length === 0) return null;
  return next;
}
