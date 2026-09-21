const DEFAULT_BY_COUNT = {
  2: [2, 5],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
};

export const TRAIN_DAY_OPTIONS = [
  { value: 1, label: 'Mon', full: 'Monday' },
  { value: 2, label: 'Tue', full: 'Tuesday' },
  { value: 3, label: 'Wed', full: 'Wednesday' },
  { value: 4, label: 'Thu', full: 'Thursday' },
  { value: 5, label: 'Fri', full: 'Friday' },
  { value: 6, label: 'Sat', full: 'Saturday' },
  { value: 0, label: 'Sun', full: 'Sunday' },
];

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function weekdayOrder(day) {
  return day === 0 ? 7 : day;
}

export function defaultTrainWeekdays(count) {
  const n = Math.min(6, Math.max(2, Number(count) || 3));
  return [...(DEFAULT_BY_COUNT[n] || DEFAULT_BY_COUNT[3])];
}

export function resolveTrainWeekdays(profile = {}) {
  const custom = [...new Set((profile.trainWeekdays || []).map(Number).filter((day) => day >= 0 && day <= 6))];
  if (custom.length >= 2) return custom.sort((a, b) => weekdayOrder(a) - weekdayOrder(b));
  return defaultTrainWeekdays(profile.daysPerWeek);
}

export function trainDayLabels(days) {
  return resolveTrainWeekdays({ trainWeekdays: days }).map((day) => DAY_NAMES[day]);
}

export function toggleTrainDay(current, value) {
  const next = new Set(resolveTrainWeekdays({ trainWeekdays: current }));
  if (next.has(value)) {
    if (next.size <= 2) return [...next].sort((a, b) => weekdayOrder(a) - weekdayOrder(b));
    next.delete(value);
  } else if (next.size < 6) {
    next.add(value);
  }
  return [...next].sort((a, b) => weekdayOrder(a) - weekdayOrder(b));
}
