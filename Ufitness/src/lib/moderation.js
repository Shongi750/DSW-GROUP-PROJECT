import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from './supabase';
import { currentUid } from './cloudCache';
import { cloudErrorMessage, isMissingTableError } from './cloudErrors';
import { isValidReason, reportExcerpt } from './blockFilter';
import { adminActionError, suspendedFromLog } from './moderationRules';

// Report + block for chats and the community feed.
// - Reports go to the Supabase `chat_reports` table (only Campus Admin can read them).
// - Blocks live in `user_blocks` (only you can see your list) plus a small local copy,
//   so blocked people stay hidden offline. Feed posts have no account id, so those
//   blocks are by name and stay on this phone.

const LOCAL_KEY = 'ufitness.blocks.v1';

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || '')
  );
}

function cloudReady() {
  return Boolean(isSupabaseConfigured && supabase && currentUid());
}

// ---- blocked list store (shared by every chat screen) ------------------------

let blocked = []; // [{ key, name }] — key is a user id or a "name:..." key
let loadedFor = null;
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => fn(blocked));
}

async function readLocal(uid) {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return Array.isArray(all?.[uid]) ? all[uid] : [];
  } catch {
    return [];
  }
}

async function writeLocal(uid, list) {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    const all = raw ? JSON.parse(raw) : {};
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify({ ...all, [uid]: list }));
  } catch {
    /* storage full — the cloud copy still works */
  }
}

function mergeLists(first, second) {
  const seen = new Set();
  return [...first, ...second].filter((item) => {
    if (!item?.key || seen.has(item.key)) return false;
    seen.add(item.key);
    return true;
  });
}

/** Load my blocked list (cloud + local). Cached per signed-in user. */
export async function loadBlocks({ force = false } = {}) {
  const uid = currentUid();
  if (!uid) {
    blocked = [];
    loadedFor = null;
    emit();
    return blocked;
  }
  if (loadedFor === uid && !force) return blocked;

  let list = await readLocal(uid);
  if (cloudReady()) {
    const { data, error } = await supabase.from('user_blocks').select('blocked_id, blocked_name');
    if (!error && Array.isArray(data)) {
      const cloudList = data.map((row) => ({ key: row.blocked_id, name: row.blocked_name || 'Student' }));
      list = mergeLists(cloudList, list);
    }
  }
  blocked = list;
  loadedFor = uid;
  await writeLocal(uid, list);
  emit();
  return blocked;
}

export function blockedKeys() {
  return new Set(blocked.map((item) => item.key));
}

/** Block someone. key = their user id (or a name key for feed posts). */
export async function blockUser({ key, name }) {
  const uid = currentUid();
  if (!uid || !key || key === uid) return { ok: false, message: 'You cannot block this person.' };

  blocked = mergeLists([{ key, name: name || 'Student' }], blocked);
  await writeLocal(uid, blocked);
  emit();

  if (isUuid(key) && cloudReady()) {
    const { error } = await supabase
      .from('user_blocks')
      .upsert({ blocker_id: uid, blocked_id: key, blocked_name: String(name || '').slice(0, 120) });
    if (error) {
      return { ok: true, message: `Hidden on this phone. ${cloudErrorMessage(error)}` };
    }
  }
  return { ok: true, message: `${name || 'They'} won't show up in your chats any more.` };
}

export async function unblockUser(key) {
  const uid = currentUid();
  if (!uid || !key) return false;
  blocked = blocked.filter((item) => item.key !== key);
  await writeLocal(uid, blocked);
  emit();
  if (isUuid(key) && cloudReady()) {
    await supabase.from('user_blocks').delete().eq('blocker_id', uid).eq('blocked_id', key);
  }
  return true;
}

/** Current blocked list: [{ key, name }] (user ids and feed name keys). */
export function blockedList() {
  return blocked;
}

/** React hook: the blocked list itself, for the Blocked users screen. */
export function useBlockedList() {
  const [list, setList] = useState(() => blocked);
  useEffect(() => {
    const onChange = (next) => setList([...next]);
    listeners.add(onChange);
    loadBlocks({ force: true }).then(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);
  return list;
}

/** React hook: Set of blocked keys that updates when anyone blocks / unblocks. */
export function useBlockedKeys() {
  const [keys, setKeys] = useState(() => blockedKeys());
  useEffect(() => {
    const onChange = () => setKeys(blockedKeys());
    listeners.add(onChange);
    loadBlocks().then(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);
  return keys;
}

// ---- reports ---------------------------------------------------------------

/**
 * Report a message or post.
 * table: 'group_messages' | 'direct_messages' | 'community_posts'
 * Returns { ok, message } with text to show the student.
 */
export async function reportMessage({ table, messageId, authorId, authorName, reason, text }) {
  if (!isValidReason(reason)) return { ok: false, message: 'Pick a reason first.' };
  if (!cloudReady()) return { ok: false, message: 'Sign in (and go online) to send a report.' };

  const { error } = await supabase.from('chat_reports').insert({
    reporter_id: currentUid(),
    message_table: table,
    message_id: String(messageId || ''),
    reported_user_id: isUuid(authorId) ? authorId : null,
    reported_name: String(authorName || '').slice(0, 120),
    reason,
    excerpt: reportExcerpt(text),
  });

  if (!error) return { ok: true, message: 'Thanks. Campus Admin will review it.' };
  if (error.code === '23505') return { ok: true, message: 'You already reported this. Thanks.' };
  if (isMissingTableError(error)) {
    return { ok: false, message: 'Reports are not set up in the cloud yet. Ask the team to run the latest SQL.' };
  }
  return { ok: false, message: cloudErrorMessage(error) };
}

const REPORT_COLUMNS = 'id, message_table, message_id, reported_user_id, reported_name, reason, excerpt, created_at';

/** Campus Admin: latest reports. Returns { rows, error }. */
export async function loadReports({ limit = 50 } = {}) {
  if (!cloudReady()) return { rows: [], error: 'Sign in to see reports.' };
  let { data, error } = await supabase
    .from('chat_reports')
    .select(`${REPORT_COLUMNS}, status, resolved_at`)
    .order('created_at', { ascending: false })
    .limit(limit);
  // Moderation SQL not run yet → no status column; show the old list.
  if (error && /status|resolved_at|column/i.test(String(error.message || ''))) {
    ({ data, error } = await supabase
      .from('chat_reports')
      .select(REPORT_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(limit));
  }
  if (error) {
    return {
      rows: [],
      error: isMissingTableError(error) ? 'Reports table missing — run the latest SQL.' : cloudErrorMessage(error),
    };
  }
  return {
    rows: (data || []).map((row) => ({
      id: row.id,
      table: row.message_table,
      messageId: row.message_id,
      reportedUserId: row.reported_user_id,
      reportedName: row.reported_name || 'Unknown',
      reason: row.reason,
      excerpt: row.excerpt || '',
      status: row.status || 'open',
      resolvedAt: row.resolved_at || null,
      createdAt: row.created_at,
    })),
    error: '',
  };
}

// ---- Campus Admin actions (server checks is_campus_admin()) ---------------------

async function adminRpc(name, args, okMessage) {
  if (!cloudReady()) return { ok: false, message: 'Sign in (and go online) first.' };
  const { data, error } = await supabase.rpc(name, args);
  if (error) return { ok: false, message: adminActionError(error) };
  return { ok: true, data, message: okMessage };
}

/** status: 'resolved' | 'dismissed' | 'open' */
export function resolveReport(reportId, status) {
  const words = { resolved: 'Marked resolved.', dismissed: 'Dismissed.', open: 'Reopened.' };
  return adminRpc('admin_resolve_report', { p_report_id: reportId, p_status: status }, words[status] || 'Saved.');
}

export function deleteReportedMessage(table, messageId) {
  return adminRpc('admin_delete_message', { p_table: table, p_message_id: messageId }, 'Message deleted.');
}

export function setUserSuspended(userId, on, reason = '') {
  return adminRpc(
    'admin_set_suspended',
    { p_user_id: userId, p_on: on, p_reason: reason },
    on ? 'Account suspended.' : 'Suspension lifted.'
  );
}

/** Admin: ids of suspended students in the latest moderation log (best effort). */
export async function loadSuspendedIds() {
  if (!cloudReady()) return [];
  const { data, error } = await supabase
    .from('moderation_actions')
    .select('action, target_user_id, created_at')
    .in('action', ['suspend', 'unsuspend'])
    .order('created_at', { ascending: true })
    .limit(500);
  if (error || !data) return [];
  return suspendedFromLog(data);
}

// ---- My own account ------------------------------------------------------------

/** { suspended, reason } for the signed-in student. Missing column / offline → not suspended. */
export async function fetchMySuspension() {
  if (!cloudReady()) return { suspended: false, reason: '' };
  const { data, error } = await supabase
    .from('profiles')
    .select('suspended, suspended_reason')
    .eq('id', currentUid())
    .maybeSingle();
  if (error || !data) return { suspended: false, reason: '' };
  return { suspended: data.suspended === true, reason: data.suspended_reason || '' };
}
