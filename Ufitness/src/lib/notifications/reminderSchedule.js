// Pure reminder rules (no native code) so Jest can test them.
// Turns the saved reminder settings into the list of local notifications to schedule.
//
// Weekdays: settings use JS days (0 = Sunday … 6 = Saturday, same as Date#getDay).
// expo-notifications WEEKLY triggers use 1 = Sunday … 7 = Saturday, see toExpoWeekday.

export const CHANNEL_ID = 'reminders';

// Trigger type strings (same values as Notifications.SchedulableTriggerInputTypes).
export const TRIGGER = { DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' };

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MEALS = [
  { key: 'breakfast', label: 'Breakfast', title: 'Breakfast time', body: 'Fuel up before class. Open Meals to see today’s plate.' },
  { key: 'lunch', label: 'Lunch', title: 'Lunch time', body: 'Time to eat. Today’s lunch is in Meals.' },
  { key: 'dinner', label: 'Dinner', title: 'Dinner time', body: 'Dinner is on the plan. Open Meals and log what you ate.' },
];

export const DEFAULT_REMINDERS = {
  // Older toggles (kept so saved settings keep working)
  groceryDay: false, // Sat + Sun 09:00
  gymCheckIn: false, // Mon–Fri 09:00
  lastGrocery: '',
  lastGym: '',
  // Workout reminder: chosen days at a chosen time
  workout: { enabled: false, hour: 17, minute: 0, days: [1, 2, 3, 4, 5] },
  // Meal reminders: every day at their own time
  meals: {
    breakfast: { enabled: false, hour: 7, minute: 30 },
    lunch: { enabled: false, hour: 12, minute: 30 },
    dinner: { enabled: false, hour: 18, minute: 30 },
  },
  // Expo push token (APK / dev build only), so the server can send push later
  expoPushToken: '',
};

const GROCERY_DAYS = [6, 0];
const GYM_DAYS = [1, 2, 3, 4, 5];

function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizeTime(raw, fallback) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    enabled: Boolean(src.enabled),
    hour: clampInt(src.hour, 0, 23, fallback.hour),
    minute: clampInt(src.minute, 0, 59, fallback.minute),
  };
}

/** Fill in missing / bad fields so old saved settings (and cloud copies) still load. */
export function normalizeReminders(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const d = DEFAULT_REMINDERS;
  const workoutSrc = src.workout && typeof src.workout === 'object' ? src.workout : {};
  const days = Array.isArray(workoutSrc.days)
    ? [...new Set(workoutSrc.days.map(Number).filter((x) => Number.isInteger(x) && x >= 0 && x <= 6))].sort((a, b) => a - b)
    : [...d.workout.days];
  const mealsSrc = src.meals && typeof src.meals === 'object' ? src.meals : {};
  const meals = {};
  for (const meal of MEALS) meals[meal.key] = normalizeTime(mealsSrc[meal.key], d.meals[meal.key]);
  return {
    groceryDay: Boolean(src.groceryDay),
    gymCheckIn: Boolean(src.gymCheckIn),
    lastGrocery: typeof src.lastGrocery === 'string' ? src.lastGrocery : '',
    lastGym: typeof src.lastGym === 'string' ? src.lastGym : '',
    workout: { ...normalizeTime(workoutSrc, d.workout), days },
    meals,
    expoPushToken: typeof src.expoPushToken === 'string' ? src.expoPushToken : '',
  };
}

export function toExpoWeekday(jsDay) {
  return (((jsDay % 7) + 7) % 7) + 1;
}

export function formatTime(hour, minute) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Every identifier we might schedule (so turning a reminder off always cancels it). */
export function allReminderIds() {
  return [
    ...DAY_LABELS.map((_, day) => `workout-${day}`),
    ...MEALS.map((meal) => `meal-${meal.key}`),
    'grocery-saturday',
    'grocery-sunday',
    'gym-monday',
    'gym-tuesday',
    'gym-wednesday',
    'gym-thursday',
    'gym-friday',
  ];
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function weekly(id, day, hour, minute, title, body, screen) {
  return {
    identifier: id,
    content: { title, body, data: { screen } },
    trigger: { type: TRIGGER.WEEKLY, weekday: toExpoWeekday(day), hour, minute, channelId: CHANNEL_ID },
  };
}

/** The local notifications these settings should have scheduled. */
export function buildSchedule(rawState) {
  const state = normalizeReminders(rawState);
  const out = [];
  const w = state.workout;
  if (w.enabled) {
    for (const day of w.days) {
      out.push(
        weekly(
          `workout-${day}`,
          day,
          w.hour,
          w.minute,
          'Time to train',
          'Your workout is waiting. Open Workout → Today’s workout and tap Start.',
          'Workout'
        )
      );
    }
  }
  for (const meal of MEALS) {
    const m = state.meals[meal.key];
    if (!m.enabled) continue;
    out.push({
      identifier: `meal-${meal.key}`,
      content: { title: meal.title, body: meal.body, data: { screen: 'Meals' } },
      trigger: { type: TRIGGER.DAILY, hour: m.hour, minute: m.minute, channelId: CHANNEL_ID },
    });
  }
  if (state.groceryDay) {
    for (const day of GROCERY_DAYS) {
      out.push(
        weekly(`grocery-${DAY_NAMES[day]}`, day, 9, 0, 'Grocery day', 'Shop for this week’s plates. Open Meals and tap Grocery list.', 'Meals')
      );
    }
  }
  if (state.gymCheckIn) {
    for (const day of GYM_DAYS) {
      out.push(
        weekly(
          `gym-${DAY_NAMES[day]}`,
          day,
          9,
          0,
          'Gym check-in',
          'Log today’s session in Workout, or report how busy campus gym is in Community.',
          'Workout'
        )
      );
    }
  }
  return out;
}

/** One-line summary for the Profile row / sheet. */
export function reminderSummary(rawState) {
  const state = normalizeReminders(rawState);
  const parts = [];
  if (state.workout.enabled && state.workout.days.length) {
    parts.push(`Workout ${formatTime(state.workout.hour, state.workout.minute)}`);
  }
  const meals = MEALS.filter((m) => state.meals[m.key].enabled).length;
  if (meals) parts.push(`${meals} meal${meals === 1 ? '' : 's'}`);
  if (state.groceryDay) parts.push('Grocery day');
  if (state.gymCheckIn) parts.push('Gym check-in');
  return parts.length ? parts.join(' · ') : 'All reminders off';
}
