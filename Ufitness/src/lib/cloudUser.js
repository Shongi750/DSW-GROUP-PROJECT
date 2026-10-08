import { isSupabaseConfigured, supabase } from './supabase';
import { setupLooksComplete } from './profileStore';
import { normalizePrivacy } from './privacy';
import { beginCloudWrite, endCloudWrite, setSyncStatus } from './syncStatus';
import { isOfflineError } from './syncQueueCore';
import { queueWrite } from './syncQueue';
import { isOnline } from './autoSync';

function publicStudent(profile) {
  const privacy = normalizePrivacy(profile.privacy);
  return {
    name: profile.name || 'Student',
    campus: privacy.showCampus ? profile.campus || 'APK' : '',
    fitnessGoal: privacy.showGoal ? profile.fitnessGoal || 'General fitness' : '',
    experienceLevel: privacy.showExperience ? profile.experienceLevel || 'Beginner' : '',
    workoutLocation: profile.workoutPreference || 'Gym',
    yearOfStudy: profile.yearOfStudy || '',
    course: profile.course || '',
    gender: profile.gender || '',
    avatarUrl: profile.avatarUrl || '',
    discoverable: privacy.discoverable,
    appearAsMentor: privacy.appearAsMentor,
    shareProgressWithMentor: privacy.shareProgressWithMentor,
  };
}

function cloudPayload(uid, profile) {
  const privacy = normalizePrivacy(profile.privacy);
  return {
    userId: uid,
    ownerUid: uid,
    name: profile.name || '',
    email: profile.email || '',
    studentNumber: profile.studentNumber || '',
    fitnessGoal: profile.fitnessGoal || '',
    experienceLevel: profile.experienceLevel || '',
    workoutPreference: profile.workoutPreference || '',
    foodBudget: profile.foodBudget || '',
    foodBudgetAmount: Number(profile.foodBudgetAmount) || 1500,
    weeklyFoodBudget: Number(profile.weeklyFoodBudget) || 340,
    fundingType: profile.fundingType || '',
    campus: profile.campus || '',
    course: profile.course || '',
    courseFaculty: profile.courseFaculty || '',
    yearOfStudy: profile.yearOfStudy || '',
    gender: profile.gender || '',
    dietFilters: profile.dietFilters || {},
    daysPerWeek: Number(profile.daysPerWeek) || 4,
    avatarUrl: profile.avatarUrl || '',
    roles: Array.isArray(profile.roles) ? profile.roles : ['student'],
    privacy,
    onboardingComplete: setupLooksComplete(profile),
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchCloudUser(uid) {
  if (!isSupabaseConfigured || !supabase || !uid) return null;
  try {
    const { data, error } = await supabase.from('profiles').select('profile').eq('id', uid).maybeSingle();
    if (error || !data?.profile) return null;
    return data.profile;
  } catch {
    return null;
  }
}

export async function saveCloudUser(uid, profile) {
  if (!isSupabaseConfigured || !supabase) {
    setSyncStatus('local');
    return false;
  }
  if (!uid || !setupLooksComplete(profile)) return false;
  const payload = cloudPayload(uid, profile);
  const row = { id: uid, email: profile.email || '', profile: { ...payload, public: publicStudent(profile) } };

  // Offline: keep the latest profile in the sync queue; it goes up on reconnect.
  if (!isOnline()) {
    await queueWrite({ table: 'profiles', uid, row });
    setSyncStatus('offline');
    return false;
  }

  beginCloudWrite();
  try {
    const { error } = await supabase.from('profiles').upsert({ ...row, updated_at: new Date().toISOString() });
    if (error) throw error;
    endCloudWrite(null);
    return true;
  } catch (error) {
    if (isOfflineError(error)) await queueWrite({ table: 'profiles', uid, row });
    endCloudWrite(error);
    console.warn('Cloud profile save skipped', error?.message || error);
    return false;
  }
}

export async function deleteCloudUser(uid) {
  if (!isSupabaseConfigured || !supabase || !uid) return;
  try {
    await supabase.from('profiles').delete().eq('id', uid);
  } catch (error) {
    console.warn('Cloud profile delete skipped', error?.message || error);
  }
}

export function mergeCloudProfile(local, remote) {
  if (!remote || typeof remote !== 'object') return local;
  if (setupLooksComplete(local) && !setupLooksComplete(remote)) return local;
  if (!setupLooksComplete(local) && setupLooksComplete(remote)) {
    return { ...local, ...remote, onboardingComplete: true };
  }
  const next = { ...remote, ...local };
  Object.keys(remote).forEach((key) => {
    if (local[key] === '' || local[key] == null) next[key] = remote[key];
  });
  // Keep roles from both copies, so a mentor role saved online is not lost on a new phone.
  const roles = [...(Array.isArray(remote.roles) ? remote.roles : []), ...(Array.isArray(local.roles) ? local.roles : [])];
  if (roles.length) next.roles = [...new Set(roles)];
  next.onboardingComplete = setupLooksComplete(next);
  return next;
}
