import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PENDING_SIGNUP_KEY = 'ufitness.pendingSignup.v1';
export const EMAIL_FOR_LINK_KEY = 'ufitness.emailForLink.v1';

export function currentHref() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.href || '';
  }
  return '';
}

export async function clearPendingSignup() {
  await AsyncStorage.removeItem(PENDING_SIGNUP_KEY);
  await AsyncStorage.removeItem(EMAIL_FOR_LINK_KEY);
}
