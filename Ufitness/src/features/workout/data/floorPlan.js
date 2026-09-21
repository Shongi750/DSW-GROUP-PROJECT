export const FLOOR_PLAN = {
  id: 'floor-25',
  name: 'uFitness',
  coach: 'Lyftn Home',
  weeks: 8,
  daysPerWeek: 3,
  minutes: 25,
  equipment: 'Floor. Optional band or backpack.',
  trainWeekdays: [1, 3, 5],
  trainLabels: ['Monday', 'Wednesday', 'Friday'],
};

const TEMPLATES = [
  {
    name: 'Full-body A',
    moves: [
      { id: 'cat-cow', duration: 40, rest: 10, mode: 'timed' },
      { id: 'arm-circles', duration: 30, rest: 10, mode: 'timed' },
      { id: 'bodyweight-squat', sets: 3, reps: 12, rest: 25, mode: 'sets', swapId: 'wall-sit', avoidIf: ['knees'] },
      { id: 'push-up', sets: 3, reps: 8, rest: 25, mode: 'sets' },
      { id: 'row', sets: 3, reps: 10, rest: 25, mode: 'sets' },
      { id: 'glute-bridge', sets: 3, reps: 12, rest: 20, mode: 'sets' },
      { id: 'plank', duration: 30, rest: 15, mode: 'timed' },
      { id: 'dead-bug', sets: 2, reps: 8, rest: 20, mode: 'sets' },
    ],
  },
  {
    name: 'Cardio + core B',
    moves: [
      { id: 'march-in-place', duration: 40, rest: 10, mode: 'timed' },
      { id: 'jumping-jacks', duration: 30, rest: 15, mode: 'timed', swapId: 'high-knees', avoidIf: ['knees'] },
      { id: 'mountain-climber', duration: 25, rest: 20, mode: 'timed', swapId: 'dead-bug', avoidIf: ['knees'] },
      { id: 'push-up', sets: 3, reps: 8, rest: 25, mode: 'sets' },
      { id: 'shoulder-taps', sets: 3, reps: 12, rest: 20, mode: 'sets' },
      { id: 'hollow-hold', duration: 20, rest: 20, mode: 'timed' },
      { id: 'side-plank', duration: 20, rest: 15, mode: 'timed' },
      { id: 'bird-dog', sets: 2, reps: 8, rest: 15, mode: 'sets' },
    ],
  },
  {
    name: 'Lower + pull C',
    moves: [
      { id: 'world-greatest', sets: 2, reps: 6, rest: 15, mode: 'sets' },
      { id: 'reverse-lunge', sets: 3, reps: 8, rest: 30, mode: 'sets', swapId: 'glute-bridge', avoidIf: ['knees'] },
      { id: 'hip-hinge', sets: 3, reps: 12, rest: 25, mode: 'sets' },
      { id: 'split-squat', sets: 2, reps: 8, rest: 25, mode: 'sets', swapId: 'wall-sit', avoidIf: ['knees'] },
      { id: 'row', sets: 3, reps: 10, rest: 25, mode: 'sets' },
      { id: 'calf-raise', sets: 2, reps: 15, rest: 15, mode: 'sets' },
      { id: 'plank', duration: 35, rest: 10, mode: 'timed' },
      { id: 'hamstring-fold', duration: 30, rest: 0, mode: 'timed' },
    ],
  },
];

export function getPlanSession(weekIndex, slot) {
  const template = TEMPLATES[slot % TEMPLATES.length];
  const bump = weekIndex >= 4 ? 1 : 0;
  return {
    id: `w${weekIndex + 1}-s${slot + 1}`,
    name: template.name,
    week: weekIndex + 1,
    slot,
    moves: template.moves.map((move) => ({
      ...move,
      duration: move.duration ? move.duration + (weekIndex >= 4 ? 5 : 0) : move.duration,
      reps: move.reps ? move.reps + bump : move.reps,
    })),
  };
}

export function applySwaps(moves, injuries = []) {
  return moves.map((move) => {
    const hit = (move.avoidIf || []).some((tag) => injuries.includes(tag));
    if (hit && move.swapId) {
      return { ...move, id: move.swapId, swapped: true };
    }
    return move;
  });
}
