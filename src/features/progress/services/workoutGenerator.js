// src/services/workoutGenerator.js

export function generateWeeklyPlan(userPreferences) {
  // Extract preferences or fallback to default balanced defaults
  const goal = userPreferences?.goal || 'Strength'; // 'Strength', 'Cardio', 'Flexibility'
  const level = userPreferences?.level || 'Beginner'; // 'Beginner', 'Intermediate'
  const daysPerWeek = userPreferences?.daysPerWeek || 4;

  // Base exercise library mapped by category
  const library = {
    Strength: [
      { id: 's1', name: 'Barbell Squats', category: 'Legs', sets: 4, reps: '8-10', description: 'Keep core tight and drive through heels.' },
      { id: 's2', name: 'Bench Press', category: 'Chest', sets: 4, reps: '8-10', description: 'Control the descent and press up explosively.' },
      { id: 's3', name: 'Deadlifts', category: 'Back', sets: 3, reps: '5-6', description: 'Maintain a neutral spine and engage lats.' },
      { id: 's4', name: 'Overhead Press', category: 'Shoulders', sets: 3, reps: '10', description: 'Press directly overhead without arching lower back.' },
      { id: 's5', name: 'Pull-Ups', category: 'Back', sets: 3, reps: '8', description: 'Pull chest toward the bar with a full extension at the bottom.' }
    ],
    Cardio: [
      { id: 'c1', name: 'High-Intensity Intervals', category: 'Cardio', sets: 5, reps: '45s work / 15s rest', description: 'Max effort sprints or jumping jacks.' },
      { id: 'c2', name: 'Mountain Climbers', category: 'Cardio', sets: 4, reps: '40s', description: 'Drive knees rapidly toward your chest.' },
      { id: 'c3', name: 'Jump Rope / Burpees', category: 'Cardio', sets: 4, reps: '15 reps', description: 'Explosive full-body conditioning movement.' }
    ],
    Mobility: [
      { id: 'm1', name: 'Dynamic Hip Flows', category: 'Flexibility', sets: 3, reps: '10 each side', description: 'Open up hips with controlled sweeping motions.' },
      { id: 'm2', name: 'Plank & Core Stability', category: 'Core', sets: 3, reps: '60s hold', description: 'Solid straight-line posture engagement.' }
    ]
  };

  // Full 7-day schedule mapping
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const schedule = weekDays.map((day, index) => {
    // Determine if it's a rest day based on user's active days preference
    const isRestDay = index >= daysPerWeek;

    if (isRestDay) {
      return {
        day,
        isRest: true,
        title: 'Active Recovery & Rest',
        duration: '0 Min',
        exercises: []
      };
    }

    // Build day-specific workout based on goal
    let dayTitle = 'Full Body Conditioning';
    let exercises = [];

    if (goal === 'Strength') {
      if (index % 2 === 0) {
        dayTitle = 'Upper Body Power';
        exercises = [library.Strength[1], library.Strength[3], library.Strength[4]];
      } else {
        dayTitle = 'Lower Body & Core';
        exercises = [library.Strength[0], library.Strength[2], library.Mobility[1]];
      }
    } else {
      dayTitle = 'Cardio & Endurance Ignition';
      exercises = [library.Cardio[0], library.Cardio[1], library.Mobility[0]];
    }

    return {
      day,
      isRest: false,
      title: dayTitle,
      category: goal,
      level: level,
      duration: '35 Min',
      imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80',
      exercises: exercises
    };
  });

  return schedule;
}