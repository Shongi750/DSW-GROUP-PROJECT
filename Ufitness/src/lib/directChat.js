import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from './supabase';
import { currentUid } from './cloudCache';

const LOCAL_KEY = 'ufitness.dm.local.v1';

export function isUuid(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(id || '')
  );
}

export function threadKey(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  return left < right ? `${left}:${right}` : `${right}:${left}`;
}

function shape(row) {
  return {
    id: row.id,
    fromId: row.from_id,
    toId: row.to_id,
    body: row.body || '',
    createdAt: row.created_at,
    mine: row.from_id === currentUid(),
  };
}

async function readLocal() {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeLocal(all) {
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(all));
}

/** Cloud DMs when peer is a real auth user; otherwise device-local (demo mentors). */
export async function loadThread(peerId, { limit = 80 } = {}) {
  const me = currentUid();
  if (!me || !peerId || peerId === me) return [];

  if (isUuid(peerId) && isSupabaseConfigured && supabase) {
    const key = threadKey(me, peerId);
    const { data, error } = await supabase
      .from('direct_messages')
      .select('id, from_id, to_id, body, created_at')
      .eq('thread_key', key)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error || !data) return [];
    return data.map(shape);
  }

  const all = await readLocal();
  const key = threadKey(me, peerId);
  const rows = Array.isArray(all[key]) ? all[key] : [];
  return rows.map((row) => ({
    ...row,
    mine: row.fromId === me,
  }));
}

export async function sendDirectMessage(peerId, body) {
  const me = currentUid();
  const text = String(body || '').trim().slice(0, 1000);
  if (!me || !peerId || peerId === me || !text) return null;

  if (isUuid(peerId) && isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('direct_messages')
      .insert({ from_id: me, to_id: peerId, body: text })
      .select('id, from_id, to_id, body, created_at')
      .maybeSingle();
    if (error || !data) return null;
    return shape(data);
  }

  const key = threadKey(me, peerId);
  const all = await readLocal();
  const row = {
    id: `local-${Date.now()}`,
    fromId: me,
    toId: peerId,
    body: text,
    createdAt: new Date().toISOString(),
    mine: true,
  };
  all[key] = [...(Array.isArray(all[key]) ? all[key] : []), row];
  await writeLocal(all);
  return row;
}

export function subscribeThread(peerId, onInsert) {
  const me = currentUid();
  if (!me || !peerId || !isUuid(peerId) || !supabase) return () => {};

  const key = threadKey(me, peerId);
  const channel = supabase
    .channel(`dm-${key}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `thread_key=eq.${key}`,
      },
      (payload) => {
        if (payload?.new) onInsert(shape(payload.new));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function areMatchedBuddies(peerId) {
  if (!supabase || !isUuid(peerId)) return false;
  const me = currentUid();
  if (!me) return false;
  const { data, error } = await supabase
    .from('buddy_requests')
    .select('id, from_id, to_id')
    .eq('status', 'accepted')
    .or(`from_id.eq.${me},to_id.eq.${me}`);
  if (error || !data?.length) return false;
  return data.some(
    (row) =>
      (row.from_id === me && row.to_id === peerId) ||
      (row.from_id === peerId && row.to_id === me)
  );
}
