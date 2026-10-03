import AsyncStorage from '@react-native-async-storage/async-storage';
import { sessionStreak, weekActivity } from '../data/progress';

const PROFILE_KEY = 'workoutapp.profile.v1';

// Simple week + streak pulse for Home and the finish screen.
export async function loadWeekPulse() {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    const profile = raw ? JSON.parse(raw) : {};
    const history = Array.isArray(profile.history) ? profile.history : [];
    return {
      streak: sessionStreak(history),
      week: weekActivity(history),
    };
  } catch {
    return { streak: 0, week: [] };
  }
}
