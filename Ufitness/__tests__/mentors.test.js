// students.js imports the Supabase client; tests only need the pure filter.
jest.mock('../src/lib/supabase', () => ({ isSupabaseConfigured: false, supabase: null }));

import { mentorsFrom } from '../src/lib/students';
import { mentorMatchesStudent } from '../src/features/mentors/lib/matchMentors';

describe('real mentors', () => {
  const students = [
    { id: 'me', roles: ['student', 'mentor'], appearAsMentor: true },
    { id: 'a', roles: ['student', 'mentor'], appearAsMentor: true, year: '3rd Year' },
    { id: 'b', roles: ['student'], appearAsMentor: true },
    { id: 'c', roles: ['student', 'mentor'], appearAsMentor: false },
    { id: 'd' },
  ];

  test('only students with the mentor role who did not opt out, never yourself', () => {
    expect(mentorsFrom(students, 'me').map((s) => s.id)).toEqual(['a']);
    expect(mentorsFrom(null, 'me')).toEqual([]);
  });

  test('mentors must be 3rd year+ and at or above the student year', () => {
    expect(mentorMatchesStudent({ year: '3rd Year' }, '1st Year')).toBe(true);
    expect(mentorMatchesStudent({ year: '2nd Year' }, '1st Year')).toBe(false);
    expect(mentorMatchesStudent({ year: '3rd Year' }, '4th Year')).toBe(false);
    expect(mentorMatchesStudent({ year: 'Postgrad' }, '')).toBe(true);
  });
});
