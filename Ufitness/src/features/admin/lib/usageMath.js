// Pure helpers for the admin usage charts (no React Native imports → easy to test).

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const FEATURE_LABELS = {
  workout: 'Workout',
  meals: 'Meals',
  community: 'Community',
  mentors: 'Mentors',
};

/** Local calendar day as 'YYYY-MM-DD'. */
export function dayKey(date) {
  const d = new Date(date);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Last 7 days ending today, oldest first. Days with no rows get 0.
 * rows: [{ day: '2026-10-08', users: 3 }] from admin_usage_summary().
 */
export function buildWeekSeries(rows, today = new Date()) {
  const counts = {};
  (rows || []).forEach((row) => {
    if (row && row.day) counts[String(row.day).slice(0, 10)] = Number(row.users) || 0;
  });
  const series = [];
  for (let back = 6; back >= 0; back -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - back);
    const key = dayKey(d);
    series.push({ label: DAY_NAMES[d.getDay()], day: key, users: counts[key] || 0 });
  }
  return series;
}

/** Feature reach rows → chart rows, always in the same order (missing = 0). */
export function buildFeatureSeries(rows) {
  const counts = {};
  (rows || []).forEach((row) => {
    if (row && row.event) counts[row.event] = Number(row.users) || 0;
  });
  return Object.keys(FEATURE_LABELS).map((event) => ({
    label: FEATURE_LABELS[event],
    value: counts[event] || 0,
  }));
}

/** True when there is at least one real number to chart. */
export function hasAnyUsage(weekSeries, featureSeries) {
  return (
    (weekSeries || []).some((item) => item.users > 0) ||
    (featureSeries || []).some((item) => item.value > 0)
  );
}
