import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import {
  biometricLabel,
  canUseBiometrics,
  disableUnlock,
  enableUnlock,
  isUnlockEnabled,
} from './biometrics';
import { currentUid, fetchCloudDoc, saveCloudDoc } from './cloudCache';
import { getLocalNotifications } from './notifications/localNotifications';
import {
  allReminderIds,
  buildSchedule,
  CHANNEL_ID,
  normalizeReminders,
  reminderSummary,
  TRIGGER,
} from './notifications/reminderSchedule';

// Reminders = local notifications scheduled on this phone (works in Expo Go and the APK).
// Settings screen: Profile → Notifications (src/screens/profile/NotificationsScreen.js).
// Rules for what gets scheduled: ./notifications/reminderSchedule.js. Push: NOTIFICATIONS.md.

const KEY = 'ufitness.reminders.v1';

export { reminderSummary };

export function notificationsAvailable() {
  return Boolean(getLocalNotifications());
}

function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function ensureChannel() {
  const N = getLocalNotifications();
  if (!N || Platform.OS !== 'android') return;
  await N.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Reminders',
    description: 'Workout, meal and grocery reminders',
    importance: N.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 150, 250],
    lightColor: '#FF6A00',
  });
}

/** 'granted' | 'denied' | 'undetermined' | 'unavailable' (no permission prompt). */
export async function notificationPermission() {
  const N = getLocalNotifications();
  if (!N) return 'unavailable';
  try {
    const current = await N.getPermissionsAsync();
    if (current.granted) return 'granted';
    return current.canAskAgain === false ? 'denied' : current.status || 'undetermined';
  } catch {
    return 'unavailable';
  }
}

/** Ask for permission (Android 13+ shows the system prompt once). */
export async function ensurePermission() {
  const N = getLocalNotifications();
  if (!N) return false;
  try {
    // Android 13+: a channel must exist before the permission prompt shows.
    await ensureChannel();
    const current = await N.getPermissionsAsync();
    if (current.granted) return true;
    const next = await N.requestPermissionsAsync();
    return Boolean(next.granted);
  } catch {
    return false;
  }
}

// Runs one sync at a time (quick taps on the time buttons used to overlap).
let syncChain = Promise.resolve(0);

/** Cancel every UFitness reminder, then schedule exactly what the settings say. */
export function syncScheduledReminders(state) {
  const run = syncChain.then(() => syncNow(state), () => syncNow(state));
  syncChain = run.catch(() => 0);
  return run;
}

async function syncNow(state) {
  const N = getLocalNotifications();
  if (!N) return 0;
  await Promise.all(allReminderIds().map((id) => N.cancelScheduledNotificationAsync(id).catch(() => {})));
  const items = buildSchedule(state);
  if (!items.length) return 0;
  const perm = await N.getPermissionsAsync().catch(() => ({ granted: false }));
  if (!perm.granted) return 0;
  await ensureChannel().catch(() => {});
  let scheduled = 0;
  for (const item of items) {
    try {
      await N.scheduleNotificationAsync(item);
      scheduled += 1;
    } catch (error) {
      if (__DEV__) console.warn('[reminders] could not schedule', item.identifier, error?.message);
    }
  }
  return scheduled;
}

/** How many reminders the phone has queued (for the settings screen). */
export async function scheduledReminderCount() {
  const N = getLocalNotifications();
  if (!N) return 0;
  try {
    const ours = new Set(allReminderIds());
    const all = await N.getAllScheduledNotificationsAsync();
    return (all || []).filter((item) => ours.has(item?.identifier)).length;
  } catch {
    return 0;
  }
}

export async function scheduleTestReminder(seconds = 5) {
  const N = getLocalNotifications();
  if (!N) {
    Alert.alert('Not available here', 'This phone can’t show UFitness notifications from this app.');
    return false;
  }
  const allowed = await ensurePermission();
  if (!allowed) {
    Alert.alert('Notifications are off', 'Allow notifications for UFitness (or Expo Go) in your phone settings, then try again.');
    return false;
  }
  try {
    await N.scheduleNotificationAsync({
      identifier: 'reminder-test',
      content: {
        title: 'UFitness reminder',
        body: 'Reminders work on this phone. Workout and meal reminders look like this.',
        data: { screen: 'Profile' },
      },
      trigger: { type: TRIGGER.TIME_INTERVAL, seconds, channelId: CHANNEL_ID },
    });
    return true;
  } catch (error) {
    Alert.alert('Could not schedule', error?.message || 'Try again.');
    return false;
  }
}

export async function loadReminders() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) return normalizeReminders(JSON.parse(raw));
    const uid = currentUid();
    if (uid) {
      const remote = await fetchCloudDoc('reminders', uid);
      if (remote && typeof remote === 'object') {
        const next = normalizeReminders(remote);
        await AsyncStorage.setItem(KEY, JSON.stringify(next));
        return next;
      }
    }
  } catch {
    /* bad JSON / storage error: fall through to defaults */
  }
  return normalizeReminders(null);
}

export async function saveReminders(next) {
  const clean = normalizeReminders(next);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(clean));
    const uid = currentUid();
    if (uid) saveCloudDoc('reminders', uid, clean);
  } catch {
    /* quota / private mode */
  }
  return clean;
}

/**
 * Save new settings and reschedule. Turning something on asks for permission first;
 * if the student says no, nothing is turned on.
 * Returns { state, ok, scheduled }.
 */
export async function updateReminders(next, { turningOn = false } = {}) {
  if (turningOn) {
    if (!getLocalNotifications()) {
      Alert.alert('Not available here', 'Reminders need the UFitness app (or Expo Go) on a phone.');
      return { state: await loadReminders(), ok: false, scheduled: 0 };
    }
    const allowed = await ensurePermission();
    if (!allowed) {
      Alert.alert('Notifications are off', 'Allow notifications for UFitness (or Expo Go) in your phone settings, then turn this on again.');
      return { state: await loadReminders(), ok: false, scheduled: 0 };
    }
  }
  const state = await saveReminders(next);
  const scheduled = await syncScheduledReminders(state).catch(() => 0);
  return { state, ok: true, scheduled };
}

export async function toggleReminder(field) {
  const current = await loadReminders();
  const turningOn = !current[field];
  const { state } = await updateReminders({ ...current, [field]: turningOn }, { turningOn });
  return state;
}

/** Fallback when there is no navigation (old Alert sheet). Prefer Profile → Notifications. */
export function showNotificationsSheet() {
  loadReminders().then((state) => {
    Alert.alert('Notifications', `Reminders on this phone.\n\n${reminderSummary(state)}`, [
      {
        text: state.groceryDay ? 'Turn off grocery day' : 'Remind grocery day',
        onPress: () => toggleReminder('groceryDay'),
      },
      {
        text: state.gymCheckIn ? 'Turn off gym check-in' : 'Remind gym check-in',
        onPress: () => toggleReminder('gymCheckIn'),
      },
      { text: 'Try one in 5 seconds', onPress: () => scheduleTestReminder() },
    ]);
  });
}

export function showPrivacySheet() {
  Promise.all([canUseBiometrics(), isUnlockEnabled(), biometricLabel()]).then(([can, on, label]) => {
    const buttons = [];
    if (can) {
      buttons.push({
        text: on ? `Turn off ${label} unlock` : `Unlock with ${label}`,
        onPress: () => {
          if (on) disableUnlock();
          else enableUnlock();
        },
      });
    }
    buttons.push({ text: 'Close', style: 'cancel' });
    Alert.alert(
      'Privacy & Security',
      on
        ? `Fingerprint / Face ID unlock is on. It locks the saved session; your password is not stored on this phone. Web still uses email and password.\n\nLogin, meals, and community also copy to your Supabase account when you are signed in. Sign out keeps the cloud profile.`
        : `Login, meals, community posts, theme, and these reminders stay on this device as cache. When you are signed in they also copy to your Supabase account. Signing out clears the session, not the cloud profile.${can ? `\n\nTurn this on to lock the app with ${label} when you reopen it.` : ''}`,
      buttons
    );
  });
}

export async function promptDueReminders() {
  const state = await loadReminders();
  syncScheduledReminders(state).catch(() => {});
  const today = todayKey();
  const weekday = new Date().getDay();
  const groceryDue = state.groceryDay && (weekday === 6 || weekday === 0) && state.lastGrocery !== today;
  const gymDue = state.gymCheckIn && weekday >= 1 && weekday <= 5 && state.lastGym !== today;

  if (groceryDue) {
    Alert.alert('Grocery day', 'Shop for this week’s plates. Open Meals and tap Grocery list.', [
      {
        text: 'OK',
        onPress: () => saveReminders({ ...state, lastGrocery: today }),
      },
    ]);
    return;
  }

  if (gymDue) {
    Alert.alert('Gym check-in', 'Log today’s session in Workout, or report how busy campus gym is in Community.', [
      {
        text: 'OK',
        onPress: () => saveReminders({ ...state, lastGym: today }),
      },
    ]);
  }
}
