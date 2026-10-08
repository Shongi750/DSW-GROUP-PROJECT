import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from './supabase';
import { clearFlushed, dirtyFor, isOfflineError, markDirty } from './syncQueueCore';
import { syncStatusFor } from './cloudErrors';
import { setSyncStatus } from './syncStatus';

// Offline sync queue (stored in AsyncStorage so it survives an app restart).
// cloudCache.saveCloudDoc / cloudUser.saveCloudUser call queueWrite() when a save
// fails because the phone is offline. flushQueue() sends everything up again.

const KEY = 'ufitness.syncQueue.v1';

let queue = null; // loaded lazily
let flushing = false;
const flushListeners = new Set();

async function load() {
  if (queue) return queue;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    queue = parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    queue = {};
  }
  return queue;
}

async function save() {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(queue || {}));
  } catch {
    /* storage full — the data is still in the app's own local copy */
  }
}

/** Remember the latest copy of a row that couldn't be saved. */
export async function queueWrite({ table, uid, doc = '', row }) {
  await load();
  queue = markDirty(queue, { table, uid, doc, row });
  await save();
}

export async function pendingWrites(uid) {
  await load();
  return dirtyFor(queue, uid).length;
}

export function isFlushing() {
  return flushing;
}

/** Called after every successful flush (screens refresh buddies / groups / mentors). */
export function onFlushed(fn) {
  flushListeners.add(fn);
  return () => flushListeners.delete(fn);
}

/**
 * Send every dirty doc for this user to Supabase.
 * notify: tell screens to refresh even if nothing was queued (used after reconnect).
 * Returns 'synced' | 'local' | 'missing' | 'offline' | 'idle'.
 */
export async function flushQueue(uid, { notify = false } = {}) {
  if (!isSupabaseConfigured || !supabase || !uid || flushing) return 'idle';
  await load();
  const items = dirtyFor(queue, uid);
  flushing = true;
  if (items.length) setSyncStatus('syncing');

  let result = 'synced';
  for (const item of items) {
    try {
      const { error } = await supabase
        .from(item.table)
        .upsert({ ...item.row, updated_at: new Date().toISOString() });
      if (error) throw error;
      queue = clearFlushed(queue, item.key, item.updatedAt);
    } catch (error) {
      const status = syncStatusFor(error);
      if (isOfflineError(error)) {
        result = 'offline';
        break; // connection dropped again; try later
      }
      // A real server error (e.g. RLS, suspended): drop it so it doesn't retry forever.
      queue = clearFlushed(queue, item.key, item.updatedAt);
      result = status === 'missing' ? 'missing' : 'local';
    }
  }
  // Nothing was queued: a quick read tells us if the cloud is reachable / set up.
  if (!items.length && notify) {
    try {
      const { error } = await supabase.from('user_docs').select('doc').limit(1);
      result = isOfflineError(error) ? 'offline' : syncStatusFor(error);
    } catch (error) {
      result = isOfflineError(error) ? 'offline' : 'local';
    }
  }
  await save();
  flushing = false;
  if (items.length || notify) setSyncStatus(result);
  if (result !== 'offline' && (items.length || notify)) flushListeners.forEach((fn) => fn(result));
  return result;
}

/** Test helper / sign-out: forget everything queued. */
export async function clearQueue() {
  queue = {};
  await save();
}
