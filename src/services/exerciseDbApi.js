// src/services/exerciseDbApi.js

const HOST = 'exercisedb.p.rapidapi.com';
const BASE_URL = `https://${HOST}`;

// Your RapidAPI Key (you can grab a free-tier key on RapidAPI for ExerciseDB)
const RAPIDAPI_KEY = '3de46734b6msh4b3399cacfb4941p1be7bcjsnce56c3474605';

export async function fetchExerciseDBPlans() {
  try {
    const response = await fetch(`${BASE_URL}/exercises?limit=8`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': HOST
      }
    });

    if (!response.ok) {
      throw new Error(`ExerciseDB API error: ${response.status}`);
    }

    const exercises = await response.json();

    // Map the live API items into structured routines for your app
    const formattedPlans = [
      {
        id: 'db_plan_1',
        title: 'Full Body Ignition',
        category: 'Strength',
        level: 'Beginner',
        duration: '30 Min',
        imageUrl: exercises[0]?.gifUrl,
        exercises: exercises.slice(0, 4).map((ex) => ({
          id: ex.id,
          name: ex.name.toUpperCase(),
          category: ex.bodyPart,
          sets: 3,
          reps: '10-12',
          description: ex.instructions?.[0] || 'Maintain steady controlled breathing and full range of motion.',
          gifUrl: ex.gifUrl // Real ExerciseDB professional demonstration GIF!
        }))
      },
      {
        id: 'db_plan_2',
        title: 'Core & Upper Power',
        category: 'Conditioning',
        level: 'Intermediate',
        duration: '25 Min',
        imageUrl: exercises[4]?.gifUrl,
        exercises: exercises.slice(4, 8).map((ex) => ({
          id: ex.id,
          name: ex.name.toUpperCase(),
          category: ex.bodyPart,
          sets: 3,
          reps: '12-15',
          description: ex.instructions?.[0] || 'Focus on form and controlled eccentric movement.',
          gifUrl: ex.gifUrl
        }))
      }
    ];

    return formattedPlans;
  } catch (error) {
    console.error('Failed to fetch from ExerciseDB:', error);
    return [];
  }
}