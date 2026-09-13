import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../../config/firebase';

export const ALL_BADGES = [
  {
    id: 'first_workout',
    title: 'First Workout',
    icon: '🏆',
    description: 'Completed your first workout on campus',
    checkUnlocked: (totalWorkouts, totalMinutes) => totalWorkouts >= 1,
  },
  {
    id: 'heavy_lifter',
    title: 'Heavy Lifter',
    icon: '💪🏽',
    description: 'Completed 5 full workout sessions',
    checkUnlocked: (totalWorkouts, totalMinutes) => totalWorkouts >= 5,
  },
  {
    id: 'workouts_10',
    title: '10 Club',
    icon: '🔥',
    description: 'Hit 10 completed workouts',
    checkUnlocked: (totalWorkouts, totalMinutes) => totalWorkouts >= 10,
  },
  {
    id: 'endurance_champ',
    title: 'Endurance Champ',
    icon: '⚡',
    description: 'Logged over 60 active workout minutes',
    checkUnlocked: (totalWorkouts, totalMinutes) => totalMinutes >= 60,
  },
];

export const evaluateAndAwardBadges = async (userId, totalWorkouts, totalMinutes) => {
  const userProgressRef = doc(db, 'user_progress', userId);
  const docSnap = await getDoc(userProgressRef);

  let existingBadges = [];
  if (docSnap.exists()) {
    existingBadges = docSnap.data().unlockedBadgeIds || [];
  } else {
    await setDoc(userProgressRef, { unlockedBadgeIds: [] });
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
    await updateDoc(userProgressRef, {
      unlockedBadgeIds: arrayUnion(...newBadgeIds),
    });
  }

  return newlyUnlocked;
};