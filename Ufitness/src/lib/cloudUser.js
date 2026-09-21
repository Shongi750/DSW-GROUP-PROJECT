import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { deleteCloudCaches } from './cloudCache';
import { getDb } from './firebase';
import { setupLooksComplete } from './profileStore';

const USERS = 'users';
const STUDENTS = 'students';

function publicStudent(profile) {
  return {
    name: profile.name || 'Student',
    campus: profile.campus || 'APK',
    fitnessGoal: profile.fitnessGoal || 'General fitness',
    experienceLevel: profile.experienceLevel || 'Beginner',
    workoutLocation: profile.workoutPreference || 'Gym',
    yearOfStudy: profile.yearOfStudy || '',
    course: profile.course || '',
    gender: profile.gender || '',
    avatarUrl: profile.avatarUrl || '',
  };
}

function cloudPayload(uid, profile) {
  return {
    userId: uid,
    ownerUid: uid,
    name: profile.name || '',
    email: profile.email || '',
    studentNumber: profile.studentNumber || '',
    fitnessGoal: profile.fitnessGoal || '',
    experienceLevel: profile.experienceLevel || '',
    workoutPreference: profile.workoutPreference || '',
    foodBudget: profile.foodBudget || '',
    foodBudgetAmount: Number(profile.foodBudgetAmount) || 1500,
    weeklyFoodBudget: Number(profile.weeklyFoodBudget) || 340,
    fundingType: profile.fundingType || '',
    campus: profile.campus || '',
    course: profile.course || '',
    courseFaculty: profile.courseFaculty || '',
    yearOfStudy: profile.yearOfStudy || '',
    gender: profile.gender || '',
    dietFilters: profile.dietFilters || {},
    daysPerWeek: Number(profile.daysPerWeek) || 4,
    avatarUrl: profile.avatarUrl || '',
    onboardingComplete: setupLooksComplete(profile),
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchCloudUser(uid) {
  const db = getDb();
  if (!db || !uid) return null;
  try {
    const snap = await getDoc(doc(db, USERS, uid));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

export async function saveCloudUser(uid, profile) {
  const db = getDb();
  if (!db || !uid || !setupLooksComplete(profile)) return false;
  const payload = cloudPayload(uid, profile);
  try {
    await Promise.all([
      setDoc(doc(db, USERS, uid), payload, { merge: true }),
      setDoc(doc(db, STUDENTS, uid), publicStudent(profile), { merge: true }),
    ]);
    return true;
  } catch (error) {
    console.warn('Cloud profile save skipped', error?.message || error);
    return false;
  }
}

export async function deleteCloudUser(uid) {
  const db = getDb();
  if (!db || !uid) return;
  await Promise.allSettled([
    deleteDoc(doc(db, USERS, uid)),
    deleteDoc(doc(db, STUDENTS, uid)),
    deleteDoc(doc(db, 'profiles', uid)),
    deleteCloudCaches(uid),
  ]);
}

export function mergeCloudProfile(local, remote) {
  if (!remote || typeof remote !== 'object') return local;
  if (setupLooksComplete(local) && !setupLooksComplete(remote)) return local;
  if (!setupLooksComplete(local) && setupLooksComplete(remote)) {
    return { ...local, ...remote, onboardingComplete: true };
  }
  const next = { ...remote, ...local };
  Object.keys(remote).forEach((key) => {
    if (local[key] === '' || local[key] == null) next[key] = remote[key];
  });
  next.onboardingComplete = setupLooksComplete(next);
  return next;
}
