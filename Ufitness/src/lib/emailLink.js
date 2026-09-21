import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink, updatePassword } from 'firebase/auth';
import { normalizeStudentEmail } from './ujEmail';

export const PENDING_SIGNUP_KEY = 'ufitness.pendingSignup.v1';
export const EMAIL_FOR_LINK_KEY = 'ufitness.emailForLink.v1';

export function signupContinueUrl(email) {
  const safe = encodeURIComponent(normalizeStudentEmail(email));
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/?signup=1&email=${safe}`;
  }
  if (Platform.OS === 'web') {
    return `http://localhost:8090/?signup=1&email=${safe}`;
  }
  return Linking.createURL('/', { queryParams: { signup: '1', email: normalizeStudentEmail(email) } });
}

export function emailLinkActionSettings(email) {
  return {
    url: signupContinueUrl(email),
    handleCodeInApp: true,
  };
}

export async function sendAccountLink(auth, email) {
  const normalized = normalizeStudentEmail(email);
  await sendSignInLinkToEmail(auth, normalized, emailLinkActionSettings(normalized));
  await AsyncStorage.setItem(EMAIL_FOR_LINK_KEY, normalized);
}

export function currentHref() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.href || '';
  }
  return '';
}

export function emailFromHref(href) {
  try {
    const url = new URL(href);
    return normalizeStudentEmail(url.searchParams.get('email') || '');
  } catch {
    return '';
  }
}

export async function completeAccountLink(auth, href) {
  if (!href || !isSignInWithEmailLink(auth, href)) return null;
  const stored = await AsyncStorage.getItem(EMAIL_FOR_LINK_KEY);
  const email = emailFromHref(href) || stored;
  if (!email) {
    throw new Error('Open the link on this same browser, or enter your UJ student email again.');
  }
  const credential = await signInWithEmailLink(auth, email, href);
  await AsyncStorage.removeItem(EMAIL_FOR_LINK_KEY);
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  const pendingRaw = await AsyncStorage.getItem(PENDING_SIGNUP_KEY);
  const pending = pendingRaw ? JSON.parse(pendingRaw) : null;
  if (pending?.password && pending.password.length >= 6) {
    try {
      await updatePassword(credential.user, pending.password);
    } catch {}
  }
  return { user: credential.user, pending };
}

export async function readPendingSignup() {
  const raw = await AsyncStorage.getItem(PENDING_SIGNUP_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function writePendingSignup(payload) {
  await AsyncStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(payload));
}

export async function clearPendingSignup() {
  await AsyncStorage.removeItem(PENDING_SIGNUP_KEY);
  await AsyncStorage.removeItem(EMAIL_FOR_LINK_KEY);
}
