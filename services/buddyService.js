// services/buddyService.js
//
// Firestore-backed service layer for the Workout Buddy System.
//
// Firestore collections used:
//   students       - doc id = studentId (== Firebase Auth uid)
//                     { name, campus, fitnessGoal, experienceLevel,
//                       preferredSchedule: string[], workoutLocation }
//   buddyRequests  - auto id
//                     { fromStudentId, toStudentId, status: 'pending'|'accepted'|'rejected',
//                       createdAt: serverTimestamp }

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const studentsRef = collection(db, 'students');
const requestsRef = collection(db, 'buddyRequests');

// --- FR-31 / FR-32: find + recommend potential buddies ---------------------
export async function findPotentialBuddies(currentStudent) {
  const snapshot = await getDocs(studentsRef);

  const matches = snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((s) => s.id !== currentStudent.id)
    .map((candidate) => {
      let score = 0;
      const reasons = [];

      if (candidate.campus === currentStudent.campus) {
        score += 30;
        reasons.push(`Same campus (${candidate.campus})`);
      }
      if (candidate.fitnessGoal === currentStudent.fitnessGoal) {
        score += 30;
        reasons.push(`Same goal: ${candidate.fitnessGoal}`);
      }
      if (candidate.experienceLevel === currentStudent.experienceLevel) {
        score += 20;
        reasons.push(`Same level: ${candidate.experienceLevel}`);
      }
      const sharedDays = overlappingDays(candidate.preferredSchedule || [], currentStudent.preferredSchedule || []);
      if (sharedDays.length > 0) {
        score += Math.min(20, sharedDays.length * 5);
        reasons.push(`Free ${sharedDays.join(', ')} together`);
      }

      return { student: candidate, matchScore: score, matchReasons: reasons };
    });

  return matches.filter((m) => m.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore);
}

function overlappingDays(a, b) {
  return a.filter((day) => b.includes(day));
}

// --- FR-33: send a buddy request -------------------------------------------
export async function sendBuddyRequest(fromStudentId, toStudentId) {
  const existingQuery = query(
    requestsRef,
    where('fromStudentId', '==', fromStudentId),
    where('toStudentId', '==', toStudentId),
    where('status', '==', 'pending')
  );
  const existingSnap = await getDocs(existingQuery);
  if (!existingSnap.empty) {
    const d = existingSnap.docs[0];
    return { id: d.id, ...d.data() };
  }

  const docRef = await addDoc(requestsRef, {
    fromStudentId,
    toStudentId,
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id, fromStudentId, toStudentId, status: 'pending' };
}

// --- FR-34: accept or reject a buddy request --------------------------------
export async function respondToBuddyRequest(requestId, response) {
  const requestDoc = doc(db, 'buddyRequests', requestId);
  await updateDoc(requestDoc, { status: response });
  const updatedSnap = await getDoc(requestDoc);
  return updatedSnap.exists() ? { id: updatedSnap.id, ...updatedSnap.data() } : undefined;
}

// --- Helpers for screens -----------------------------------------------------

export async function getIncomingRequests(studentId) {
  const q = query(requestsRef, where('toStudentId', '==', studentId), where('status', '==', 'pending'));
  const snap = await getDocs(q);
  const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const withSenders = await Promise.all(
    requests.map(async (request) => {
      const sender = await getStudentById(request.fromStudentId);
      return sender ? { request, sender } : null;
    })
  );
  return withSenders.filter((item) => item !== null);
}

// Real-time version: calls onUpdate(items) whenever incoming requests change.
// Returns an unsubscribe function - call it in your screen's useEffect cleanup.
export function subscribeToIncomingRequests(studentId, onUpdate) {
  const q = query(requestsRef, where('toStudentId', '==', studentId), where('status', '==', 'pending'));

  return onSnapshot(q, async (snap) => {
    const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const withSenders = await Promise.all(
      requests.map(async (request) => {
        const sender = await getStudentById(request.fromStudentId);
        return sender ? { request, sender } : null;
      })
    );
    onUpdate(withSenders.filter((item) => item !== null));
  });
}

// Firestore doesn't support a single OR query across two different fields
// on older SDK setups, so we run two queries (as sender / as recipient)
// and merge.
export async function getMatchedBuddies(studentId) {
  const sentQuery = query(requestsRef, where('fromStudentId', '==', studentId), where('status', '==', 'accepted'));
  const receivedQuery = query(requestsRef, where('toStudentId', '==', studentId), where('status', '==', 'accepted'));

  const [sentSnap, receivedSnap] = await Promise.all([getDocs(sentQuery), getDocs(receivedQuery)]);

  const buddyIds = [
    ...sentSnap.docs.map((d) => d.data().toStudentId),
    ...receivedSnap.docs.map((d) => d.data().fromStudentId),
  ];

  const buddies = await Promise.all(buddyIds.map((id) => getStudentById(id)));
  return buddies.filter((b) => b !== undefined);
}

export async function getStudentById(id) {
  const snap = await getDoc(doc(db, 'students', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : undefined;
}
