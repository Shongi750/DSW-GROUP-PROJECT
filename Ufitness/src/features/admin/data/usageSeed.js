/** Campus cohort used until Firestore usage events feed Power BI. */

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const USAGE_BY_DAY = [
  { label: 'Mon', users: 86, sessions: 54 },
  { label: 'Tue', users: 92, sessions: 61 },
  { label: 'Wed', users: 101, sessions: 70 },
  { label: 'Thu', users: 97, sessions: 66 },
  { label: 'Fri', users: 74, sessions: 41 },
  { label: 'Sat', users: 58, sessions: 33 },
  { label: 'Sun', users: 49, sessions: 22 },
];

export const USAGE_BY_CAMPUS = [
  { label: 'APK', users: 148 },
  { label: 'APB', users: 91 },
  { label: 'DFC', users: 77 },
  { label: 'SWC', users: 64 },
];

export const USAGE_BY_MODULE = [
  { label: 'Workout', users: 210 },
  { label: 'Meals', users: 176 },
  { label: 'Community', users: 132 },
  { label: 'Mentors', users: 48 },
];

export const SEED_STUDENTS = [
  {
    id: 'stu-lerato',
    name: 'Lerato Khumalo',
    campus: 'APK',
    yearOfStudy: '3rd Year',
    sessions: 22,
    streak: 8,
    minutes: 640,
    completedMoves: 48,
    goal: 'Build muscle',
  },
  {
    id: 'stu-thabo',
    name: 'Thabo Mokoena',
    campus: 'APB',
    yearOfStudy: '4th Year',
    sessions: 19,
    streak: 6,
    minutes: 510,
    completedMoves: 36,
    goal: 'Strength',
  },
  {
    id: 'stu-aisha',
    name: 'Aisha Rahman',
    campus: 'DFC',
    yearOfStudy: '3rd Year',
    sessions: 16,
    streak: 5,
    minutes: 420,
    completedMoves: 29,
    goal: 'Endurance',
  },
  {
    id: 'stu-bongani',
    name: 'Bongani Sithole',
    campus: 'SWC',
    yearOfStudy: '2nd Year',
    sessions: 14,
    streak: 4,
    minutes: 300,
    completedMoves: 18,
    goal: 'General fitness',
  },
  {
    id: 'stu-zanele',
    name: 'Zanele Dlamini',
    campus: 'APK',
    yearOfStudy: '1st Year',
    sessions: 6,
    streak: 2,
    minutes: 140,
    completedMoves: 9,
    goal: 'Weight management',
  },
];
