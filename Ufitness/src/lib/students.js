import { isSupabaseConfigured, supabase } from './supabase';

function rowToStudent(row) {
  return {
    id: row.id,
    name: row.name || 'Student',
    campus: row.campus || '',
    fitnessGoal: row.fitness_goal || '',
    experienceLevel: row.experience_level || '',
    workoutLocation: row.workout_location || '',
    yearOfStudy: row.year_of_study || '',
    course: row.course || '',
    avatarUrl: row.avatar_url || '',
    preferredSchedule: [],
  };
}

export async function listStudents() {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase.rpc('list_students');
    if (error || !Array.isArray(data)) return [];
    return data.map(rowToStudent).filter((student) => student.name && student.name !== 'Student');
  } catch {
    return [];
  }
}
