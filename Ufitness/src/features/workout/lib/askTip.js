// One-shot "Ask coach" tip — rule-based, not a chatbot.
// Easy to explain in a demo: we look at streak / minutes / goal and pick a tip.

export function askCoachTip(input) {
  const profile = (input && input.profile) || {};
  const history = (input && input.history) || [];
  const minutes = Number((input && input.minutes) || 0);
  const moves = Number((input && input.moves) || 0);
  const streak = Number((input && input.streak) || 0);
  const goal = profile.goal || 'hypertrophy';
  const sessions = history.length;

  // Short session → suggest consistency over length
  if (minutes > 0 && minutes < 12) {
    return {
      title: 'Tomorrow',
      body: 'Keep it short again if you need to — showing up beats a perfect hour.',
    };
  }

  // Long hard day → rest / protein
  if (minutes >= 40 || moves >= 10) {
    return {
      title: 'Recovery',
      body: 'Big session. Sleep and a protein meal matter more than another workout tonight.',
    };
  }

  // Building a streak
  if (streak >= 3 && streak < 7) {
    return {
      title: 'Streak tip',
      body: 'You are on ' + streak + ' days. Protect tomorrow’s slot even if it is only 15 minutes.',
    };
  }

  if (streak >= 7) {
    return {
      title: 'Streak locked',
      body: 'Nice run. Keep rest days sacred — skip junk volume, not recovery.',
    };
  }

  // Goal-specific one-liners
  if (goal === 'fatloss') {
    return {
      title: 'Ask coach',
      body: 'Pair today’s work with a walk after class. Cardio does not need a gym.',
    };
  }

  if (goal === 'endurance') {
    return {
      title: 'Ask coach',
      body: 'Add easy Zone-2 minutes this week — talking pace, not sprinting.',
    };
  }

  if (goal === 'hypertrophy' || goal === 'strength') {
    return {
      title: 'Ask coach',
      body: 'Next session, try one extra clean rep on your main lift before adding weight.',
    };
  }

  // First few sessions
  if (sessions <= 2) {
    return {
      title: 'Getting started',
      body: 'Focus on form this week. Volume can wait until the moves feel familiar.',
    };
  }

  return {
    title: 'Ask coach',
    body: 'Log how you felt. Sore is fine; sharp joint pain means swap that move next time.',
  };
}
