// Offline sync queue — the pure part (no storage, no network), so it's easy to test.
//
// The queue is a plain object: { [key]: entry }
//   key   = 'profiles:<uid>' or 'user_docs:<uid>:<doc>'
//   entry = { table, uid, row, updatedAt }
// Only the latest copy of each doc is kept: saving the same doc twice while
// offline replaces the first copy.

export function queueKey(table, uid, doc = '') {
  return doc ? `${table}:${uid}:${doc}` : `${table}:${uid}`;
}

/** Add / replace a dirty doc. Returns a new queue object. */
export function markDirty(queue, { table, uid, doc = '', row }, now = Date.now()) {
  if (!table || !uid || !row) return queue || {};
  const key = queueKey(table, uid, doc);
  return { ...(queue || {}), [key]: { table, uid, doc, row, updatedAt: now } };
}

/**
 * Remove a doc after it was flushed — but only if nobody saved a newer copy
 * while the flush was running (that newer copy must still go up).
 */
export function clearFlushed(queue, key, flushedVersion) {
  const entry = queue?.[key];
  if (!entry) return queue || {};
  if (entry.updatedAt > flushedVersion) return queue;
  const next = { ...queue };
  delete next[key];
  return next;
}

/** Dirty entries for one user, oldest first (profile before docs when same time). */
export function dirtyFor(queue, uid) {
  return Object.entries(queue || {})
    .filter(([, entry]) => entry?.uid === uid)
    .sort(([, a], [, b]) => a.updatedAt - b.updatedAt || (a.table === 'profiles' ? -1 : 1))
    .map(([key, entry]) => ({ key, ...entry }));
}

export function pendingCount(queue, uid) {
  return dirtyFor(queue, uid).length;
}

/** True when a Supabase / fetch error means "no connection" (worth retrying later). */
export function isOfflineError(error) {
  if (!error) return false;
  const message = String(error.message || error || '');
  if (/network request failed|failed to fetch|load failed|fetch failed|networkerror|network error|timed? ?out|ENOTFOUND|ECONNREFUSED|ERR_INTERNET_DISCONNECTED/i.test(message)) {
    return true;
  }
  return Number(error.status) === 0 && !error.code;
}

/** What the sync badge should say. */
export function badgeFor({ online, flushing, lastResult }) {
  if (!online) return 'offline';
  if (flushing) return 'syncing';
  return lastResult || 'synced';
}
