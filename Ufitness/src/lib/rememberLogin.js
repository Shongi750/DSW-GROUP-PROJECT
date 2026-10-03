import AsyncStorage from '@react-native-async-storage/async-storage';
import { accountFromStudentOrEmail, studentNumberFromEmail } from './ujEmail';

const KEY = 'ufitness.auth.rememberEmail.v1';

function toStudentNumber(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  if (/^\d{9}$/.test(raw)) return raw;
  try {
    return accountFromStudentOrEmail(raw).studentNumber;
  } catch {
    return studentNumberFromEmail(raw);
  }
}

/** Persist 9-digit student number only (never full email). */
export async function rememberLoginEmail(value) {
  const number = toStudentNumber(value);
  if (!number) return;
  try {
    await AsyncStorage.setItem(KEY, number);
  } catch {
    /* quota */
  }
}

export async function forgetLoginEmail() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    /* quota */
  }
}

/** Returns remembered 9-digit student number (migrates older email values). */
export async function recallLoginEmail() {
  try {
    return toStudentNumber((await AsyncStorage.getItem(KEY)) || '');
  } catch {
    return '';
  }
}
