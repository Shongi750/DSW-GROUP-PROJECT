import { BADGE_DEFS, badgeSummary, evaluateBadges, historyStats } from '../src/lib/badgeRules';

// Old dates so the "current streak" stays at zero.
function history(count, minutes = 10) {
  return Array.from({ length: count }, (_, i) => ({
    date: `2020-01-${String((i % 28) + 1).padStart(2, '0')}`,
    minutes,
  }));
}

function earned(list) {
  return evaluateBadges({ history: list, weekDone: 0, weekTotal: 3 })
    .filter((badge) => badge.earned)
    .map((badge) => badge.id);
}

describe('local badges', () => {
  test('has the four requested badges', () => {
    const titles = BADGE_DEFS.map((badge) => badge.title);
    expect(titles).toEqual(expect.arrayContaining(['First workout', '5 sessions', '10 Club', '60 minutes']));
  });

  test('no history, no badges', () => {
    expect(earned([])).toEqual([]);
    expect(historyStats(null)).toEqual({ sessions: 0, totalMinutes: 0, streak: 0 });
  });

  test('first workout', () => {
    expect(earned(history(1))).toEqual(['first-workout']);
  });

  test('5 sessions', () => {
    expect(earned(history(4))).not.toContain('sessions-5');
    expect(earned(history(5))).toContain('sessions-5');
  });

  test('10 Club keeps its old id', () => {
    expect(earned(history(9, 1))).not.toContain('workouts-10');
    expect(earned(history(10, 1))).toContain('workouts-10');
  });

  test('60 minutes adds up session minutes', () => {
    expect(earned(history(2, 29))).not.toContain('minutes-60');
    expect(earned(history(2, 30))).toContain('minutes-60');
    expect(earned([{ date: '2020-01-01', minutes: 75 }])).toContain('minutes-60');
  });

  test('bad minute values are ignored', () => {
    const stats = historyStats([
      { date: '2020-01-01', minutes: '20' },
      { date: '2020-01-02', minutes: 'abc' },
      { date: '2020-01-03', minutes: -5 },
      { date: '2020-01-04' },
    ]);
    expect(stats.totalMinutes).toBe(20);
    expect(stats.sessions).toBe(4);
  });

  test('summary line', () => {
    expect(badgeSummary([])).toBe('');
    expect(badgeSummary(history(1, 12))).toBe('1 session · 12 min trained');
    expect(badgeSummary(history(3, 20))).toBe('3 sessions · 60 min trained');
  });
});
