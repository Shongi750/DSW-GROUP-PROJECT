import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb } from './firebase';
import { sessionStreak } from '../data/progress';

export { mergeProfiles, resolveProfileForUser } from './profileMerge';

const COLLECTION = 'profiles';

export async function fetchRemoteProfile(uid) {
  const db = getDb();
  if (!db || !uid) return null;
  const snapshot = await getDoc(doc(db, COLLECTION, uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function saveRemoteProfile(uid, profile) {
  const db = getDb();
  if (!db || !uid) return false;
  const history = profile.history || [];
  await setDoc(doc(db, COLLECTION, uid), { ...profile, ownerUid: uid }, { merge: true });
  await setDoc(
    doc(db, 'students', uid),
    {
      sessions: history.length,
      streak: sessionStreak(history),
      minutes: history.reduce((sum, item) => sum + Number(item.minutes || 0), 0),
      completedMoves: (profile.completedExerciseIds || []).length,
    },
    { merge: true }
  );
  return true;
}
