// Pure profile-merge rules, deliberately free of Firebase or React Native imports so they
// can be reasoned about (and tested) on their own.

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
 * sign-in. Data owned by a different account is never merged across.
 */
export function resolveProfileForUser({ localProfile, remoteProfile, uid }) {
  const localOwner = localProfile?.ownerUid || null;
  const localIsGuestData = !localOwner;
  const localBelongsToUser = localOwner === uid;

  if (!remoteProfile) {
    return { ...localProfile, ownerUid: uid, mergedFrom: 'local' };
  }
  if (localIsGuestData || localBelongsToUser) {
    return { ...mergeProfiles(localProfile, remoteProfile), ownerUid: uid };
  }
  return { ...remoteProfile, ownerUid: uid, mergedFrom: 'remote' };
}
