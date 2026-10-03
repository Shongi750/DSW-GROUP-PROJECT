import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { currentUid } from '../../lib/cloudCache';

export async function ensureGroupLive(group, actor) {
  if (!isSupabaseConfigured || !supabase || !group?.id) return false;
  const { error } = await supabase.rpc('ensure_group', {
    p_id: group.id,
    p_name: group.name || group.id,
    p_campus: group.campus || '',
    p_about: group.about || '',
    p_next_session: group.nextSession || '',
  });
  if (error) {
    console.warn('ensure_group failed', error.message);
    return false;
  }
  return true;
}

export async function joinGroupLive(groupId, actor, groupMeta = null) {
  const uid = actor?.uid || currentUid();
  if (!isSupabaseConfigured || !supabase || !groupId || !uid) return false;
  await ensureGroupLive(
    groupMeta || { id: groupId, name: groupId },
    actor
  );
  const { error } = await supabase.from('group_members').upsert(
    { group_id: groupId, user_id: uid, name: actor?.name || 'Student' },
    { onConflict: 'group_id,user_id' }
  );
  if (error) {
    // Upsert may fail if SELECT of existing row is blocked; fall back to insert.
    const inserted = await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: uid,
      name: actor?.name || 'Student',
    });
    return !inserted.error || String(inserted.error.code) === '23505';
  }
  return true;
}

export async function leaveGroupLive(groupId, actorOrUid) {
  const uid = typeof actorOrUid === 'string' ? actorOrUid : actorOrUid?.uid || currentUid();
  if (!supabase || !groupId || !uid) return false;
  const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', uid);
  return !error;
}

export async function loadGroupMembers(groupId) {
  if (!supabase || !groupId) return [];
  const { data, error } = await supabase
    .from('group_members')
    .select('user_id, name')
    .eq('group_id', groupId);
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.user_id,
    name: row.name || 'Student',
    role: row.user_id === currentUid() ? 'You' : 'Member',
  }));
}

export async function loadGroupMessages(groupId) {
  if (!supabase || !groupId) return [];
  const { data, error } = await supabase
    .from('group_messages')
    .select('id, user_id, author, body, created_at')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })
    .limit(80);
  if (error || !data) return [];
  return data.map(shapeMessage);
}

export async function sendGroupMessage(groupId, { body }) {
  const uid = currentUid();
  const text = String(body || '').trim().slice(0, 1000);
  if (!supabase || !groupId || !uid || !text) return null;
  // author is derived server-side from the caller's profile.
  const { data, error } = await supabase
    .from('group_messages')
    .insert({ group_id: groupId, user_id: uid, body: text })
    .select('id, user_id, author, body, created_at')
    .maybeSingle();
  if (error || !data) return null;
  return shapeMessage(data);
}

export function subscribeGroupChat(groupId, onInsert) {
  if (!supabase || !groupId) return () => {};
  const channel = supabase
    .channel(`group-chat-${groupId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` },
      (payload) => {
        if (payload?.new) onInsert(shapeMessage(payload.new));
      }
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

function shapeMessage(row) {
  return {
    id: row.id,
    userId: row.user_id,
    author: row.author || 'Student',
    text: row.body || '',
    time: row.created_at
      ? new Date(row.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
      : '',
  };
}
