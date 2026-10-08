import { sessionStreak } from './progress';

// After they finish a workout we show a short message on the finish screen.
// These are the milestones I settled on (1, 3, 5, 10, 20 sessions + streaks).
export function planAdaptationMessage(history, profile) {
  if (!history) history = [];
  if (!profile) profile = {};

  const sessions = history.length;
  const streak = sessionStreak(history);
  const last = history[0] || history[history.length - 1];
  const recent = history.slice(0, 10);
  const boost = Number(profile.planBoost) || 0;

  if (sessions === 1) {
    return {
      kicker: 'Plan started',
      title: 'Your plan is live',
      body: 'Finish a few more sessions and we will nudge difficulty and volume.',
    };
  }

  if (sessions === 3) {
    return {
      kicker: 'Plan updated',
      title: 'Consistency unlocked',
      body: 'Three sessions logged. Train days now carry a denser set prescription.',
    };
  }

  if (sessions === 5 || sessions === 10 || sessions === 20) {
    let body = 'Progression stepped up — expect slightly tougher sets on your programmed days.';
    if (boost > 0) {
      body =
        'Volume stepped up (+' +
        boost +
        ' set on main lifts). Expect slightly tougher programmed days.';
    }
    return {
      kicker: 'Plan updated',
      title: sessions + ' sessions in',
      body: body,
    };
  }

  if (streak >= 7 && sessions % 7 === 0) {
    return {
      kicker: 'Plan updated',
      title: streak + '-day streak',
      body: 'Streak locked. Rest days stay sacred; train days get a bit sharper.',
    };
  }

  if (recent.length >= 5) {
    let title = "Today's session";
    if (last && last.title) title = last.title;
    else if (last && last.name) title = last.name;
    return {
      kicker: 'On track',
      title: "You're building a habit",
      body:
        recent.length +
        ' recent sessions including "' +
        title +
        '". Keep the same campus rhythm.',
    };
  }

  return null;
}

// Actually change the plan numbers (not just the message).
// programming.js reads experience + planBoost when it builds sets.
export function applyPlanAdaptation(profile, history) {
  if (!profile) profile = {};
  if (!history) history = [];

  const sessions = history.length;
  const patch = {};
  let experience = profile.experience || 'new';
  let planBoost = Number(profile.planBoost) || 0;
  if (planBoost < 0) planBoost = 0;

  // after a few sessions, bump beginner → returning
  if (sessions >= 3 && experience === 'new') {
    experience = 'returning';
    patch.experience = experience;
  }

  // later, returning → trained
  if (sessions >= 12 && experience === 'returning') {
    experience = 'trained';
    patch.experience = experience;
  }

  // add an extra set on the big milestones
  if (sessions === 5 && planBoost < 1) {
    planBoost = 1;
    patch.planBoost = planBoost;
  } else if (sessions === 10 && planBoost < 2) {
    planBoost = 2;
    patch.planBoost = planBoost;
  } else if (sessions === 20 && planBoost < 2) {
    planBoost = 2;
    patch.planBoost = planBoost;
  }

  const merged = Object.assign({}, profile, patch);
  const message = planAdaptationMessage(history, merged);
  return { patch: patch, message: message };
}
