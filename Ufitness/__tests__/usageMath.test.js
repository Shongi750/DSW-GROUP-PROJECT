import { buildFeatureSeries, buildWeekSeries, dayKey, hasAnyUsage } from '../src/features/admin/lib/usageMath';

describe('admin usage maths', () => {
  const today = new Date(2026, 9, 8); // Thu 8 Oct 2026 (month is 0-based)

  test('dayKey is YYYY-MM-DD', () => {
    expect(dayKey(today)).toBe('2026-10-08');
  });

  test('week series is the last 7 days, oldest first, with zeros filled in', () => {
    const series = buildWeekSeries(
      [
        { day: '2026-10-08', users: 4 },
        { day: '2026-10-05', users: 2 },
        { day: '2026-09-20', users: 9 }, // older than 7 days → ignored
      ],
      today
    );
    expect(series).toHaveLength(7);
    expect(series[0]).toEqual({ label: 'Fri', day: '2026-10-02', users: 0 });
    expect(series[6]).toEqual({ label: 'Thu', day: '2026-10-08', users: 4 });
    expect(series.find((d) => d.day === '2026-10-05').users).toBe(2);
    expect(series.reduce((sum, d) => sum + d.users, 0)).toBe(6);
  });

  test('feature series keeps a fixed order and fills gaps', () => {
    expect(buildFeatureSeries([{ event: 'meals', users: 3 }, { event: 'unknown', users: 7 }])).toEqual([
      { label: 'Workout', value: 0 },
      { label: 'Meals', value: 3 },
      { label: 'Community', value: 0 },
      { label: 'Mentors', value: 0 },
    ]);
  });

  test('empty data means "no usage yet" (honest empty state)', () => {
    const week = buildWeekSeries(null, today);
    const features = buildFeatureSeries(undefined);
    expect(hasAnyUsage(week, features)).toBe(false);
    expect(hasAnyUsage(buildWeekSeries([{ day: '2026-10-07', users: 1 }], today), features)).toBe(true);
  });
});
