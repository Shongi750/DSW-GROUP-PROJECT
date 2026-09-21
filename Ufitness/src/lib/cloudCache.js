import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb, getFirebaseAuth } from './firebase';

export function currentUid() {
  return getFirebaseAuth()?.currentUser?.uid || null;
}

function jsonSafe(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

function safeUri(value) {
  if (typeof value === 'string' && /^https?:\/\//i.test(value)) return value;
  if (value?.uri && /^https?:\/\//i.test(value.uri)) return value.uri;
  return '';
}

export function cloudSafeMeals(state) {
  return jsonSafe(state) || {};
}

export function cloudSafeCommunity(state) {
  return {
    posts: (state?.posts || []).slice(0, 40).map((post) => ({
      id: post.id,
      author: post.author || '',
      text: post.text || '',
      likes: Number(post.likes) || 0,
      comments: (post.comments || []).slice(0, 20).map((item) => ({
        id: item.id,
        author: item.author || '',
        text: item.text || '',
      })),
      isCheckIn: Boolean(post.isCheckIn),
      campus: post.campus || '',
      imageUri: safeUri(post.imageUri),
      workoutStats: post.workoutStats || null,
      recipe: post.recipe || null,
      workoutClip: post.workoutClip
        ? {
            title: post.workoutClip.title || '',
            musicTitle: post.workoutClip.musicTitle || '',
            musicArtist: post.workoutClip.musicArtist || '',
            videoUri: safeUri(post.workoutClip.videoUri),
          }
        : null,
    })),
    gymStatuses: state?.gymStatuses || {},
    groups: (state?.groups || []).map((group) => ({
      id: group.id,
      name: group.name || '',
      campus: group.campus || '',
      status: group.status || 'none',
      about: group.about || '',
      nextSession: group.nextSession || '',
    })),
  };
}

export async function fetchCloudDoc(collection, uid) {
  const db = getDb();
  if (!db || !uid) return null;
  try {
    const snap = await getDoc(doc(db, collection, uid));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

export async function saveCloudDoc(collection, uid, payload) {
  const db = getDb();
  if (!db || !uid || !payload) return false;
  try {
    await setDoc(doc(db, collection, uid), { ...payload, ownerUid: uid, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (error) {
    console.warn(`Cloud ${collection} save skipped`, error?.message || error);
    return false;
  }
}

export async function deleteCloudCaches(uid) {
  const db = getDb();
  if (!db || !uid) return;
  await Promise.allSettled([
    deleteDoc(doc(db, 'mealPlans', uid)),
    deleteDoc(doc(db, 'communityState', uid)),
    deleteDoc(doc(db, 'reminders', uid)),
  ]);
}
