import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CAMPUS_GYMS, nearestGym, gymForCampus } from './campusGyms';

const STORAGE_KEY = 'ufitness.gym.checkins.v1';

// Check-ins from the last hour count toward "busy"
const FRESH_MS = 60 * 60 * 1000;

async function readAll() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    return [];
  }
}

async function writeAll(list) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    // ignore
  }
}

// Drop old check-ins so the list stays small
function keepFresh(list, now) {
  const out = [];
  let i = 0;
  while (i < list.length) {
    const item = list[i];
    if (item && item.at && now - item.at < FRESH_MS * 6) {
      out.push(item);
    }
    i = i + 1;
  }
  return out;
}

export async function listFreshCheckIns(now) {
  if (!now) now = Date.now();
  const all = await readAll();
  const fresh = [];
  let i = 0;
  while (i < all.length) {
    const item = all[i];
    if (item && item.at && now - item.at < FRESH_MS) {
      fresh.push(item);
    }
    i = i + 1;
  }
  return fresh;
}

// How many fresh check-ins per gym id
export async function checkInCounts(now) {
  const fresh = await listFreshCheckIns(now);
  const counts = {};
  let i = 0;
  while (i < CAMPUS_GYMS.length) {
    counts[CAMPUS_GYMS[i].id] = 0;
    i = i + 1;
  }
  i = 0;
  while (i < fresh.length) {
    const id = fresh[i].gymId;
    if (counts[id] == null) counts[id] = 0;
    counts[id] = counts[id] + 1;
    i = i + 1;
  }
  return counts;
}

export async function saveCheckIn(gymId, source) {
  const now = Date.now();
  let list = keepFresh(await readAll(), now);
  list.push({
    gymId: gymId,
    at: now,
    source: source || 'gps',
  });
  await writeAll(list);
  return { gymId: gymId, at: now };
}

// Try GPS once. On web / denied → use campusPreference manual gym.
export async function tryGymCheckIn(options) {
  const campusPreference = (options && options.campusPreference) || '';
  const allowManual = options && options.allowManual !== false;

  // --- GPS path (phones) ---
  if (Platform.OS !== 'web') {
    try {
      const Location = require('expo-location');
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission && permission.status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const hit = nearestGym(lat, lng);
        if (hit) {
          await saveCheckIn(hit.gym.id, 'gps');
          return {
            ok: true,
            gym: hit.gym,
            metres: hit.metres,
            source: 'gps',
            message: 'Checked in at ' + hit.gym.name + ' (~' + hit.metres + ' m away).',
          };
        }
        // GPS worked but not near a pin
        if (!allowManual) {
          return {
            ok: false,
            message: 'You are not near a UJ campus gym right now.',
          };
        }
      }
    } catch (e) {
      // fall through to manual
    }
  }

  // --- Manual fallback (web / no permission / not near) ---
  if (!allowManual) {
    return { ok: false, message: 'Location permission is needed to check in.' };
  }

  const gym = gymForCampus(campusPreference);
  await saveCheckIn(gym.id, 'manual');
  return {
    ok: true,
    gym: gym,
    metres: null,
    source: 'manual',
    message: 'Checked in at ' + gym.name + ' (campus preference).',
  };
}
