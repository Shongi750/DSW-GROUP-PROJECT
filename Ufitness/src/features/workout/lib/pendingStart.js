import AsyncStorage from '@react-native-async-storage/async-storage';

// Tiny "inbox" between Home and the Workout tab.
// Home writes an action here, Workout Home reads it once and clears it.
// (We need this because the two screens live in different navigators.)

const KEY = 'ufitness.workout.pending.v1';

export async function queueWorkoutAction(action) {
  const payload = Object.assign({}, action, { at: Date.now() });
  await AsyncStorage.setItem(KEY, JSON.stringify(payload));
}

export async function takeWorkoutAction() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;

    // clear first so we don't run the same action twice
    await AsyncStorage.removeItem(KEY);

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (e) {
    return null;
  }
}
