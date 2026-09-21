import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ufitness.admin.v1';

const empty = {
  invites: [],
  decisions: [],
  roster: [],
};

async function read() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : empty;
    return {
      invites: Array.isArray(parsed.invites) ? parsed.invites : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      roster: Array.isArray(parsed.roster) ? parsed.roster : [],
    };
  } catch {
    return { ...empty };
  }
}

async function write(next) {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function loadAdminState() {
  return read();
}

export async function sendMentorInvite(student) {
  const state = await read();
  if (state.invites.some((row) => row.studentId === student.id && row.status === 'pending')) {
    return state;
  }
  const invite = {
    id: `invite-${student.id}-${Date.now()}`,
    studentId: student.id,
    studentName: student.name,
    campus: student.campus,
    reasons: student.reasons || [],
    message: student.inviteMessage,
    status: 'pending',
    sentAt: new Date().toISOString(),
  };
  return write({ ...state, invites: [invite, ...state.invites] });
}

export async function respondMentorInvite(inviteId, status, rosterEntry) {
  const state = await read();
  const invites = state.invites.map((row) => (row.id === inviteId ? { ...row, status } : row));
  const roster =
    status === 'accepted' && rosterEntry
      ? [rosterEntry, ...state.roster.filter((item) => item.id !== rosterEntry.id)]
      : state.roster;
  return write({ ...state, invites, roster });
}

export async function addDecision(text) {
  const state = await read();
  const item = {
    id: `dec-${Date.now()}`,
    text: text.trim(),
    done: false,
    createdAt: new Date().toISOString(),
  };
  return write({ ...state, decisions: [item, ...state.decisions] });
}

export async function toggleDecision(id) {
  const state = await read();
  return write({
    ...state,
    decisions: state.decisions.map((row) => (row.id === id ? { ...row, done: !row.done } : row)),
  });
}

export async function loadMentorRoster() {
  const state = await read();
  return state.roster;
}

export function inviteForStudent(invites, profile) {
  const id = profile?.userId || profile?.email;
  const name = (profile?.name || '').trim().toLowerCase();
  return (
    (invites || []).find(
      (row) =>
        row.status === 'pending' &&
        (row.studentId === id || row.studentId === 'live-student' || (name && row.studentName.trim().toLowerCase() === name))
    ) || null
  );
}
