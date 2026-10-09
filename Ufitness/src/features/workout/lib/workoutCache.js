import AsyncStorage from '@react-native-async-storage/async-storage';
import { pickLocalWorkoutProfile, workoutProfileKeyFor } from './profileMerge';

// The workout tab, Home's "today" card and week pulse all read one shared key.
// Each account also gets its own copy ("workoutapp.profile.v1:<uid>") so signing out,
// or another student signing in on the same phone, never loses anyone's progress.
export const WORKOUT_PROFILE_KEY = 'workoutapp.profile.v1';

function parse(raw) {
  try {
    const value = raw ? JSON.parse(raw) : null;
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
}

/** This account's best local workout profile (per-account cache → shared copy if ours). */
export async function readLocalWorkoutProfile(uid, email) {
  const [perUser, active] = await Promise.all([
    AsyncStorage.getItem(workoutProfileKeyFor(WORKOUT_PROFILE_KEY, uid)).then(parse).catch(() => null),
    AsyncStorage.getItem(WORKOUT_PROFILE_KEY).then(parse).catch(() => null),
  ]);
  return pickLocalWorkoutProfile({ perUser, active, uid, email });
}

/** Write the shared copy and (when signed in) the per-account copy. */
export async function writeLocalWorkoutProfile(uid, profile) {
  const raw = JSON.stringify(profile);
  const writes = [AsyncStorage.setItem(WORKOUT_PROFILE_KEY, raw)];
  if (uid) writes.push(AsyncStorage.setItem(workoutProfileKeyFor(WORKOUT_PROFILE_KEY, uid), raw));
  await Promise.all(writes).catch(() => {});
}

/**
 * On sign-in, point the shared key at this account's data before Home reads it, so Home
 * never shows the previous student's progress (or a blank one when ours is cached).
 */
export async function activateWorkoutProfileFor(uid, email) {
  if (!uid) return;
  const mine = await readLocalWorkoutProfile(uid, email);
  if (mine) {
    await writeLocalWorkoutProfile(uid, { ...mine, ownerUid: uid });
  } else {
    // Shared copy belongs to someone else: hide it (theirs stays in their own per-account key).
    await AsyncStorage.removeItem(WORKOUT_PROFILE_KEY).catch(() => {});
  }
}
