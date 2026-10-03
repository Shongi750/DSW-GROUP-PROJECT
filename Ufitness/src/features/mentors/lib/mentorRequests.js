import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '../../../lib/supabase';
import { currentUid } from '../../../lib/cloudCache';

const KEY = 'ufitness.mentor.requests.v1';

function isUuid(value) {
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

async function readLocal() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocal(rows) {
  await AsyncStorage.setItem(KEY, JSON.stringify(rows));
}

async function cloudAvailable() {
  return Boolean(isSupabaseConfigured && supabase);
}

async function mergeLocal(row) {
  if (!row?.id) return;
  const rows = await readLocal();
  await writeLocal([row, ...rows.filter((item) => item.id !== row.id)]);
}

export async function listMentorRequests(studentId) {
  if ((await cloudAvailable()) && isUuid(studentId)) {
    try {
      const { data, error } = await supabase
        .from('mentor_requests')
        .select('*')
        .eq('student_id', studentId)
        .eq('status', 'pending');
      if (!error && data) return data.map(mapRow);
    } catch {
      /* fall through */
    }
  }
  const rows = await readLocal();
  return rows.filter((row) => row.studentId === studentId && row.status === 'pending');
}

export async function listRequestsForMentor(mentorId) {
  if ((await cloudAvailable()) && isUuid(mentorId)) {
    try {
      const { data, error } = await supabase
        .from('mentor_requests')
        .select('*')
        .eq('mentor_id', mentorId)
        .eq('status', 'pending');
      if (!error && data) return data.map(mapRow);
    } catch {
      /* fall through */
    }
  }
  const rows = await readLocal();
  return rows.filter((row) => row.mentorId === mentorId && row.status === 'pending');
}

export async function listActiveMentees(mentorId) {
  if ((await cloudAvailable()) && isUuid(mentorId)) {
    try {
      const { data, error } = await supabase
        .from('mentor_requests')
        .select('*')
        .eq('mentor_id', mentorId)
        .eq('status', 'active');
      if (!error && data) return data.map(mapRow);
    } catch {
      /* fall through */
    }
  }
  const rows = await readLocal();
  return rows.filter((row) => row.mentorId === mentorId && row.status === 'active');
}

export async function getMentorRequest(studentId, mentorId) {
  if ((await cloudAvailable()) && isUuid(studentId) && isUuid(mentorId)) {
    try {
      const { data, error } = await supabase
        .from('mentor_requests')
        .select('*')
        .eq('student_id', studentId)
        .eq('mentor_id', mentorId)
        .in('status', ['pending', 'active'])
        .maybeSingle();
      if (!error && data) return mapRow(data);
    } catch {
      /* fall through */
    }
  }
  const rows = await readLocal();
  return (
    rows.find(
      (row) =>
        row.studentId === studentId &&
        row.mentorId === mentorId &&
        (row.status === 'pending' || row.status === 'active')
    ) || null
  );
}

export async function sendMentorRequest({ studentId, studentName, mentor, studentCampus, studentGoal }) {
  const existing = await getMentorRequest(studentId, mentor.id);
  if (existing) return existing;

  if ((await cloudAvailable()) && isUuid(studentId) && isUuid(mentor.id)) {
    try {
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
        .maybeSingle();
      if (!error && data) {
        const mapped = mapRow(data);
        await mergeLocal(mapped);
        return mapped;
      }
    } catch {
      /* local fallback */
    }
  }

  const rows = await readLocal();
  const next = {
    id: `mentor-${mentor.id}-${Date.now()}`,
    studentId,
    studentName: studentName || 'Student',
    studentCampus: studentCampus || '',
    studentGoal: studentGoal || '',
    mentorId: mentor.id,
    mentorName: mentor.name,
    campus: mentor.campus,
    status: 'pending',
    guidance: [],
    createdAt: new Date().toISOString(),
  };
  await writeLocal([next, ...rows.filter((row) => !(row.studentId === studentId && row.mentorId === mentor.id))]);
  return next;
}

export async function respondToMentorRequest(requestId, status) {
  if ((await cloudAvailable()) && isUuid(requestId)) {
    try {
      const { data, error } = await supabase
        .from('mentor_requests')
        .update({ status, responded_at: new Date().toISOString() })
        .eq('id', requestId)
        .select('*')
        .maybeSingle();
      if (!error && data) {
        const mapped = mapRow(data);
        await mergeLocal(mapped);
        return mapped;
      }
    } catch {
      /* local */
    }
  }
  const rows = await readLocal();
  const next = rows.map((row) =>
    row.id === requestId ? { ...row, status, respondedAt: new Date().toISOString() } : row
  );
  await writeLocal(next);
  return next.find((row) => row.id === requestId) || null;
}

export async function addGuidanceNote(requestId, text, authorName) {
  const note = String(text || '').trim();
  if (!note) return null;
  const entry = {
    id: `g-${Date.now()}`,
    text: note,
    authorName: authorName || 'Mentor',
    createdAt: new Date().toISOString(),
  };

  if ((await cloudAvailable()) && isUuid(requestId)) {
    try {
      const { data: current } = await supabase
        .from('mentor_requests')
        .select('guidance')
        .eq('id', requestId)
        .maybeSingle();
      const guidance = [entry, ...(Array.isArray(current?.guidance) ? current.guidance : [])];
      const { data, error } = await supabase
        .from('mentor_requests')
        .update({ guidance })
        .eq('id', requestId)
        .select('*')
        .maybeSingle();
      if (!error && data) {
        const mapped = mapRow(data);
        await mergeLocal(mapped);
        return mapped;
      }
    } catch {
      /* local */
    }
  }

  const rows = await readLocal();
  let updated = null;
  const next = rows.map((row) => {
    if (row.id !== requestId) return row;
    updated = { ...row, guidance: [entry, ...(Array.isArray(row.guidance) ? row.guidance : [])] };
    return updated;
  });
  await writeLocal(next);
  return updated;
}

export async function withdrawMentorRequest(requestId) {
  if ((await cloudAvailable()) && isUuid(requestId)) {
    try {
      await supabase.from('mentor_requests').delete().eq('id', requestId);
    } catch {
      /* local */
    }
  }
  const rows = await readLocal();
  await writeLocal(rows.filter((row) => row.id !== requestId));
}

export async function clearMentorRequests() {
  await AsyncStorage.removeItem(KEY);
}

/** Local demo mentees so Mentor Hub isn't empty after unlocking the role. */
export async function seedDemoMentorship(mentorId, mentorName = 'Mentor') {
  if (!mentorId) return [];
  const rows = await readLocal();
  const active = rows.filter((row) => row.mentorId === mentorId && row.status === 'active');
  if (active.length) return active;

  const now = Date.now();
  const demos = [
    {
      id: `mentor-demo-a-${now}`,
      studentId: 'demo-student-lerato',
      studentName: 'Lerato Mokoena',
      studentCampus: 'APK',
      studentGoal: 'Build strength',
      mentorId,
      mentorName,
      campus: 'APK',
      status: 'active',
      guidance: [
        {
          id: `g-demo-${now}`,
          text: '3 campus sessions this week — keep it simple.',
          authorName: mentorName,
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date(now - 86400000).toISOString(),
      respondedAt: new Date().toISOString(),
    },
    {
      id: `mentor-demo-b-${now}`,
      studentId: 'demo-student-sipho',
      studentName: 'Sipho Dlamini',
      studentCampus: 'DFC',
      studentGoal: 'Lose fat',
      mentorId,
      mentorName,
      campus: 'DFC',
      status: 'pending',
      guidance: [],
      createdAt: new Date().toISOString(),
    },
  ];
  await writeLocal([...demos, ...rows]);
  return demos.filter((row) => row.status === 'active');
}

export function currentMentorUid() {
  return currentUid();
}
