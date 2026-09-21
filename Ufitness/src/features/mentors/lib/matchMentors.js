export function yearRank(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('post')) return 5;
  if (text.includes('4')) return 4;
  if (text.includes('3')) return 3;
  if (text.includes('2')) return 2;
  if (text.includes('1')) return 1;
  return 0;
}

/** Peer mentors must be 3rd year or above. */
export const MENTOR_MIN_YEAR = 3;

export function isEligibleMentor(mentor) {
  return yearRank(mentor?.year) >= MENTOR_MIN_YEAR;
}

export function mentorMatchesStudent(mentor, studentYear) {
  if (!isEligibleMentor(mentor)) return false;
  const menteeRank = yearRank(studentYear);
  if (!menteeRank) return true;
  return yearRank(mentor.year) >= menteeRank;
}
