import AsyncStorage from '@react-native-async-storage/async-storage';
import { historyKey, trimHistory } from './coachCore';

// AI Coach chat history, saved on this phone per student (never uploaded).

export async function loadCoachHistory(uid) {
  try {
    const raw = await AsyncStorage.getItem(historyKey(uid));
    return trimHistory(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

export async function saveCoachHistory(uid, messages) {
  try {
    await AsyncStorage.setItem(historyKey(uid), JSON.stringify(trimHistory(messages)));
  } catch {
    /* storage full / private mode: chat still works, just not saved */
  }
}

export async function clearCoachHistory(uid) {
  try {
    await AsyncStorage.removeItem(historyKey(uid));
  } catch {
    /* nothing saved */
  }
}
