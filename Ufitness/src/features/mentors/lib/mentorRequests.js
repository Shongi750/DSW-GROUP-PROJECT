import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '../../../lib/supabase';
import { currentUid } from '../../../lib/cloudCache';
import { cloudErrorMessage } from '../../../lib/cloudErrors';

// Mentor requests live in the Supabase `mentor_requests` table.
// Student sends (pending) → mentor accepts (active) or declines (declined).
// AsyncStorage only keeps a read cache, so lists still show when the phone is offline.

const KEY = 'ufitness.mentor.requests.v1';

export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || '')
  );
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name || 'Student',
    studentCampus: row.student_campus || '',
    studentGoal: row.student_goal || '',
    mentorId: row.mentor_id,
    mentorName: row.mentor_name || 'Mentor',
    campus: row.campus || '',
    status: row.status,
    guidance: Array.isArray(row.guidance) ? row.guidance : [],
    createdAt: row.created_at,
    respondedAt: row.responded_at,
  };
}

// ---- local read cache ------------------------------------------------------

async function readCache() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function cacheRows(rows) {
  if (!rows.length) return;
  const old = await readCache();
  const ids = new Set(rows.map((row) => row.id));
  await AsyncStorage.setItem(KEY, JSON.stringify([...rows, ...old.filter((row) => !ids.has(row.id))]));
}

async function dropFromCache(id) {
  const old = await readCache();
  await AsyncStorage.setItem(KEY, JSON.stringify(old.filter((row) => row.id !== id)));
}

function cloudReady() {
  return Boolean(isSupabaseConfigured && supabase);
}

function needCloud() {
  if (!cloudReady()) {
    throw new Error('Mentor requests need the cloud. Sign in with your UJ account and try again.');
  }
}

/** Shared read: try Supabase, fall back to cached rows that match `keep`. */
async function listWhere(column, id, status, keep) {
  if (cloudReady() && isUuid(id)) {
    const { data, error } = await supabase
      .from('mentor_requests')
      .select('*')
      .eq(column, id)
      .eq('status', status)
      .order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      const rows = data.map(mapRow);
      await cacheRows(rows);
      return rows;
    }
  }
  const cached = await readCache();
  return cached.filter(keep);
}

// ---- reads -----------------------------------------------------------------

/** Pending requests this student has sent. */
export function listMentorRequests(studentId) {
  return listWhere('student_id', studentId, 'pending', (row) => row.studentId === studentId && row.status === 'pending');
}

/** Pending requests waiting for this mentor (the inbox). */
export function listRequestsForMentor(mentorId) {
  return listWhere('mentor_id', mentorId, 'pending', (row) => row.mentorId === mentorId && row.status === 'pending');
}

/** Students this mentor has accepted. */
export function listActiveMentees(mentorId) {
  return listWhere('mentor_id', mentorId, 'active', (row) => row.mentorId === mentorId && row.status === 'active');
}

export async function getMentorRequest(studentId, mentorId) {
  if (cloudReady() && isUuid(studentId) && isUuid(mentorId)) {
    const { data, error } = await supabase
      .from('mentor_requests')
      .select('*')
      .eq('student_id', studentId)
      .eq('mentor_id', mentorId)
      .in('status', ['pending', 'active'])
      .maybeSingle();
    if (!error) return mapRow(data);
  }
  const cached = await readCache();
  return (
    cached.find(
      (row) =>
        row.studentId === studentId &&
        row.mentorId === mentorId &&
        (row.status === 'pending' || row.status === 'active')
    ) || null
  );
}

// ---- writes (cloud only, errors are shown to the student) -------------------

export async function sendMentorRequest({ studentId, studentName, mentor, studentCampus, studentGoal }) {
  needCloud();
  if (!isUuid(studentId) || !isUuid(mentor?.id)) {
    throw new Error('Sign in with your UJ account to request a mentor.');
  }
  const existing = await getMentorRequest(studentId, mentor.id);
  if (existing) return existing;

  // A declined request blocks a new insert (unique student+mentor), so reopen it instead.
  const { data: old } = await supabase
    .from('mentor_requests')
    .select('id, status')
    .eq('student_id', studentId)
    .eq('mentor_id', mentor.id)
    .maybeSingle();
  if (old?.status === 'declined') {
    await supabase.from('mentor_requests').delete().eq('id', old.id);
  }

  const { data, error } = await supabase
    .from('mentor_requests')
    .insert({
      student_id: studentId,
      mentor_id: mentor.id,
      student_name: studentName || 'Student',
      student_campus: studentCampus || '',
      student_goal: studentGoal || '',
      mentor_name: mentor.name || 'Mentor',
      campus: mentor.campus || '',
      status: 'pending',
      guidance: [],
    })
    .select('*')
    .single();
  if (error) throw new Error(cloudErrorMessage(error));
  const mapped = mapRow(data);
  await cacheRows([mapped]);
  return mapped;
}

/** Mentor answers a request: status is 'active' (accept) or 'declined'. */
export async function respondToMentorRequest(requestId, status) {
  needCloud();
  if (status !== 'active' && status !== 'declined') throw new Error('Unknown request status.');
  const { data, error } = await supabase
    .from('mentor_requests')
    .update({ status, responded_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('status', 'pending')
    .select('*')
    .maybeSingle();
  if (error) throw new Error(cloudErrorMessage(error));
  if (!data) throw new Error('This request was already answered or withdrawn.');
  const mapped = mapRow(data);
  await cacheRows([mapped]);
  return mapped;
}

export async function addGuidanceNote(requestId, text, authorName) {
  const note = String(text || '').trim();
  if (!note) return null;
  needCloud();
  const entry = {
    id: `g-${Date.now()}`,
    text: note,
    authorName: authorName || 'Mentor',
    createdAt: new Date().toISOString(),
  };
  const { data: current, error: readError } = await supabase
    .from('mentor_requests')
    .select('guidance')
    .eq('id', requestId)
    .maybeSingle();
  if (readError) throw new Error(cloudErrorMessage(readError));
  const guidance = [entry, ...(Array.isArray(current?.guidance) ? current.guidance : [])];
  const { data, error } = await supabase
    .from('mentor_requests')
    .update({ guidance })
    .eq('id', requestId)
    .select('*')
    .maybeSingle();
  if (error) throw new Error(cloudErrorMessage(error));
  const mapped = mapRow(data);
  if (mapped) await cacheRows([mapped]);
  return mapped;
}

export async function withdrawMentorRequest(requestId) {
  if (cloudReady() && isUuid(requestId)) {
    const { error } = await supabase.from('mentor_requests').delete().eq('id', requestId);
    if (error) throw new Error(cloudErrorMessage(error));
  }
  await dropFromCache(requestId);
}

export async function clearMentorRequests() {
  await AsyncStorage.removeItem(KEY);
}

export function currentMentorUid() {
  return currentUid();
}
