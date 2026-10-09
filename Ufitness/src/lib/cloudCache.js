import { isSupabaseConfigured, supabase } from './supabase';
import { isMissingTableError } from './cloudErrors';
import { beginCloudWrite, endCloudWrite, setSyncStatus } from './syncStatus';
import { isOfflineError } from './syncQueueCore';
import { queueWrite } from './syncQueue';
import { isOnline } from './autoSync';

let cachedUid = null;

export function setCurrentUid(uid) {
  cachedUid = uid || null;
}

export function currentUid() {
  return cachedUid;
}

function jsonSafe(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

function safeUri(value) {
  if (typeof value === 'string' && /^https?:\/\//i.test(value)) return value;
  if (value?.uri && /^https?:\/\//i.test(value.uri)) return value.uri;
  return '';
}

export function cloudSafeMeals(state) {
  return jsonSafe(state) || {};
}

export function cloudSafeCommunity(state) {
  return {
    posts: (state?.posts || []).slice(0, 40).map((post) => ({
      id: post.id,
      author: post.author || '',
      text: post.text || '',
      likes: Number(post.likes) || 0,
      comments: (post.comments || []).slice(0, 20).map((item) => ({
        id: item.id,
        author: item.author || '',
        text: item.text || '',
      })),
      isCheckIn: Boolean(post.isCheckIn),
      campus: post.campus || '',
      imageUri: safeUri(post.imageUri),
      workoutStats: post.workoutStats || null,
      recipe: post.recipe || null,
      workoutClip: post.workoutClip
        ? {
            title: post.workoutClip.title || '',
            musicTitle: post.workoutClip.musicTitle || '',
            musicArtist: post.workoutClip.musicArtist || '',
            videoUri: safeUri(post.workoutClip.videoUri),
          }
        : null,
    })),
    gymStatuses: state?.gymStatuses || {},
    groups: (state?.groups || []).map((group) => ({
      id: group.id,
      name: group.name || '',
      campus: group.campus || '',
      status: group.status || 'none',
      about: group.about || '',
      nextSession: group.nextSession || '',
    })),
  };
}

/**
 * Like fetchCloudDoc, but tells "not found" apart from "could not ask".
 * { ok: true, data }  → the cloud answered (data is null when there is no row yet)
 * { ok: false, data: null } → offline / no Supabase / table missing / error
 * Callers must NOT push a local copy over the cloud when ok is false, or an offline
 * sign-in would overwrite the student's saved progress with an empty profile.
 */
export async function fetchCloudDocResult(doc, uid = currentUid()) {
  if (!isSupabaseConfigured || !supabase || !uid || !doc) return { ok: false, data: null };
  try {
    const { data, error } = await supabase
      .from('user_docs')
      .select('data')
      .eq('user_id', uid)
      .eq('doc', doc)
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error)) setSyncStatus('missing');
      return { ok: false, data: null };
    }
    return { ok: true, data: data?.data ?? null };
  } catch {
    return { ok: false, data: null };
  }
}

export async function fetchCloudDoc(doc, uid = currentUid()) {
  const result = await fetchCloudDocResult(doc, uid);
  return result.data;
}

export async function saveCloudDoc(doc, uid, data) {
  if (!isSupabaseConfigured || !supabase) {
    setSyncStatus('local'); // no Supabase keys → phone only
    return false;
  }
  if (!uid || !doc) return false;
  const payload = jsonSafe(data);
  if (!payload) return false;
  const row = { user_id: uid, doc, data: payload };

  // Known offline: don't even try, just queue the latest copy.
  if (!isOnline()) {
    await queueWrite({ table: 'user_docs', uid, doc, row });
    setSyncStatus('offline');
    return false;
  }

  beginCloudWrite();
  try {
    const { error } = await supabase.from('user_docs').upsert({ ...row, updated_at: new Date().toISOString() });
    if (error && isOfflineError(error)) await queueWrite({ table: 'user_docs', uid, doc, row });
    endCloudWrite(error);
    return !error;
  } catch (error) {
    if (isOfflineError(error)) await queueWrite({ table: 'user_docs', uid, doc, row });
    endCloudWrite(error);
    return false;
  }
}

/** Quick check after sign-in: are the Supabase tables there? Drives the sync badge. */
export async function checkCloudSetup() {
  if (!isSupabaseConfigured || !supabase) {
    setSyncStatus('local');
    return 'local';
  }
  try {
    const { error } = await supabase.from('user_docs').select('doc').limit(1);
    const next = !error ? 'synced' : isMissingTableError(error) ? 'missing' : 'local';
    setSyncStatus(next);
    return next;
  } catch {
    setSyncStatus('local');
    return 'local';
  }
}

export async function deleteCloudCaches(uid = currentUid()) {
  if (!isSupabaseConfigured || !supabase || !uid) return;
  try {
    await supabase.from('user_docs').delete().eq('user_id', uid);
  } catch {
    /* table may not exist until schema.sql is run */
  }
}
