export const WORKOUTS = [
  {
    id: 'full-body-power',
    title: 'Full Body Power',
    category: 'STRENGTH',
    durationMin: 45,
    level: 'Int/Adv',
    location: 'Gym',
    image:
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    description:
      'A high-intensity session focusing on core strength and explosive movements designed for busy campus days.',
    exercises: [
      { name: 'Barbell back squat', sets: '4 × 8', rest: '90s' },
      { name: 'Bench press', sets: '4 × 8', rest: '90s' },
      { name: 'Bent-over row', sets: '3 × 10', rest: '60s' },
      { name: 'Romanian deadlift', sets: '3 × 10', rest: '60s' },
      { name: 'Walking lunges', sets: '3 × 12', rest: '45s' },
      { name: 'Plank', sets: '3 × 40s', rest: '30s' },
    ],
  },
  {
    id: 'upper-push',
    title: 'Upper Body Push',
    category: 'STRENGTH',
    durationMin: 40,
    level: 'Intermediate',
    location: 'Gym',
    image:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=80',
    description: 'Chest, shoulders and triceps work you can run in a campus gym between classes.',
    exercises: [
      { name: 'Incline dumbbell press', sets: '4 × 10', rest: '75s' },
      { name: 'Overhead press', sets: '3 × 8', rest: '75s' },
      { name: 'Cable fly', sets: '3 × 12', rest: '45s' },
      { name: 'Tricep pushdown', sets: '3 × 12', rest: '45s' },
      { name: 'Lateral raise', sets: '3 × 15', rest: '30s' },
    ],
  },
  {
    id: 'lower-burn',
    title: 'Lower Body Burn',
    category: 'STRENGTH',
    durationMin: 40,
    level: 'Intermediate',
    location: 'Gym',
    image:
      'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800&auto=format&fit=crop&q=80',
    description: 'Squats, hinges and single-leg work to build legs without a long gym block.',
    exercises: [
      { name: 'Goblet squat', sets: '4 × 10', rest: '75s' },
      { name: 'Hip thrust', sets: '4 × 10', rest: '75s' },
      { name: 'Bulgarian split squat', sets: '3 × 8', rest: '60s' },
      { name: 'Leg curl', sets: '3 × 12', rest: '45s' },
      { name: 'Calf raise', sets: '3 × 15', rest: '30s' },
    ],
  },
  {
    id: 'dorm-bodyweight',
    title: 'Dorm Bodyweight',
    category: 'HOME',
    durationMin: 25,
    level: 'Beginner',
    location: 'Home',
    image:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    description: 'No equipment. Use your room, a residence lounge, or a quiet corridor.',
    exercises: [
      { name: 'Bodyweight squat', sets: '3 × 12', rest: '30s' },
      { name: 'Knee or full push-up', sets: '3 × 8', rest: '30s' },
      { name: 'Glute bridge', sets: '3 × 12', rest: '30s' },
      { name: 'Reverse lunge', sets: '3 × 8 / side', rest: '30s' },
      { name: 'Plank', sets: '3 × 20s', rest: '20s' },
    ],
  },
  {
    id: 'campus-hiit',
    title: 'Campus HIIT',
    category: 'CARDIO',
    durationMin: 20,
    level: 'All levels',
    location: 'Home',
    image:
      'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800&auto=format&fit=crop&q=80',
    description: 'Short intervals you can do on a field, court, or residence common room.',
    exercises: [
      { name: 'Jumping jacks', sets: '40s on / 20s off × 4', rest: '—' },
      { name: 'High knees', sets: '40s on / 20s off × 4', rest: '—' },
      { name: 'Mountain climbers', sets: '40s on / 20s off × 4', rest: '—' },
      { name: 'Squat pulses', sets: '40s on / 20s off × 4', rest: '—' },
    ],
  },
  {
    id: 'core-reset',
    title: 'Core & Mobility',
    category: 'RECOVERY',
    durationMin: 15,
    level: 'Beginner',
    location: 'Home',
    image:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
    description: 'A light reset for exam weeks when you still want to move.',
    exercises: [
      { name: 'Cat-cow', sets: '8 slow reps', rest: '—' },
      { name: 'Dead bug', sets: '3 × 8', rest: '20s' },
      { name: 'Side plank', sets: '3 × 20s / side', rest: '20s' },
      { name: 'Hip opener stretch', sets: '45s / side', rest: '—' },
    ],
  },
];

export function getWorkout(id) {
  return WORKOUTS.find((item) => item.id === id) || WORKOUTS[0];
}

export function workoutsForPreference(preference) {
  if (preference === 'Home') {
    return [...WORKOUTS].sort((a, b) => Number(b.location === 'Home') - Number(a.location === 'Home'));
  }
  if (preference === 'Gym') {
    return [...WORKOUTS].sort((a, b) => Number(b.location === 'Gym') - Number(a.location === 'Gym'));
  }
  return WORKOUTS;
}
