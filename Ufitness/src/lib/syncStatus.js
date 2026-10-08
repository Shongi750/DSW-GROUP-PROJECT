import { syncStatusFor, worseStatus } from './cloudErrors';

// Tiny shared store for the sync badge (SyncStatus component).
// Status values:
//   'idle'    nothing saved yet this session (badge hidden)
//   'saving'  a cloud write is running
//   'synced'  last writes reached Supabase
//   'local'   saved on this phone only (offline / signed out / cloud error)
//   'missing' Supabase tables are missing → run supabase/schema.sql
//   'offline' no connection; changes wait in the sync queue (src/lib/syncQueue.js)
//   'syncing' the queue is being sent after reconnecting

let status = 'idle';
let pending = 0;
let burstResult = 'synced';
const listeners = new Set();

function emit(next) {
  status = next;
  listeners.forEach((fn) => fn(status));
}

export function getSyncStatus() {
  return status;
}

export function subscribeSyncStatus(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Set the badge directly (for example 'local' when there is no cloud at all). */
export function setSyncStatus(next) {
  if (pending === 0) emit(next);
}

/** Call before a cloud write starts. */
export function beginCloudWrite() {
  if (pending === 0) burstResult = 'synced';
  pending += 1;
  emit('saving');
}

/** Call when a cloud write ends, with its error (or null when it worked). */
export function endCloudWrite(error) {
  pending = Math.max(0, pending - 1);
  burstResult = worseStatus(burstResult, syncStatusFor(error));
  if (pending === 0) emit(burstResult);
}

/** Test helper: back to the start state. */
export function resetSyncStatus() {
  status = 'idle';
  pending = 0;
  burstResult = 'synced';
}
