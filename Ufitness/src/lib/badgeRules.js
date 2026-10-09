import { sessionStreak } from '../features/workout/data/progress';

// Badges come only from the workout history already saved on the phone. No extra table.

/** Totals the badge rules need, computed from local workout history. */
export function historyStats(history = []) {
  const list = Array.isArray(history) ? history.filter(Boolean) : [];
  const totalMinutes = list.reduce(function (sum, item) {
    const minutes = Number(item.minutes);
    return sum + (Number.isFinite(minutes) && minutes > 0 ? minutes : 0);
  }, 0);
  return {
    sessions: list.length,
    totalMinutes: Math.round(totalMinutes),
    streak: sessionStreak(list),
  };
}

/** FR-45 — factual milestones only (no fake body metrics). */
export const BADGE_DEFS = [
  {
    id: 'first-workout',
    title: 'First workout',
    blurb: 'You logged your first session.',
    icon: 'trophy-outline',
    test: ({ sessions }) => sessions >= 1,
  },
  {
    id: 'sessions-5',
    title: '5 sessions',
    blurb: 'Five sessions logged. The habit is forming.',
    icon: 'star-outline',
    test: ({ sessions }) => sessions >= 5,
  },
  {
    // Same id as before so anyone who already unlocked it keeps it.
    id: 'workouts-10',
    title: '10 Club',
    blurb: 'Ten sessions on the books.',
    icon: 'barbell-outline',
    test: ({ sessions }) => sessions >= 10,
  },
  {
    id: 'minutes-60',
    title: '60 minutes',
    blurb: 'An hour of total training time.',
    icon: 'time-outline',
    test: ({ totalMinutes }) => totalMinutes >= 60,
  },
  {
    id: 'streak-7',
    title: '7-day streak',
    blurb: 'Trained across seven consecutive days.',
    icon: 'flame-outline',
    test: ({ streak }) => streak >= 7,
  },
  {
    id: 'challenge-30',
    title: '30-day challenge',
    blurb: 'Thirty sessions completed — consistency win.',
    icon: 'ribbon-outline',
    test: ({ sessions }) => sessions >= 30,
  },
  {
    id: 'week-complete',
    title: 'Week locked in',
    blurb: 'Hit your weekly session target once.',
    icon: 'checkmark-circle-outline',
    test: ({ weekDone, weekTotal }) => weekTotal > 0 && weekDone >= weekTotal,
  },
];

export function evaluateBadges({ history = [], weekDone = 0, weekTotal = 4 } = {}) {
  const ctx = { ...historyStats(history), weekDone, weekTotal };
  return BADGE_DEFS.map((def) => ({
    ...def,
    earned: Boolean(def.test(ctx)),
  }));
}

/** Short line for the badge strip, e.g. "7 sessions · 85 min trained". */
export function badgeSummary(history = []) {
  const stats = historyStats(history);
  if (!stats.sessions) return '';
  return (
    stats.sessions + (stats.sessions === 1 ? ' session' : ' sessions') + ' · ' + stats.totalMinutes + ' min trained'
  );
}
