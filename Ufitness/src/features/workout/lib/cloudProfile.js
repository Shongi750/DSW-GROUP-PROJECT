import { fetchCloudDoc, fetchCloudDocResult, saveCloudDoc } from '../../../lib/cloudCache';

export { mergeProfiles, resolveProfileForUser, pickLocalWorkoutProfile, workoutProfileKeyFor } from './profileMerge';

export async function fetchRemoteProfile(uid) {
  if (!uid) return null;
  const remote = await fetchCloudDoc('workout', uid);
  return remote && typeof remote === 'object' ? remote : null;
}

/** { ok, profile } — ok is false when the cloud could not be reached (do not overwrite it). */
export async function fetchRemoteProfileResult(uid) {
  if (!uid) return { ok: false, profile: null };
  const { ok, data } = await fetchCloudDocResult('workout', uid);
  return { ok, profile: data && typeof data === 'object' ? data : null };
}

export async function saveRemoteProfile(uid, profile) {
  if (!uid || !profile) return false;
  return saveCloudDoc('workout', uid, profile);
}
