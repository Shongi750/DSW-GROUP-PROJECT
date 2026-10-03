export const UJ_CAMPUSES = [
  'APK (Auckland Park Kingsway)',
  'APB (Auckland Park Bunting Road)',
  'DFC (Doornfontein)',
  'SWC (Soweto)',
];

export type Profile = {
  name: string;
  avatarUri: string | null;
  residenceCampus: string;
  studyCampus: string;
};

export type Comment = {
  id: string;
  author: string;
  avatarUri?: string | null;
  text: string;
};

export type WorkoutStats = {
  title: string;
  durationMinutes: string;
  totalWeightKg?: string;
  distanceKm?: string;
};

export type GymGoal = 'Pre-workout' | 'Post-workout' | 'High-protein' | 'Cut' | 'Bulk';

export type GymRecipe = {
  title: string;
  goal: GymGoal;
  ingredients: string[];
  steps: string[];
  youtubeId?: string;
  youtubeTitle?: string;
};

export type WorkoutClip = {
  title: string;
  videoUri: string;
  musicTitle: string;
  musicArtist?: string;
};

export type Post = {
  id: string;
  author: string;
  avatarUri?: string | null;
  text: string;
  imageUri?: any;
  likes: number;
  comments: Comment[];
  isCheckIn?: boolean;
  busynessStatus?: 'Quiet' | 'Moderate' | 'Packed';
  campus?: string;
  workoutStats?: WorkoutStats;
  recipe?: GymRecipe;
  workoutClip?: WorkoutClip;
  meta?: string;
  tags?: string[];
};

export const GYM_GOALS: GymGoal[] = ['Pre-workout', 'Post-workout', 'High-protein', 'Cut', 'Bulk'];

export const GYM_PLANNER_MEALS = [
  { id: 'pap-eggs', goal: 'Post-workout' as GymGoal },
  { id: 'eggs-toast', goal: 'Pre-workout' as GymGoal },
  { id: 'tuna-sandwich', goal: 'High-protein' as GymGoal },
  { id: 'chicken-rice', goal: 'Bulk' as GymGoal },
  { id: 'chicken-sandwich', goal: 'Post-workout' as GymGoal },
  { id: 'pasta-soya', goal: 'High-protein' as GymGoal },
];

export function parseYouTubeId(input: string): string | null {
  const raw = (input || '').trim();
  if (!raw) return null;
  const match =
    raw.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/) ||
    raw.match(/^([A-Za-z0-9_-]{11})$/);
  return match ? match[1] : null;
}

export type Group = {
  id: string;
  name: string;
  link: string;
  campus?: string;
  imageUri?: any;
  status: 'none' | 'joined';
  about?: string;
  nextSession?: string;
};

export type CampusProgress = {
  campusCode: string;
  completedCount: number;
};

export type Challenge = {
  id: string;
  name: string;
  description: string;
  imageUri?: any;
  joined: boolean;
  campusScores: CampusProgress[];
};

export type GymBusyness = {
  campus: string;
  status: 'Quiet' | 'Moderate' | 'Packed';
  lastUpdated: string;
  reportedBy: string;
  note?: string;
};

export type ChallengeDay = { day: number; label: string; isRest: boolean };

export const PUSHUP_PLAN: ChallengeDay[] = [
  { day: 1, label: '3 x 12', isRest: false },
  { day: 2, label: '3 x 14', isRest: false },
  { day: 3, label: 'Rest', isRest: true },
  { day: 4, label: '4 x 12', isRest: false },
  { day: 5, label: '4 x 14', isRest: false },
  { day: 6, label: 'Rest', isRest: true },
  { day: 7, label: '4 x 15', isRest: false },
  { day: 8, label: '3 x 18', isRest: false },
  { day: 9, label: 'Rest', isRest: true },
  { day: 10, label: 'Max effort test', isRest: false },
  { day: 11, label: '4 x 16', isRest: false },
  { day: 12, label: '4 x 18', isRest: false },
  { day: 13, label: 'Rest', isRest: true },
  { day: 14, label: '5 x 15', isRest: false },
  { day: 15, label: '5 x 16', isRest: false },
  { day: 16, label: 'Rest', isRest: true },
  { day: 17, label: '4 x 20', isRest: false },
  { day: 18, label: '3 x 25', isRest: false },
  { day: 19, label: 'Rest', isRest: true },
  { day: 20, label: 'Max effort test', isRest: false },
  { day: 21, label: '5 x 18', isRest: false },
  { day: 22, label: '5 x 20', isRest: false },
  { day: 23, label: 'Rest', isRest: true },
  { day: 24, label: '4 x 25', isRest: false },
  { day: 25, label: '4 x 27', isRest: false },
  { day: 26, label: 'Rest', isRest: true },
  { day: 27, label: '3 x 30', isRest: false },
  { day: 28, label: '5 x 22', isRest: false },
  { day: 29, label: 'Rest', isRest: true },
  { day: 30, label: 'Final max effort test', isRest: false },
];

export const INITIAL_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'APK Morning Runners',
    campus: 'APK (Auckland Park Kingsway)',
    link: 'myapp://group/g1',
    imageUri: { uri: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80' },
    status: 'none',
    about: 'Easy 5 km loops before lectures. New runners welcome — no pace gate.',
    nextSession: 'Tue 06:15 · APK Kingsway loop',
  },
  {
    id: 'g2',
    name: 'APB Weightlifting Crew',
    campus: 'APB (Auckland Park Bunting Road)',
    link: 'myapp://group/g2',
    imageUri: { uri: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80' },
    status: 'none',
    about: 'Compound lifts, form checks, and a shared squat rack booking at APB.',
    nextSession: 'Wed 17:30 · APB gym floor',
  },
  {
    id: 'g3',
    name: 'DFC Yoga & Stretch',
    campus: 'DFC (Doornfontein)',
    link: 'myapp://group/g3',
    imageUri: { uri: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80' },
    status: 'none',
    about: 'Mobility and recovery after labs. Mats on the DFC courtyard when the studio is full.',
    nextSession: 'Thu 16:00 · DFC courtyard',
  },
  {
    id: 'g4',
    name: 'SWC Soccer Club',
    campus: 'SWC (Soweto)',
    link: 'myapp://group/g4',
    imageUri: { uri: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80' },
    status: 'none',
    about: 'Five-a-side and weekend matches. Boots optional, shin guards if you have them.',
    nextSession: 'Sat 09:00 · SWC field',
  },
];

export const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    name: '30-Day Push-Up Challenge',
    description: 'Build upper body endurance with daily set progressions.',
    imageUri: { uri: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=800&q=80' },
    joined: false,
    campusScores: [
      { campusCode: 'APK', completedCount: 42 },
      { campusCode: 'APB', completedCount: 28 },
      { campusCode: 'DFC', completedCount: 19 },
      { campusCode: 'SWC', completedCount: 31 },
    ],
  },
  {
    id: 'c2',
    name: 'Step Count Sprint',
    description: 'Hit 10,000 steps daily across campus grounds.',
    imageUri: { uri: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80' },
    joined: false,
    campusScores: [
      { campusCode: 'APK', completedCount: 88 },
      { campusCode: 'APB', completedCount: 64 },
      { campusCode: 'DFC', completedCount: 45 },
      { campusCode: 'SWC', completedCount: 52 },
    ],
  },
  {
    id: 'c3',
    name: '500-Squat Leg Blitz',
    description: 'Accumulate 500 squats over 7 days for lower-body power.',
    imageUri: { uri: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80' },
    joined: false,
    campusScores: [
      { campusCode: 'APK', completedCount: 35 },
      { campusCode: 'APB', completedCount: 41 },
      { campusCode: 'DFC', completedCount: 22 },
      { campusCode: 'SWC', completedCount: 18 },
    ],
  },
  {
    id: 'c4',
    name: '5K Campus Dash',
    description: 'Run or walk a total 5km timed attempt around campus.',
    imageUri: { uri: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80' },
    joined: false,
    campusScores: [
      { campusCode: 'APK', completedCount: 60 },
      { campusCode: 'APB', completedCount: 39 },
      { campusCode: 'DFC', completedCount: 51 },
      { campusCode: 'SWC', completedCount: 44 },
    ],
  },
  {
    id: 'c5',
    name: '100-Minute Plank Hold',
    description: 'Log cumulative plank holds until reaching 100 total minutes.',
    imageUri: { uri: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80' },
    joined: false,
    campusScores: [
      { campusCode: 'APK', completedCount: 24 },
      { campusCode: 'APB', completedCount: 19 },
      { campusCode: 'DFC', completedCount: 15 },
      { campusCode: 'SWC', completedCount: 29 },
    ],
  },
];

export const INITIAL_GYM_STATUSES: Record<string, GymBusyness> = {
  APK: { campus: 'APK', status: 'Moderate', lastUpdated: '10 mins ago', reportedBy: 'Thabo M.', note: 'Benches free, cardio packed' },
  APB: { campus: 'APB', status: 'Quiet', lastUpdated: '25 mins ago', reportedBy: 'Lerato K.', note: 'Plenty of free weights' },
  DFC: { campus: 'DFC', status: 'Packed', lastUpdated: '5 mins ago', reportedBy: 'Sipho N.', note: 'Full queue for squat rack' },
  SWC: { campus: 'SWC', status: 'Quiet', lastUpdated: '1 hour ago', reportedBy: 'System', note: 'Normal traffic' },
};

export const INITIAL_POSTS: Post[] = [
  {
    id: 'clip1',
    author: 'Thabo M.',
    text: 'Last three benches at APK. This track carried the set.',
    likes: 14,
    meta: '1 hour ago · APK',
    tags: ['Strength', 'Clip'],
    comments: [{ id: 'clipc1', author: 'Kagiso M.', text: 'Saving this song for Thursday legs.' }],
    workoutClip: {
      title: 'APK bench clip',
      videoUri: 'https://videos.pexels.com/video-files/5319066/5319066-sd_540_960_25fps.mp4',
      musicTitle: 'Power',
      musicArtist: 'Kanye West',
    },
  },
  {
    id: 'r1',
    author: 'Lerato K.',
    text: 'Post-gym plate on a student budget. Eggs for protein, pap to refill glycogen.',
    likes: 11,
    meta: '3 hours ago · APK',
    tags: ['Post-workout', 'Recipe'],
    comments: [{ id: 'rc1', author: 'Thabo M.', text: 'This is what I eat after APK gym too.' }],
    recipe: {
      title: 'Pap & scrambled eggs',
      goal: 'Post-workout',
      ingredients: ['1 cup maize meal', '2 eggs', 'pinch of salt'],
      steps: [
        'Cook stiff pap in a small pot.',
        'Scramble two eggs in a pan.',
        'Plate pap with eggs on the side. Eat within an hour of training.',
      ],
      youtubeId: '0B8Yy45DLi4',
      youtubeTitle: 'Fully-Loaded Pap Cups 3-Ways',
    },
  },
  {
    id: 'w1',
    author: 'Kagiso M.',
    text: 'Smashed a new PR on bench press today at APK Gym!',
    imageUri: { uri: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80' },
    likes: 8,
    meta: '2 hours ago · APK',
    tags: ['Strength', 'Main Gym'],
    comments: [{ id: 'c1', author: 'Sipho N.', text: 'Light weight baby!' }],
    workoutStats: {
      title: 'Upper Body Power',
      durationMinutes: '65',
      totalWeightKg: '3,450',
    },
  },
  {
    id: '1',
    author: 'Thabo M.',
    text: 'Anyone up for a 6am run tomorrow?',
    imageUri: { uri: 'https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?auto=format&fit=crop&w=800&q=80' },
    likes: 2,
    meta: '5 hours ago · APK',
    tags: ['Cardio', 'Outdoors'],
    comments: [
      { id: 'cm1', author: 'Sipho N.', text: 'Count me in! Meet at APK gym?' },
    ],
  },
  {
    id: 'r2',
    author: 'Sipho N.',
    text: 'Sunday batch-cook for bulk week. IQF chicken and rice lasts three gym days.',
    likes: 6,
    meta: 'Yesterday · DFC',
    tags: ['Bulk', 'Recipe'],
    comments: [],
    recipe: {
      title: 'Chicken & rice stew',
      goal: 'Bulk',
      ingredients: ['IQF chicken pieces', '1 cup rice', 'tomato sauce', 'onion'],
      steps: [
        'Brown the chicken with onion.',
        'Add tomato sauce and simmer until cooked through.',
        'Serve on a cup of rice. Pack leftovers for campus.',
      ],
      youtubeId: 'pe_KDAKKdNE',
      youtubeTitle: '5-Ingredient One-Pot Chicken Rice',
    },
  },
];

