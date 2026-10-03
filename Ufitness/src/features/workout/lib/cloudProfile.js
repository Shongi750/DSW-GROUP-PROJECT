import { fetchCloudDoc, saveCloudDoc } from '../../../lib/cloudCache';

export { mergeProfiles, resolveProfileForUser } from './profileMerge';

export async function fetchRemoteProfile(uid) {
  if (!uid) return null;
  const remote = await fetchCloudDoc('workout', uid);
  return remote && typeof remote === 'object' ? remote : null;
}

export async function saveRemoteProfile(uid, profile) {
  if (!uid || !profile) return false;
  return saveCloudDoc('workout', uid, profile);
}
