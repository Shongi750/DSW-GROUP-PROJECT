import { MENTOR_MIN_YEAR, yearRank } from '../../mentors/lib/matchMentors';
import { sessionStreak } from '../../workout/data/progress';

const MIN_SESSIONS = 8;
const MIN_STREAK = 5;
const MIN_MOVES = 12;

export function resultsFromWorkoutProfile(workoutProfile = {}) {
  const history = workoutProfile.history || [];
  return {
    sessions: history.length,
    streak: sessionStreak(history),
    minutes: history.reduce((sum, item) => sum + Number(item.minutes || 0), 0),
    completedMoves: (workoutProfile.completedExerciseIds || []).length,
  };
}

export function hasSatisfactoryResults(student) {
  if (yearRank(student.yearOfStudy || student.year) < MENTOR_MIN_YEAR) return false;
  return (
    Number(student.sessions || 0) >= MIN_SESSIONS ||
    Number(student.streak || 0) >= MIN_STREAK ||
    Number(student.completedMoves || 0) >= MIN_MOVES
  );
}

export function resultReasons(student) {
  const parts = [];
  if (student.yearOfStudy) parts.push(`${student.yearOfStudy}`);
  if (student.sessions) parts.push(`${student.sessions} logged workouts`);
  if (student.streak) parts.push(`${student.streak}-day streak`);
  if (student.minutes) parts.push(`${student.minutes} active minutes`);
  if (student.completedMoves) parts.push(`${student.completedMoves} moves completed`);
  return parts;
}

export function mentorScore(student) {
  return (
    yearRank(student.yearOfStudy) * 12 +
    Number(student.sessions || 0) * 4 +
    Number(student.streak || 0) * 6 +
    Math.round(Number(student.minutes || 0) / 20) +
    Math.round(Number(student.completedMoves || 0) / 2)
  );
}

export function recommendMentors(students = [], invitedIds = []) {
  return students
    .filter((student) => hasSatisfactoryResults(student) && !invitedIds.includes(student.id))
    .map((student) => {
      const reasons = resultReasons(student);
      return {
        ...student,
        score: mentorScore(student),
        reasons,
        why: reasons.join(', '),
        inviteMessage: `You have done ${reasons.join(', ')}. Would you like to be a mentor for other UJ students?`,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function mergeCloudStudents(seed, cloudStudents = []) {
  const extras = cloudStudents.map((row) => ({
    id: row.id || row.userId,
    name: row.name || 'Student',
    campus: row.campus || 'APK',
    yearOfStudy: row.yearOfStudy || '',
    sessions: Number(row.sessions) || 0,
    streak: Number(row.streak) || 0,
    minutes: Number(row.minutes) || 0,
    completedMoves: Number(row.completedMoves) || 0,
    goal: row.fitnessGoal || 'General fitness',
    live: true,
  }));
  const seen = new Set(extras.flatMap((row) => [row.id, row.name]));
  return [...extras, ...seed.filter((item) => !seen.has(item.id) && !seen.has(item.name))];
}

export function mergeLiveStudent(seed, profile, workoutProfile) {
  if (!profile?.name) return seed;
  const live = resultsFromWorkoutProfile(workoutProfile);
  const row = {
    id: profile.userId || profile.email || 'live-student',
    name: profile.name,
    campus: profile.campus || 'APK',
    yearOfStudy: profile.yearOfStudy || '',
    sessions: live.sessions,
    streak: live.streak,
    minutes: live.minutes,
    completedMoves: live.completedMoves,
    goal: profile.fitnessGoal || 'General fitness',
    live: true,
  };
  const without = seed.filter((item) => item.id !== row.id && item.name !== row.name);
  return [row, ...without];
}
