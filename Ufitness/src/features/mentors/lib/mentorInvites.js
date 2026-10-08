import { isSupabaseConfigured, supabase } from '../../../lib/supabase';
import { currentUid } from '../../../lib/cloudCache';
import { cloudErrorMessage, isMissingTableError } from '../../../lib/cloudErrors';

// Mentor invites live in the Supabase `mentor_invites` table.
// Campus Admin sends (pending) → the student accepts or declines.
// Accepting calls accept_mentor_invite(), which also adds "mentor" to the
// student's roles on the server (students can't add that role themselves).

const COLUMNS = 'id, student_id, invited_by, student_name, message, status, created_at, responded_at';

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || '')
  );
}

function cloudReady() {
  return Boolean(isSupabaseConfigured && supabase && currentUid());
}

function mapRow(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name || 'Student',
    message: row.message || 'Would you like to be a mentor for other UJ students?',
    status: row.status,
    sentAt: row.created_at,
    respondedAt: row.responded_at,
  };
}

function inviteError(error) {
  if (isMissingTableError(error)) {
    return 'Mentor invites are not set up in the cloud yet. Run supabase/migrations/2026-10-08-invites-reports.sql.';
  }
  if (error?.code === '23505') return 'This student already has an open invite.';
  const message = String(error?.message || '');
  if (/already answered/i.test(message)) return 'This invite was already answered.';
  if (/not found/i.test(message)) return 'This invite is no longer available.';
  return cloudErrorMessage(error);
}

// ---- Campus Admin ------------------------------------------------------------

/** All invites the admin can see (newest first). Returns { rows, error }. */
export async function loadSentInvites() {
  if (!cloudReady()) return { rows: [], error: '' };
  const { data, error } = await supabase
    .from('mentor_invites')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return { rows: [], error: inviteError(error) };
  return { rows: (data || []).map(mapRow), error: '' };
}

/** Admin sends an invite. student = { id, name, inviteMessage }. Throws a friendly Error. */
export async function sendMentorInvite(student) {
  if (!cloudReady()) throw new Error('Sign in to send invites.');
  if (!isUuid(student?.id)) {
    throw new Error(`${student?.name || 'This student'} needs a UFitness cloud account before you can invite them.`);
  }
  const { data, error } = await supabase
    .from('mentor_invites')
    .insert({
      student_id: student.id,
      invited_by: currentUid(),
      student_name: String(student.name || '').slice(0, 120),
      message: String(student.inviteMessage || '').slice(0, 500),
    })
    .select(COLUMNS)
    .maybeSingle();
  if (error) throw new Error(inviteError(error));
  return data ? mapRow(data) : null;
}

// ---- Student -----------------------------------------------------------------

/** My open invite, or null. */
export async function loadMyPendingInvite() {
  if (!cloudReady()) return null;
  const { data, error } = await supabase
    .from('mentor_invites')
    .select(COLUMNS)
    .eq('student_id', currentUid())
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1);
  if (error || !data?.length) return null;
  return mapRow(data[0]);
}

/** Accept → returns the new roles array from the server. Throws a friendly Error. */
export async function acceptMentorInvite(inviteId) {
  if (!cloudReady()) throw new Error('Go online to accept the invite.');
  const { data, error } = await supabase.rpc('accept_mentor_invite', { p_invite_id: inviteId });
  if (error) throw new Error(inviteError(error));
  return Array.isArray(data) ? data : ['student', 'mentor'];
}

export async function declineMentorInvite(inviteId) {
  if (!cloudReady()) throw new Error('Go online to answer the invite.');
  const { error } = await supabase
    .from('mentor_invites')
    .update({ status: 'declined' })
    .eq('id', inviteId)
    .eq('student_id', currentUid());
  if (error) throw new Error(inviteError(error));
  return true;
}
