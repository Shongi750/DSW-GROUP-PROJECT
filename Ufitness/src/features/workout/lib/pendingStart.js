import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ufitness.workout.pending.v1';

export async function queueWorkoutAction(action) {
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...action, at: Date.now() }));
}

export async function takeWorkoutAction() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    await AsyncStorage.removeItem(KEY);
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}
