import { supabase } from '../../../config/supabase';

export const ALL_BADGES = [
  {
    id: 'first_workout',
    title: 'First Workout',
    icon: 'medal-outline',
    description: 'Completed your first workout on campus',
    checkUnlocked: (totalWorkouts, totalMinutes) => totalWorkouts >= 1,
  },
  {
    id: 'heavy_lifter',
    title: 'Heavy Lifter',
    icon: 'barbell-outline',
    description: 'Completed 5 full workout sessions',
    checkUnlocked: (totalWorkouts, totalMinutes) => totalWorkouts >= 5,
  },
  {
    id: 'workouts_10',
    title: '10 Club',
    icon: 'flame-outline',
    description: 'Hit 10 completed workouts',
    checkUnlocked: (totalWorkouts, totalMinutes) => totalWorkouts >= 10,
  },
  {
    id: 'endurance_champ',
    title: 'Endurance Champ',
    icon: 'flash-outline',
    description: 'Logged over 60 active workout minutes',
    checkUnlocked: (totalWorkouts, totalMinutes) => totalMinutes >= 60,
  },
];

export const evaluateAndAwardBadges = async (userId, totalWorkouts, totalMinutes) => {
  const { data: progressData, error: fetchError } = await supabase
    .from('user_progress')
    .select('unlockedBadgeIds')
    .eq('id', userId)
    .single();

  let existingBadges = [];

  if (fetchError && fetchError.code === 'PGRST116') {
    await supabase.from('user_progress').insert([{ id: userId, unlockedBadgeIds: [] }]);
  } else if (progressData) {
    existingBadges = progressData.unlockedBadgeIds || [];
  }

  const newlyUnlocked = [];

  ALL_BADGES.forEach((badge) => {
    if (!existingBadges.includes(badge.id)) {
      if (badge.checkUnlocked(totalWorkouts, totalMinutes)) {
        newlyUnlocked.push(badge);
      }
    }
  });

  if (newlyUnlocked.length > 0) {
    const newBadgeIds = newlyUnlocked.map((b) => b.id);
    const updatedBadges = [...existingBadges, ...newBadgeIds];

    await supabase
      .from('user_progress')
      .update({ unlockedBadgeIds: updatedBadges })
      .eq('id', userId);
  }

  return newlyUnlocked;
};