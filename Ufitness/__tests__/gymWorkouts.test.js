import {
  GYM_WORKOUTS,
  READY_FREE_EXERCISE_IDS,
  WORKOUT_GROUPS,
  listWorkouts,
  workoutsInCollection,
} from '../src/features/workout/data/readyWorkouts';
import { exercises } from '../src/features/workout/data/exercises';
import { openExtras } from '../src/features/workout/lib/freeExercises';

// Checked against yuhonas/free-exercise-db (the library the catalog loads) on 2026-10-09.
const CONFIRMED_FREE_IDS = [
  'Barbell_Bench_Press_-_Medium_Grip', 'Bent_Over_Barbell_Row', 'Barbell_Shoulder_Press', 'Pullups',
  'Dips_-_Triceps_Version', 'Barbell_Curl', 'Barbell_Squat', 'Leg_Press', 'Dumbbell_Lunges',
  'Leg_Extensions', 'Standing_Calf_Raises', 'Hanging_Leg_Raise', 'Barbell_Deadlift',
  'Wide-Grip_Lat_Pulldown', 'Seated_Cable_Rows', 'T-Bar_Row_with_Handle', 'Face_Pull',
  'Hyperextensions_Back_Extensions', 'Barbell_Hip_Thrust', 'Romanian_Deadlift', 'Lying_Leg_Curls',
  'Dumbbell_Step_Ups', 'Glute_Kickback', 'Single_Leg_Glute_Bridge', 'Goblet_Squat',
  'Dumbbell_Bench_Press', 'One-Arm_Dumbbell_Row', 'Dumbbell_Rear_Lunge', 'Dumbbell_Shoulder_Press',
  'Rowing_Stationary',
];

const localIds = new Set(exercises.map((item) => item.id));

describe('gym split ready workouts', () => {
  test('six sessions from the gym split', () => {
    expect(GYM_WORKOUTS.map((w) => w.name)).toEqual([
      'Upper Power',
      'Lower / Quads',
      'Back Builder',
      'Glutes / Hams',
      'Full-Body Circuit',
      'Gym Recovery',
    ]);
  });

  test('every move is a confirmed free-db id or a local UFitness id', () => {
    GYM_WORKOUTS.forEach((workout) => {
      workout.moves.forEach((move) => {
        if (move.id.startsWith('free-')) {
          expect(CONFIRMED_FREE_IDS).toContain(move.id.slice('free-'.length));
        } else {
          expect(localIds.has(move.id)).toBe(true);
        }
      });
    });
  });

  test('moves carry real programming and match exerciseIds', () => {
    GYM_WORKOUTS.forEach((workout) => {
      expect(workout.group).toBe('gym');
      expect(workout.moves.length).toBeGreaterThanOrEqual(6);
      expect(workout.exerciseIds).toEqual(workout.moves.map((move) => move.id));
      workout.moves.forEach((move) => {
        if (move.mode === 'sets') {
          expect(move.sets).toBeGreaterThan(0);
          expect(move.reps).toBeGreaterThan(0);
        } else {
          expect(move.duration).toBeGreaterThan(0);
        }
      });
    });
    const hard = GYM_WORKOUTS.filter((w) => w.level === 'Hard');
    expect(hard).toHaveLength(5);
  });

  test('Gym filter and Gym day collection list them', () => {
    expect(WORKOUT_GROUPS.map((g) => g.id)).toContain('gym');
    expect(listWorkouts('', 'gym')).toHaveLength(6);
    expect(workoutsInCollection('gym').map((w) => w.id)).toContain('gym-upper-power');
    expect(listWorkouts('glutes', 'all').map((w) => w.id)).toContain('gym-glutes-hams');
  });

  test('catalog loader always keeps the gym exercises, even non-bodyweight ones', () => {
    expect(READY_FREE_EXERCISE_IDS.has('Barbell_Hip_Thrust')).toBe(true);
    const fakeLibrary = [
      { id: 'Barbell_Hip_Thrust', name: 'Barbell Hip Thrust', equipment: 'barbell', primaryMuscles: ['glutes'] },
      { id: 'Leg_Extensions', name: 'Leg Extensions', equipment: 'machine', primaryMuscles: ['quadriceps'] },
      { id: 'Random_Machine_Move', name: 'Random Machine Move', equipment: 'machine' },
    ];
    const ids = openExtras(fakeLibrary).map((item) => item.id);
    expect(ids).toContain('free-Barbell_Hip_Thrust');
    expect(ids).toContain('free-Leg_Extensions');
    expect(ids).not.toContain('free-Random_Machine_Move');
  });
});
