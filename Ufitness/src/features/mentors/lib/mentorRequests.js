import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ufitness.mentor.requests.v1';

async function readAll() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(rows) {
  await AsyncStorage.setItem(KEY, JSON.stringify(rows));
}

export async function listMentorRequests(studentId) {
  const rows = await readAll();
  return rows.filter((row) => row.studentId === studentId && row.status === 'pending');
}

export async function getMentorRequest(studentId, mentorId) {
  const rows = await readAll();
  return rows.find((row) => row.studentId === studentId && row.mentorId === mentorId && row.status === 'pending') || null;
}

export async function sendMentorRequest({ studentId, studentName, mentor }) {
  const existing = await getMentorRequest(studentId, mentor.id);
  if (existing) return existing;
  const rows = await readAll();
  const next = {
    id: `mentor-${mentor.id}-${Date.now()}`,
    studentId,
    studentName: studentName || 'Student',
    mentorId: mentor.id,
    mentorName: mentor.name,
    campus: mentor.campus,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  await writeAll([next, ...rows.filter((row) => !(row.studentId === studentId && row.mentorId === mentor.id))]);
  return next;
}

export async function withdrawMentorRequest(requestId) {
  const rows = await readAll();
  await writeAll(rows.filter((row) => row.id !== requestId));
}

export async function clearMentorRequests() {
  await AsyncStorage.removeItem(KEY);
}
