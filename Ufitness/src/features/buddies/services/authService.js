// services/authService.js
//
// Firebase Authentication (email/password) service. Sign-up also creates
// the matching `students` Firestore profile document (same id as the auth
// user's uid), so buddyService.js can look the profile up immediately.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { requireAuth, requireDb } from '../../../lib/firebase';

export async function signUp(email, password, profileData) {
  const auth = requireAuth();
  const db = requireDb();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  // Keep the display name on the auth user too, handy for greetings etc.
  await updateProfile(credential.user, { displayName: profileData.name });

  // Create the matching student profile doc that buddyService.js reads from.
  await setDoc(doc(db, 'students', uid), profileData);

  return { uid, ...profileData };
}

export async function logIn(email, password) {
  const credential = await signInWithEmailAndPassword(requireAuth(), email, password);
  return credential.user;
}

export async function logOut() {
  await signOut(requireAuth());
}

export function subscribeToAuthChanges(onChange) {
  return onAuthStateChanged(requireAuth(), onChange);
}
