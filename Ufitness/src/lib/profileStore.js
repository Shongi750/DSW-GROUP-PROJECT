import AsyncStorage from '@react-native-async-storage/async-storage';

export const PROFILES_KEY = 'ufitness.profiles.v1';

async function readStore() {
  try {
    const raw = await AsyncStorage.getItem(PROFILES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function aliases(user, profile) {
  return [
    user?.id,
    profile?.userId,
    String(user?.email || '').toLowerCase(),
    String(profile?.email || '').toLowerCase(),
  ].filter((key) => key && key !== 'undefined');
}

export function setupLooksComplete(profile) {
  if (!profile) return false;
  if (profile.onboardingComplete) return true;
  return Boolean(profile.name && profile.campus && profile.fitnessGoal && profile.yearOfStudy);
}

export async function rememberProfile(user, profile) {
  const keys = aliases(user, profile);
  if (!keys.length || !profile) return;
  const store = await readStore();
  keys.forEach((key) => {
    store[key] = profile;
  });
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(store));
}

export async function recallProfile({ uid, email }) {
  const store = await readStore();
  const emailKey = String(email || '').toLowerCase();
  return store[uid] || store[emailKey] || null;
}

export async function forgetProfile(user, profile) {
  const store = await readStore();
  aliases(user, profile).forEach((key) => {
    delete store[key];
  });
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(store));
}
