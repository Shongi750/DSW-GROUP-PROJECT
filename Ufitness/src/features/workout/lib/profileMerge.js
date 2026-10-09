// Pure profile-merge rules, deliberately free of backend or React Native imports so they
// can be reasoned about (and tested) on their own.
import { ownsLocalData } from '../../../lib/authGuard';

function uniqueStrings(...lists) {
  return [...new Set(lists.flat().filter(Boolean))];
}

function mergeById(localList = [], remoteList = [], limit = 60) {
  const byId = new Map();
  [...remoteList, ...localList].forEach((item) => {
    if (item?.id) byId.set(item.id, item);
  });
  return [...byId.values()]
    .sort((a, b) => String(b.date || b.createdAt || '').localeCompare(String(a.date || a.createdAt || '')))
    .slice(0, limit);
}

function mergeLastSets(local = {}, remote = {}) {
  const merged = { ...remote };
  Object.entries(local).forEach(([id, entry]) => {
    const existing = merged[id];
    const better =
      !existing ||
      (entry?.weightKg || 0) > (existing.weightKg || 0) ||
      ((entry?.weightKg || 0) === (existing.weightKg || 0) && (entry?.reps || 0) > (existing.reps || 0));
    if (better) merged[id] = entry;
  });
  return merged;
}

/**
 * Lists are unioned so no logged session is ever lost. Single-value settings come from
 * whichever side was written most recently.
 */
export function mergeProfiles(local, remote) {
  if (!remote) return { ...local, mergedFrom: 'local' };
  if (!local) return { ...remote, mergedFrom: 'remote' };

  const localNewer = new Date(local.updatedAt || 0) > new Date(remote.updatedAt || 0);
  const base = localNewer ? { ...remote, ...local } : { ...local, ...remote };

  return {
    ...base,
    history: mergeById(local.history, remote.history),
    customWorkouts: mergeById(local.customWorkouts, remote.customWorkouts, 20),
    completedExerciseIds: uniqueStrings(local.completedExerciseIds || [], remote.completedExerciseIds || []),
    favorites: uniqueStrings(local.favorites || [], remote.favorites || []),
    lastSets: mergeLastSets(local.lastSets, remote.lastSets),
    musicLinks: { ...(remote.musicLinks || {}), ...(local.musicLinks || {}) },
    mergedFrom: localNewer ? 'local' : 'remote',
  };
}

/**
 * Guest data belongs to whoever is on the device, so it is folded into the account on first
 * sign-in. Data from an old offline build ("local-<same email>") is migrated once. Data owned by
 * a different account is never merged across.
 */
export function resolveProfileForUser({ localProfile, remoteProfile, uid, email }) {
  const mine = ownsLocalData(localProfile?.ownerUid || null, { uid, email });

  if (!remoteProfile) {
    // Nothing in the cloud yet: keep our own local progress, never another student's.
    if (mine) return { ...localProfile, ownerUid: uid, mergedFrom: 'local' };
    return { ownerUid: uid, mergedFrom: 'empty' };
  }
  if (mine) {
    return { ...mergeProfiles(localProfile, remoteProfile), ownerUid: uid };
  }
  return { ...remoteProfile, ownerUid: uid, mergedFrom: 'remote' };
}

/**
 * Pick the best local copy of the workout profile for this account on sign-in.
 * Order: the per-account cache (written on every save) → the shared "active" copy if it is
 * ours (same uid, legacy local-<email>, or ownerless guest data) → nothing.
 */
export function pickLocalWorkoutProfile({ perUser, active, uid, email }) {
  if (perUser && typeof perUser === 'object') return perUser;
  if (active && typeof active === 'object' && ownsLocalData(active.ownerUid || null, { uid, email })) {
    return active;
  }
  return null;
}

/** AsyncStorage key for one account's workout profile cache. */
export function workoutProfileKeyFor(baseKey, uid) {
  return uid ? `${baseKey}:${uid}` : baseKey;
}
