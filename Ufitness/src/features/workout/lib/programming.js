import { getGoal, VOLUME_LANDMARKS } from '../data/goals';
import { getDayTemplate, getPattern, getSplit } from '../data/movements';

const MESOCYCLE_WEEKS = 6;

// Accumulate for five weeks, then deload. Effort rises as reps-in-reserve falls.
const WEEK_PROGRESSION = [
  { setBonus: 0, repBonus: 0, rirBonus: 1, label: 'Introduce' },
  { setBonus: 0, repBonus: 1, rirBonus: 0, label: 'Add reps' },
  { setBonus: 1, repBonus: 1, rirBonus: 0, label: 'Add a set' },
  { setBonus: 1, repBonus: 2, rirBonus: -1, label: 'Push reps' },
  { setBonus: 2, repBonus: 2, rirBonus: -1, label: 'Overreach' },
  { setBonus: -1, repBonus: 0, rirBonus: 2, label: 'Deload' },
];

function pickExercise(pattern, tier, injuries, used) {
  const candidates = pattern[tier] || pattern.bodyweight || [];
  const blocked = (pattern.avoidIf || []).some((tag) => injuries.includes(tag));
  const pool = blocked ? candidates.slice(1) : candidates;
  const fresh = pool.find((ref) => !used.has(ref));
  return fresh || pool[0] || candidates[0] || null;
}

function repsForSlot(goal, pattern, weekStep) {
  const range = pattern.main ? goal.mainReps : goal.accessoryReps;
  const reps = Math.min(range[1], range[0] + weekStep.repBonus);
  return { reps, range };
}

function buildDay(templateId, index, { goal, tier, injuries }) {
  const template = getDayTemplate(templateId);
  const used = new Set();
  const warmupCandidates = getPattern('warmup')[tier] || getPattern('warmup').bodyweight;
  const warmupRef = warmupCandidates[index % warmupCandidates.length];

  const blocks = template.slots
    .map((slotId, slotIndex) => {
      const pattern = getPattern(slotId);
      if (!pattern) return null;
      const ref = pickExercise(pattern, tier, injuries, used);
      if (!ref) return null;
      used.add(ref);
      return {
        ref,
        pattern: slotId,
        patternLabel: pattern.label,
        main: Boolean(pattern.main) && slotIndex < 2,
        timed: Boolean(pattern.timed),
        primary: pattern.primary || [],
        secondary: pattern.secondary || [],
      };
    })
    .filter(Boolean);

  return {
    id: `${templateId}-${index}`,
    templateId,
    name: template.name,
    conditioning: Boolean(template.conditioning),
    mobility: Boolean(template.mobility),
    warmupRef,
    blocks,
  };
}

export function buildProgram(profile = {}) {
  const goal = getGoal(profile.goal);
  const tier = profile.equipmentTier || 'bodyweight';
  const injuries = profile.injuries || [];
  const daysPerWeek = Math.min(6, Math.max(2, profile.daysPerWeek || 3));
  const split = getSplit(goal.id, daysPerWeek);
  const experience = profile.experience || 'new';

  const days = split.days.map((templateId, index) => buildDay(templateId, index, { goal, tier, injuries }));

  return {
    id: `${goal.id}-${tier}-${daysPerWeek}`,
    goal,
    tier,
    experience,
    daysPerWeek,
    weeks: MESOCYCLE_WEEKS,
    splitName: split.name,
    days,
  };
}

// Beginners start with one fewer set per exercise; trained lifters get one more on main lifts.
function experienceSetBonus(experience, isMain) {
  if (experience === 'new') return -1;
  if (experience === 'trained' && isMain) return 1;
  return 0;
}

// More training days means each muscle is hit more often, so per-session sets come down to
// keep weekly volume inside the landmark band.
function frequencySetBonus(daysPerWeek, isMain) {
  if (daysPerWeek >= 6) return -1;
  if (daysPerWeek === 5) return isMain ? 0 : -1;
  return 0;
}

// Per-exercise ceilings, tightened as weekly frequency rises so a muscle trained three times
// a week does not end up with double the sets of one trained twice.
function maxSets(daysPerWeek, isMain) {
  if (!isMain) return 5;
  if (daysPerWeek >= 6) return 4;
  if (daysPerWeek === 5) return 5;
  return 6;
}

export function sessionForWeek(program, weekIndex, dayIndex) {
  const day = program.days[dayIndex % program.days.length];
  const weekStep = WEEK_PROGRESSION[weekIndex % WEEK_PROGRESSION.length];
  const { goal } = program;
  const deload = weekStep.label === 'Deload';

  const moves = [];

  if (day.warmupRef) {
    moves.push({
      id: day.warmupRef,
      mode: 'timed',
      duration: 40,
      rest: 10,
      sets: 1,
      label: 'Warm-up',
      note: 'Raise your heart rate and move the joints you are about to load.',
    });
  }

  day.blocks.forEach((block) => {
    // Main lifts carry the weekly progression; accessories climb at half that rate so
    // session length and joint load stay sane across the block.
    const baseSets = block.main ? goal.mainSets : goal.accessorySets;
    const progressionSets = block.main ? weekStep.setBonus : Math.trunc(weekStep.setBonus / 2);
    const sets = Math.min(
      maxSets(program.daysPerWeek, block.main),
      Math.max(
        1,
        baseSets +
          progressionSets +
          experienceSetBonus(program.experience, block.main) +
          frequencySetBonus(program.daysPerWeek, block.main)
      )
    );
    const rest = block.main ? goal.restMain : goal.restAccessory;
    const rir = Math.max(0, goal.rir + weekStep.rirBonus);

    if (block.timed) {
      const base = day.conditioning ? 40 : 30;
      moves.push({
        id: block.ref,
        mode: 'timed',
        duration: base + weekStep.repBonus * 5,
        rest: day.conditioning ? 40 : 20,
        sets,
        label: block.patternLabel,
        note: day.conditioning
          ? 'Work hard enough that talking is difficult, then recover fully.'
          : 'Hold with steady breathing, stop before form breaks down.',
        primary: block.primary,
        secondary: block.secondary,
      });
      return;
    }

    const { reps, range } = repsForSlot(goal, getPattern(block.pattern), weekStep);
    moves.push({
      id: block.ref,
      mode: 'sets',
      sets,
      reps,
      repRange: range,
      rest,
      rir,
      main: block.main,
      label: block.patternLabel,
      note: deload
        ? 'Deload week: same technique, clearly lighter and well short of failure.'
        : `Leave about ${rir} rep${rir === 1 ? '' : 's'} in reserve on each set.`,
      primary: block.primary,
      secondary: block.secondary,
    });
  });

  return {
    id: `${program.id}-w${weekIndex + 1}-d${dayIndex + 1}`,
    name: day.name,
    dayIndex,
    week: weekIndex + 1,
    weekLabel: weekStep.label,
    deload,
    conditioning: day.conditioning,
    mobility: day.mobility,
    moves,
  };
}

export function weekSessions(program, weekIndex) {
  return program.days.map((_, dayIndex) => sessionForWeek(program, weekIndex, dayIndex));
}

// The landmarks refer to sets where the muscle is the target, so status is judged on direct
// sets only. Assisting work is tracked separately as context rather than counted against them.
export function weeklyVolume(program, weekIndex = 0) {
  const totals = {};
  const add = (muscle, key, amount) => {
    if (!muscle) return;
    totals[muscle] = totals[muscle] || { direct: 0, indirect: 0 };
    totals[muscle][key] += amount;
  };

  weekSessions(program, weekIndex).forEach((session) => {
    session.moves.forEach((move) => {
      (move.primary || []).forEach((muscle) => add(muscle, 'direct', move.sets || 0));
      (move.secondary || []).forEach((muscle) => add(muscle, 'indirect', (move.sets || 0) / 2));
    });
  });

  return Object.entries(totals)
    .map(([muscle, counts]) => ({
      muscle,
      direct: Math.round(counts.direct * 10) / 10,
      indirect: Math.round(counts.indirect * 10) / 10,
      sets: Math.round(counts.direct * 10) / 10,
      status:
        counts.direct < VOLUME_LANDMARKS.min ? 'low' : counts.direct > VOLUME_LANDMARKS.max ? 'high' : 'ok',
    }))
    .sort((a, b) => b.direct - a.direct);
}

export function weekLabel(weekIndex) {
  return WEEK_PROGRESSION[weekIndex % WEEK_PROGRESSION.length].label;
}

export function mesocycleWeeks() {
  return MESOCYCLE_WEEKS;
}
