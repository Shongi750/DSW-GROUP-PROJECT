// Small helpers for Supabase / PostgREST errors. No React Native imports,
// so these are easy to unit test.
import { isOfflineError } from './syncQueueCore';

// 42P01   = Postgres "relation does not exist" (table missing)
// PGRST205 = PostgREST cannot find the table in its schema cache
// PGRST202 = PostgREST cannot find the function (rpc) in its schema cache
const MISSING_CODES = ['42P01', 'PGRST205', 'PGRST202'];

/** True when the error means schema.sql was never run (table or function missing). */
export function isMissingTableError(error) {
  if (!error) return false;
  const code = String(error.code || '').toUpperCase();
  if (MISSING_CODES.includes(code)) return true;
  const message = String(error.message || error || '');
  return /relation .* does not exist|could not find the (table|function)|schema cache/i.test(message);
}

/** Friendly text for a failed cloud write. */
export function cloudErrorMessage(error) {
  if (isMissingTableError(error)) {
    return 'The cloud is not set up yet (run supabase/schema.sql). Your change was not saved online.';
  }
  const message = String(error?.message || error || '');
  if (/network|fetch|timeout/i.test(message)) return 'No connection. Try again when you are online.';
  if (/row-level security|permission|not allowed|only the/i.test(message)) {
    return 'You are not allowed to do that.';
  }
  return message || 'Something went wrong. Try again.';
}

/**
 * What the sync badge should say after a cloud write.
 * 'synced' | 'missing' (cloud not set up) | 'offline' (queued, sent when back online)
 * | 'local' (saved on this phone only)
 */
export function syncStatusFor(error) {
  if (!error) return 'synced';
  if (isMissingTableError(error)) return 'missing';
  if (isOfflineError(error)) return 'offline';
  return 'local';
}

/** When several saves finish together, show the "worst" result. */
export function worseStatus(a, b) {
  const rank = { synced: 0, local: 1, offline: 2, missing: 3 };
  return (rank[b] ?? 0) > (rank[a] ?? 0) ? b : a;
}
