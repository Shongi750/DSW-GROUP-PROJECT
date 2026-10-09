import { DAY_NAMES } from './trainDays';
import { estimateMinutes, formatMoveMeta } from './session';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function exerciseImage(exercise) {
  if (!exercise) return null;
  if (exercise.gifUrl) return exercise.gifUrl;
  const frames = (exercise.photoFrames || []).filter(Boolean);
  return frames[0] || null;
}

// Fallback name for an id the catalog has not loaded yet: "free-Barbell_Squat" -> "Barbell Squat".
export function nameFromId(id = '') {
  return String(id)
    .replace(/^free-/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
}

function nextTrainDay(trainWeekdays, date) {
  const days = trainWeekdays || [];
  if (!days.length) return null;
  const today = date.getDay();
  for (let step = 1; step <= 7; step += 1) {
    const day = (today + step) % 7;
    if (days.indexOf(day) !== -1) return DAY_NAMES[day];
  }
  return null;
}

/** First `limit` moves as display rows (name, sets×reps or seconds, photo). */
export function previewMoves(moves = [], getExercise, limit = 6) {
  const lookup = typeof getExercise === 'function' ? getExercise : function () { return null; };
  return (moves || []).slice(0, Math.max(0, limit)).map(function (raw, index) {
    const move = typeof raw === 'string' ? { id: raw } : raw || {};
    const exercise = lookup(move.id);
    const merged = {
      mode: move.mode || (exercise && exercise.mode) || 'timed',
      sets: move.sets || (exercise && exercise.sets) || 3,
      reps: move.reps || (exercise && exercise.reps) || 10,
      duration: move.duration || (exercise && exercise.duration) || 30,
      rir: move.rir,
    };
    return {
      key: move.id + '-' + index,
      id: move.id,
      number: index + 1,
      name: (exercise && exercise.name) || nameFromId(move.id),
      meta: merged.mode !== 'sets' && merged.duration >= 120 && merged.duration % 60 === 0
        ? merged.duration / 60 + ' min'
        : formatMoveMeta(merged),
      focus: (exercise && exercise.focus && exercise.focus[0]) || '',
      image: exerciseImage(exercise),
      swapped: Boolean(move.swapped),
    };
  });
}

/**
 * Everything the "Today's workout" card shows, built from UFitness' own getTodayPlan()
 * result: weekday heading, the first few moves (with photos when the catalog has them),
 * how many more there are and a time estimate.
 */
export function buildTodayPreview({ todayPlan, getExercise, date = new Date(), limit = 6 } = {}) {
  const plan = todayPlan || {};
  const type = plan.type || 'rest';
  const moves = type === 'train' ? plan.moves || [] : [];
  const items = previewMoves(moves, getExercise, limit);

  return {
    type,
    weekday: DAY_NAMES[date.getDay()],
    dateLabel: date.getDate() + ' ' + MONTHS[date.getMonth()],
    title:
      type === 'train'
        ? (plan.session && plan.session.name) || "Today's session"
        : type === 'done'
          ? "You're done for today"
          : 'Rest day',
    items,
    totalMoves: moves.length,
    moreCount: Math.max(0, moves.length - items.length),
    minutes: moves.length ? estimateMinutes(moves) : 0,
    nextTrainDay: type === 'train' ? null : nextTrainDay(plan.trainWeekdays, date),
    makeup: Boolean(plan.makeup),
  };
}
