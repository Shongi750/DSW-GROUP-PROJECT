import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchCloudDoc, saveCloudDoc } from '../../../lib/cloudCache';

function storageKey(uid) {
  return `ufitness.eaten.v1.${uid || 'device'}`;
}

function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function summarize(items) {
  return {
    items,
    kcal: items.reduce((sum, item) => sum + Number(item.kcal || 0), 0),
    protein: items.reduce((sum, item) => sum + Number(item.protein || 0), 0),
    carbs: items.reduce((sum, item) => sum + Number(item.carbs || 0), 0),
  };
}

async function readAll(uid) {
  try {
    const raw = await AsyncStorage.getItem(storageKey(uid));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function loadEatenToday(uid) {
  const all = await readAll(uid);
  const localItems = Array.isArray(all[todayKey()]) ? all[todayKey()] : [];
  if (!localItems.length && uid) {
    const remote = await fetchCloudDoc('eaten', uid);
    if (remote && typeof remote === 'object') {
      await AsyncStorage.setItem(storageKey(uid), JSON.stringify(remote));
      const remoteItems = Array.isArray(remote[todayKey()]) ? remote[todayKey()] : [];
      return summarize(remoteItems);
    }
  }
  return summarize(localItems);
}

export async function logEatenMeal(uid, meal) {
  const all = await readAll(uid);
  const day = todayKey();
  const items = Array.isArray(all[day]) ? all[day] : [];
  if (meal?.id && items.some((item) => item.id === meal.id)) return summarize(items);
  const next = [
    ...items,
    {
      id: meal?.id || `${Date.now()}`,
      title: meal?.title || 'Meal',
      kcal: Number(meal?.kcal) || 0,
      protein: Number(meal?.protein) || 0,
      carbs: Number(meal?.carbs) || 0,
      at: Date.now(),
    },
  ];
  all[day] = next;
  await AsyncStorage.setItem(storageKey(uid), JSON.stringify(all));
  if (uid) saveCloudDoc('eaten', uid, all);
  return summarize(next);
}
