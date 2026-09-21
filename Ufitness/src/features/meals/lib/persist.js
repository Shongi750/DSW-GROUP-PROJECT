import AsyncStorage from '@react-native-async-storage/async-storage';
import { cloudSafeMeals, currentUid, fetchCloudDoc, saveCloudDoc } from '../../../lib/cloudCache';

const KEY = 'ufitness.meals.plan.v1';

export async function loadSavedPlan() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    }
    const uid = currentUid();
    if (!uid) return null;
    const remote = await fetchCloudDoc('mealPlans', uid);
    if (remote && typeof remote === 'object') {
      const { ownerUid, updatedAt, ...plan } = remote;
      if (Object.keys(plan).length) {
        await AsyncStorage.setItem(KEY, JSON.stringify(plan));
        return plan;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveSavedPlan(state) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
    const uid = currentUid();
    if (uid) saveCloudDoc('mealPlans', uid, cloudSafeMeals(state));
  } catch {
    /* quota / private mode */
  }
}
