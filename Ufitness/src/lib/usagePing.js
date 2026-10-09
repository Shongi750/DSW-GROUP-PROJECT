import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from './supabase';
import { dayKey } from '../features/admin/lib/usageMath';

// Light usage events for the Campus Admin dashboard (Supabase `usage_events`).
// We send at most one row per event per day from this phone, and only the event
// name — no screen content, no location.

const SENT_KEY = 'ufitness.usage.sent.v1';

// Tab / screen name → event name stored in the table
export const FEATURE_EVENTS = {
  Meals: 'meals',
  Workout: 'workout',
  Community: 'community',
  Mentors: 'mentors',
  AiCoach: 'ai_coach',
};

async function recordOncePerDay(event) {
  if (!isSupabaseConfigured || !supabase || !event) return false;
  const today = dayKey(new Date());
  let sent = {};
  try {
    sent = JSON.parse((await AsyncStorage.getItem(SENT_KEY)) || '{}') || {};
  } catch {
    sent = {};
  }
  if (sent[event] === today) return false;
  try {
    // user_id defaults to auth.uid() in the table, so RLS checks it is really us
    const { error } = await supabase.from('usage_events').insert({ event });
    if (error) return false;
    sent[event] = today;
    await AsyncStorage.setItem(SENT_KEY, JSON.stringify(sent));
    return true;
  } catch {
    return false;
  }
}

/** "This student opened the app today" — called after sign-in / session restore. */
export function pingDailyUsage() {
  return recordOncePerDay('app_open');
}

/** Record that a feature (tab) was used today. Unknown names are ignored. */
export function trackFeature(name) {
  return recordOncePerDay(FEATURE_EVENTS[name]);
}
