export const DAYS = [
  { id: 'mon', label: 'Mon', name: 'Monday' },
  { id: 'tue', label: 'Tue', name: 'Tuesday' },
  { id: 'wed', label: 'Wed', name: 'Wednesday' },
  { id: 'thu', label: 'Thu', name: 'Thursday' },
  { id: 'fri', label: 'Fri', name: 'Friday' },
  { id: 'sat', label: 'Sat', name: 'Saturday' },
  { id: 'sun', label: 'Sun', name: 'Sunday' },
];

const JS_DAY_IDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function todayDayId() {
  const id = JS_DAY_IDS[new Date().getDay()];
  return DAYS.some((day) => day.id === id) ? id : 'mon';
}

export const AVATAR_URI =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop';

export function formatRand(value) {
  return `R ${Number(value).toFixed(2)}`;
}

export const TABS = [
  { id: 'home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { id: 'workouts', label: 'Workouts', icon: 'barbell-outline', iconActive: 'barbell' },
  { id: 'meals', label: 'Meal Planner', icon: 'restaurant-outline', iconActive: 'restaurant' },
  { id: 'community', label: 'Community', icon: 'people-outline', iconActive: 'people' },
  { id: 'profile', label: 'Profile', icon: 'person-outline', iconActive: 'person' },
];
