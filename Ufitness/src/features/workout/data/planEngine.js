import { FLOOR_PLAN, applySwaps, getPlanSession } from './floorPlan';
import { getWeekDays, toDateKey } from './week';
import { buildProgram, sessionForWeek } from '../lib/programming';
import { DAY_NAMES, resolveTrainWeekdays, trainDayLabels, weekdayOrder } from '../lib/trainDays';

export function trainWeekdays(profileOrCount) {
  if (profileOrCount && typeof profileOrCount === 'object') {
    return resolveTrainWeekdays(profileOrCount);
  }
  return resolveTrainWeekdays({ daysPerWeek: profileOrCount });
}

function cycleWeekIndex(planStartedAt, weeks) {
  if (!planStartedAt) return 0;
  const start = new Date(planStartedAt);
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const elapsed = Math.max(0, Math.floor((now - start) / 86400000));
  return Math.floor(elapsed / 7) % weeks;
}

function trainedDatesThisWeek(history) {
  const keys = new Set(getWeekDays().map((item) => item.key));
  return new Set((history || []).filter((item) => keys.has(item.date)).map((item) => item.date));
}

function trainedWeekdaysThisWeek(history) {
  const week = getWeekDays();
  const byKey = new Map(week.map((item, index) => [item.key, index]));
  const trained = new Set();
  (history || []).forEach((item) => {
    if (byKey.has(item.date)) trained.add(byKey.get(item.date));
  });
  return trained;
}

function pickSlot(days, jsDay, history) {
  const trainedDays = trainedWeekdaysThisWeek(history);
  if (days.includes(jsDay) && !trainedDays.has(jsDay)) {
    return { kind: 'scheduled', slot: days.indexOf(jsDay), forDay: jsDay };
  }
  const missed = days.filter((day) => weekdayOrder(day) < weekdayOrder(jsDay) && !trainedDays.has(day));
  if (missed.length && trainedDays.size < days.length) {
    return { kind: 'makeup', slot: days.indexOf(missed[0]), forDay: missed[0] };
  }
  return { kind: 'rest' };
}

function goalTodayPlan(profile) {
  const program = buildProgram({ ...profile, daysPerWeek: resolveTrainWeekdays(profile).length });
  const days = resolveTrainWeekdays(profile);
  const daysPerWeek = days.length;
  const weekIndex = cycleWeekIndex(profile.planStartedAt, program.weeks);
  const week = weekIndex + 1;
  const jsDay = new Date().getDay();
  const trained = trainedDatesThisWeek(profile.history);
  const alreadyToday = trained.has(toDateKey());
  const doneThisWeek = trained.size;
  const base = { program, week, weekIndex, daysPerWeek, doneThisWeek, trainWeekdays: days };

  if (alreadyToday) {
    return {
      ...base,
      type: 'done',
      status: `Session logged. Week ${week} of ${program.weeks}: ${program.goal.name.toLowerCase()} block.`,
      session: null,
      moves: [],
    };
  }

  const pick = pickSlot(days, jsDay, profile.history);
  if (pick.kind === 'rest') {
    return {
      ...base,
      type: 'rest',
      status: `Rest day. You train ${trainDayLabels(days).join(', ')}. Recovery is the work today.`,
      session: null,
      moves: [],
    };
  }

  const session = sessionForWeek(program, weekIndex, pick.slot);
  return {
    ...base,
    type: 'train',
    status:
      pick.kind === 'makeup'
        ? `Makeup for ${DAY_NAMES[pick.forDay]}. This is that missed session, not a second workout.`
        : session.deload
          ? `Week ${week} is a planned deload. Lighter loads on purpose so the next block keeps working.`
          : `Week ${week} of ${program.weeks} · ${session.weekLabel} · ${program.splitName}.`,
    session,
    moves: session.moves,
    nextLabel: DAY_NAMES[pick.forDay],
    makeup: pick.kind === 'makeup',
  };
}

export function planWeekIndex(planStartedAt) {
  if (!planStartedAt) return 0;
  const start = new Date(planStartedAt);
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.floor((now - start) / 86400000);
  return Math.min(FLOOR_PLAN.weeks - 1, Math.max(0, Math.floor(days / 7)));
}

export function getTodayPlan(profile) {
  if (profile.goal) return goalTodayPlan(profile);
  const injuries = profile.injuries || [];
  const days = resolveTrainWeekdays(profile);
  const daysPerWeek = days.length;
  const weekIndex = planWeekIndex(profile.planStartedAt);
  const week = weekIndex + 1;
  const jsDay = new Date().getDay();
  const trained = trainedDatesThisWeek(profile.history);
  const alreadyToday = trained.has(toDateKey());
  const pick = pickSlot(days, jsDay, profile.history);
  const doneThisWeek = trained.size;
  const base = { week, weekIndex, daysPerWeek, doneThisWeek, trainWeekdays: days };

  if (alreadyToday) {
    return {
      ...base,
      type: 'done',
      status: `On track. You already did today's uFitness session.`,
      session: null,
      moves: [],
    };
  }

  if (pick.kind === 'rest') {
    return {
      ...base,
      type: 'rest',
      status: `Rest day. You train ${trainDayLabels(days).join(', ')}.`,
      session: null,
      moves: [],
    };
  }

  const session = getPlanSession(weekIndex, pick.slot);
  const moves = applySwaps(session.moves, injuries);
  return {
    ...base,
    type: 'train',
    status:
      pick.kind === 'makeup'
        ? `Makeup for ${DAY_NAMES[pick.forDay]}. This is that missed session, not a second workout.`
        : `On track for week ${week}: ${doneThisWeek} of ${daysPerWeek} sessions.`,
    session,
    moves,
    nextLabel: DAY_NAMES[pick.forDay],
    makeup: pick.kind === 'makeup',
  };
}
