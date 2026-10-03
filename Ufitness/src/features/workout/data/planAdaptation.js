import { sessionStreak } from './progress';

/**
 * Visible FR-18 signal — plan adapts after consistent completions.
 * Returns null when nothing noteworthy changed.
 */
export function planAdaptationMessage(history = []) {
  const sessions = history.length;
  const streak = sessionStreak(history);
  const last = history[0] || history[history.length - 1];
  const recent = history.slice(0, 10);
  const recentDone = recent.length;

  if (sessions === 1) {
    return {
      kicker: 'Plan started',
      title: 'Your plan is live',
      body: 'Finish a few more sessions and we’ll nudge difficulty and volume.',
    };
  }
  if (sessions === 3) {
    return {
      kicker: 'Plan updated',
      title: 'Consistency unlocked',
      body: 'Three sessions logged. Next week leans a little denser on your focus days.',
    };
  }
  if (sessions === 5 || sessions === 10 || sessions === 20) {
    return {
      kicker: 'Plan updated',
      title: `${sessions} sessions in`,
      body: 'Progression stepped up — expect slightly tougher sets on your programmed days.',
    };
  }
  if (streak >= 7 && sessions % 7 === 0) {
    return {
      kicker: 'Plan updated',
      title: `${streak}-day streak`,
      body: 'Streak locked. Rest days stay sacred; train days get a bit sharper.',
    };
  }
  if (recentDone >= 5) {
    const title = last?.title || last?.name || 'Today’s session';
    return {
      kicker: 'On track',
      title: 'You’re building a habit',
      body: `${recentDone} recent sessions including “${title}”. Keep the same campus rhythm.`,
    };
  }
  return null;
}
