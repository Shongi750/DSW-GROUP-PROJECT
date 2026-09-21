import { getExercise } from './exercises';
import { getAllPrograms } from './programs';

function unique(list) {
  return [...new Set(list)];
}

export function trainedFocus(completedIds) {
  return unique(
    completedIds.flatMap((id) => getExercise(id)?.focus || []).map((item) => item.toLowerCase())
  );
}

export function programFocus(program) {
  return unique(
    (program.exerciseIds || []).flatMap((id) => getExercise(id)?.focus || []).map((item) => item.toLowerCase())
  );
}

export function programProgress(program, completedIds) {
  const ids = program.exerciseIds || [];
  const total = ids.length || 1;
  const done = ids.filter((id) => completedIds.includes(id)).length;
  return { done, total, ratio: done / total };
}

function userLevel(completedCount) {
  if (completedCount <= 2) return 1;
  if (completedCount <= 4) return 2;
  return 3;
}

export function recommendPrograms(profile, limit = 4) {
  const completed = profile.completedExerciseIds || [];
  const trained = trainedFocus(completed);
  const level = userLevel(completed.length);
  const recentFocus = trained.slice(-3);

  const ranked = getAllPrograms()
    .map((program) => {
      const { done, total, ratio } = programProgress(program, completed);
      const focuses = programFocus(program);
      const missing = focuses.filter((item) => !trained.includes(item));
      const overlapsRecent = focuses.some((item) => recentFocus.includes(item));
      const programLevel = program.level || 2;

      let score = 0;
      let reason = 'Matches your current plan';

      if (ratio > 0 && ratio < 1) {
        score += 40;
        reason = `Continue · ${done} of ${total} done`;
      } else if (ratio === 1) {
        score -= 15;
        reason = 'Repeat to lock it in';
      } else if (missing.length) {
        score += 28;
        reason = `Fills a gap: ${missing[0]}`;
      }

      if (Math.abs(programLevel - level) === 0) score += 12;
      if (Math.abs(programLevel - level) >= 2) score -= 10;

      if (program.tags?.includes('beginner') && level === 1) {
        score += 10;
        if (ratio === 0) reason = 'Good next step from onboarding';
      }
      if (program.tags?.includes('mobility') && overlapsRecent && ratio < 1) {
        score += 8;
        reason = 'Recovery after your last sessions';
      }
      if (program.tags?.includes('power') && level < 2) score -= 12;

      return {
        ...program,
        reason,
        progressLabel: `${done} of ${total} done`,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, limit);
}
