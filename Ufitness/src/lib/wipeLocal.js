import AsyncStorage from '@react-native-async-storage/async-storage';
import { disableUnlock } from './biometrics';
import { removeAllDownloads } from './downloads/downloadsStore';

const KEYS = [
  'ufitness.session.v1',
  'ufitness.profiles.v1',
  'ufitness.meals.plan.v1',
  'ufitness.community.v1',
  'ufitness.theme.v1',
  'ufitness.reminders.v1',
  'ufitness.pendingSignup.v1',
  'ufitness.auth.rememberEmail.v1',
  'ufitness.workout.dailyClips.v1',
  'ufitness.workout.savedClips.v1',
  'ufitness.workout.pending.v1',
  'ufitness.workout.savedSessions.v1',
  'ufitness.syncQueue.v1',
  'ufitness.mentor.requests.v1',
  'ufitness.admin.v1',
  'workoutapp.profile.v1',
  'workoutapp.guest.v1',
];

export async function wipeLocalUfitnessData() {
  await AsyncStorage.multiRemove(KEYS);
  await removeAllDownloads().catch(() => {}); // offline downloads + their files
  await disableUnlock();
}
