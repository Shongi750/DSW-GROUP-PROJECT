export function normalizeMoves(raw = [], getExercise) {
  return raw
    .map((item) => {
      const id = typeof item === 'string' ? item : item.id;
      const catalog = getExercise?.(id) || {};
      const mode = item.mode || catalog.mode || 'timed';
      return {
        id,
        mode,
        duration: item.duration || catalog.duration || 30,
        sets: item.sets ?? catalog.sets ?? 3,
        reps: item.reps ?? catalog.reps ?? 10,
        rest: item.rest ?? catalog.rest ?? 20,
        swapId: item.swapId || catalog.swapId,
        avoidIf: item.avoidIf || catalog.avoidIf,
        swapped: item.swapped,
        weightKg: item.weightKg ?? 0,
        label: item.label,
        note: item.note,
        rir: item.rir,
        repRange: item.repRange,
        main: item.main,
        primary: item.primary,
        secondary: item.secondary,
      };
    })
    .filter((item) => item.id);
}

export function movesFromIds(ids, getExercise) {
  return normalizeMoves(ids, getExercise);
}

export function programMoves(program, getExercise) {
  if (program?.moves?.length) return normalizeMoves(program.moves, getExercise);
  return movesFromIds(program?.exerciseIds || [], getExercise);
}

export function estimateMinutes(moves = []) {
  const seconds = moves.reduce((sum, move) => {
    if (move.mode === 'sets') {
      return sum + move.sets * 35 + Math.max(0, move.sets - 1) * (move.rest || 0) + (move.rest || 0);
    }
    return sum + (move.duration || 30) + (move.rest || 0);
  }, 0);
  return Math.max(1, Math.round(seconds / 60));
}

export function formatMoveMeta(move) {
  if (move.mode !== 'sets') return `${move.duration}s`;
  const base = `${move.sets}×${move.reps}`;
  return typeof move.rir === 'number' ? `${base} · RIR ${move.rir}` : base;
}
