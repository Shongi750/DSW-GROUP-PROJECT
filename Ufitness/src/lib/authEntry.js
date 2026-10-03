import AsyncStorage from '@react-native-async-storage/async-storage';
import { PROFILES_KEY } from './profileStore';

const KEY = 'ufitness.auth.showLogin.v1';

async function hasRememberedAccount() {
  try {
    const raw = await AsyncStorage.getItem(PROFILES_KEY);
    const store = raw ? JSON.parse(raw) : {};
    return Boolean(store && typeof store === 'object' && Object.keys(store).length);
  } catch {
    return false;
  }
}

export async function markSignedOut() {
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {
    /* quota */
  }
}

export async function preferSignUp() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    /* quota */
  }
}

export async function authStartScreen() {
  try {
    //
    const raw = await AsyncStorage.getItem(KEY);
    if (raw === '1') return 'Login';
    if (await hasRememberedAccount()) return 'Login';
    return 'Register';
  } catch {
    return 'Register';
  }
}
