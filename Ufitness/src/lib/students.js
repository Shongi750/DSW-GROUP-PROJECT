import { isSupabaseConfigured, supabase } from './supabase';
import { normalizeRoles } from './roles';

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
    // roles + appear_as_mentor come from list_students() (schema section 8a)
    roles: normalizeRoles(row.roles),
    appearAsMentor: row.appear_as_mentor !== false,
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

/** Students who hold the mentor role and have not hidden themselves. */
export function mentorsFrom(students, myId) {
  return (students || []).filter(
    (student) =>
      student.id !== myId &&
      student.appearAsMentor !== false &&
      Array.isArray(student.roles) &&
      student.roles.includes('mentor')
  );
}
