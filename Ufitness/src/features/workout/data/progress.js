import { getWeekDays, toDateKey } from './week';

export function addDays(dateKey, delta) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + delta);
  return toDateKey(date);
}

export function sessionStreak(history = []) {
  const trained = new Set(history.map((item) => item.date));
  let cursor = toDateKey();
  if (!trained.has(cursor)) {
    cursor = addDays(cursor, -1);
  }
  let streak = 0;
  while (trained.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function weekActivity(history = []) {
  const days = getWeekDays();
  return days.map((day) => {
    const sessions = history.filter((item) => item.date === day.key);
    const minutes = sessions.reduce((sum, item) => sum + (item.minutes || 0), 0);
    return {
      ...day,
      sessions: sessions.length,
      minutes,
    };
  });
}

export function personalRecords(history = []) {
  const best = {};
  history.forEach((session) => {
    (session.setsLog || []).forEach((entry) => {
      (entry.sets || []).forEach((set) => {
        const reps = Number(set.reps) || 0;
        const weight = Number(set.weightKg) || 0;
        const volume = reps * Math.max(weight, 1);
        const prev = best[entry.id] || { reps: 0, weightKg: 0, volume: 0 };
        best[entry.id] = {
          reps: Math.max(prev.reps, reps),
          weightKg: Math.max(prev.weightKg, weight),
          volume: Math.max(prev.volume, volume),
        };
      });
    });
  });
  return best;
}

export function weekVolume(history = []) {
  return history.reduce((sum, session) => {
    return (
      sum +
      (session.setsLog || []).reduce(
        (moveSum, entry) =>
          moveSum +
          (entry.sets || []).reduce(
            (setSum, set) => setSum + (Number(set.reps) || 0) * Math.max(Number(set.weightKg) || 0, 1),
            0
          ),
        0
      )
    );
  }, 0);
}

export function muscleBreakdown(exerciseIds, getExercise) {
  const counts = {};
  exerciseIds.forEach((id) => {
    const focus = getExercise(id)?.focus || [];
    focus.forEach((label) => {
      counts[label] = (counts[label] || 0) + 1;
    });
  });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] || 1;
  return entries.slice(0, 6).map(([label, count]) => ({
    label,
    count,
    ratio: count / max,
  }));
}
