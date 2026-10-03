import { isSupabaseConfigured, supabase } from '../../../lib/supabase';
import { currentUid } from '../../../lib/cloudCache';
import { listStudents } from '../../../lib/students';

function score(me, other) {
  const reasons = [];
  let scoreValue = 40;
  if (me?.campus && other.campus && me.campus === other.campus) {
    scoreValue += 30;
    reasons.push(`Same campus (${other.campus})`);
  }
  if (me?.fitnessGoal && other.fitnessGoal && me.fitnessGoal === other.fitnessGoal) {
    scoreValue += 20;
    reasons.push(`Same goal (${other.fitnessGoal})`);
  }
  if (me?.workoutLocation && other.workoutLocation && me.workoutLocation === other.workoutLocation) {
    scoreValue += 10;
    reasons.push(other.workoutLocation);
  }
  if (!reasons.length) reasons.push('Another UJ student on UFitness');
  return { matchScore: Math.min(99, scoreValue), matchReasons: reasons };
}

export async function findPotentialBuddies(currentStudent) {
  const students = await listStudents();
  return students
    .filter((student) => student.id && student.id !== currentStudent?.id)
    .map((student) => ({ student, ...score(currentStudent, student) }));
}

export async function sendBuddyRequest(fromId, toId) {
  if (!isSupabaseConfigured || !supabase || !fromId || !toId || fromId === toId) return null;
  // from_name + status=pending are enforced/derived server-side.
  const { data, error } = await supabase
    .from('buddy_requests')
    .insert({ from_id: fromId, to_id: toId, status: 'pending' })
    .select('id')
    .maybeSingle();
  if (error) {
    // Already requested — treat as success for UX.
    if (String(error.code) === '23505') return { id: 'existing' };
    return null;
  }
  return data;
}

export async function respondToBuddyRequest(requestId, decision) {
  if (!supabase || !requestId) return;
  const status = decision === 'accepted' ? 'accepted' : 'rejected';
  const { error } = await supabase.from('buddy_requests').update({ status }).eq('id', requestId);
  if (error) throw error;
}

export async function getIncomingRequests(studentId) {
  if (!supabase || !studentId) return [];
  const { data, error } = await supabase
    .from('buddy_requests')
    .select('id, from_id, from_name, status')
    .eq('to_id', studentId)
    .eq('status', 'pending');
  if (error || !data) return [];
  const directory = await listStudents();
  return data.map((row) => {
    const sender = directory.find((student) => student.id === row.from_id);
    return {
      id: row.id,
      fromStudentId: row.from_id,
      fromName: sender?.name || row.from_name || 'Student',
      sender: sender || {
        id: row.from_id,
        name: row.from_name || 'Student',
        campus: '',
        fitnessGoal: '',
        experienceLevel: '',
      },
    };
  });
}

export function subscribeToIncomingRequests(_studentId, onUpdate) {
  getIncomingRequests(_studentId).then(onUpdate).catch(() => onUpdate([]));
  return () => {};
}

export async function getMatchedBuddies(studentId) {
  if (!supabase || !studentId) return [];
  const { data, error } = await supabase
    .from('buddy_requests')
    .select('id, from_id, to_id, status')
    .eq('status', 'accepted')
    .or(`from_id.eq.${studentId},to_id.eq.${studentId}`);
  if (error || !data) return [];
  const directory = await listStudents();
  return data
    .map((row) => {
      const otherId = row.from_id === studentId ? row.to_id : row.from_id;
      const student = directory.find((item) => item.id === otherId);
      if (!student) return null;
      return { ...student, requestId: row.id };
    })
    .filter(Boolean);
}

export async function unfriendBuddy(requestId) {
  if (!supabase || !requestId) return;
  const { error } = await supabase.from('buddy_requests').update({ status: 'ended' }).eq('id', requestId);
  if (error) throw error;
}

export async function getStudentById(id) {
  const students = await listStudents();
  return students.find((student) => student.id === id);
}

export function currentBuddyUid() {
  return currentUid();
}
