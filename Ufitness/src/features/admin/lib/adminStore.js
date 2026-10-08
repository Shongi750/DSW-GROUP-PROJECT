import AsyncStorage from '@react-native-async-storage/async-storage';

// Campus Admin decision log (notes to self), kept on this device.
// Mentor invites moved to the Supabase `mentor_invites` table
// (see src/features/mentors/lib/mentorInvites.js).

const KEY = 'ufitness.admin.v1';

async function read() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
    };
  } catch {
    return { decisions: [] };
  }
}

async function write(next) {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function loadAdminState() {
  return read();
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
