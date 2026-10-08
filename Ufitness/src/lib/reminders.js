import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  biometricLabel,
  canUseBiometrics,
  disableUnlock,
  enableUnlock,
  isUnlockEnabled,
} from './biometrics';
import { currentUid, fetchCloudDoc, saveCloudDoc } from './cloudCache';

const KEY = 'ufitness.reminders.v1';
const CHANNEL = 'reminders';

const empty = {
  groceryDay: false,
  gymCheckIn: false,
  lastGrocery: '',
  lastGym: '',
};

const GROCERY = [
  { id: 'grocery-saturday', weekday: 7 },
  { id: 'grocery-sunday', weekday: 1 },
];

const GYM = [
  { id: 'gym-monday', weekday: 2 },
  { id: 'gym-tuesday', weekday: 3 },
  { id: 'gym-wednesday', weekday: 4 },
  { id: 'gym-thursday', weekday: 5 },
  { id: 'gym-friday', weekday: 6 },
];

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function ensurePermission() {
  if (Platform.OS === 'web') return false;
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

async function cancelIds(items) {
  await Promise.all(
    items.map((item) => Notifications.cancelScheduledNotificationAsync(item.id).catch(() => {}))
  );
}

async function scheduleWeekly(items, title, body) {
  for (const item of items) {
    await Notifications.scheduleNotificationAsync({
      identifier: item.id,
      content: { title, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: item.weekday,
        hour: 9,
        minute: 0,
        channelId: CHANNEL,
      },
    });
  }
}

export async function syncScheduledReminders(state) {
  if (Platform.OS === 'web') return;
  if (state.groceryDay) {
    await scheduleWeekly(
      GROCERY,
      'Grocery day',
      'Shop for this week’s plates. Open Meals and tap Grocery list.'
    );
  } else {
    await cancelIds(GROCERY);
  }
  if (state.gymCheckIn) {
    await scheduleWeekly(
      GYM,
      'Gym check-in',
      'Log today’s session in Workout, or report how busy campus gym is in Community.'
    );
  } else {
    await cancelIds(GYM);
  }
}

export async function scheduleTestReminder() {
  const allowed = await ensurePermission();
  if (!allowed) {
    Alert.alert('Notifications are off', 'Allow notifications for UFitness to see a reminder.');
    return false;
  }
  await Notifications.scheduleNotificationAsync({
    identifier: 'reminder-test',
    content: {
      title: 'UFitness reminder',
      body: 'Grocery day and gym check-in use this same alert.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 8,
      channelId: CHANNEL,
    },
  });
  return true;
}

export async function loadReminders() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? { ...empty, ...parsed } : { ...empty };
    }
    const uid = currentUid();
    if (uid) {
      const remote = await fetchCloudDoc('reminders', uid);
      if (remote && typeof remote === 'object') {
        const next = { ...empty, groceryDay: remote.groceryDay, gymCheckIn: remote.gymCheckIn, lastGrocery: remote.lastGrocery, lastGym: remote.lastGym };
        await AsyncStorage.setItem(KEY, JSON.stringify(next));
        return next;
      }
    }
    return { ...empty };
  } catch {
    return { ...empty };
  }
}

export async function saveReminders(next) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    const uid = currentUid();
    if (uid) saveCloudDoc('reminders', uid, next);
  } catch {
    /* quota / private mode */
  }
}

export async function toggleReminder(field) {
  const current = await loadReminders();
  const turningOn = !current[field];
  if (turningOn) {
    const allowed = await ensurePermission();
    if (!allowed) {
      Alert.alert(
        'Notifications are off',
        'Allow notifications for UFitness, then turn this reminder on again.'
      );
      return current;
    }
  }
  const next = { ...current, [field]: turningOn };
  await saveReminders(next);
  await syncScheduledReminders(next);
  return next;
}

export function showNotificationsSheet() {
  loadReminders().then((state) => {
    Alert.alert(
      'Notifications',
      `Reminders on this phone.\n\nGrocery day: ${state.groceryDay ? 'on' : 'off'} (Sat and Sun, 9:00)\nGym check-in: ${state.gymCheckIn ? 'on' : 'off'} (weekdays, 9:00)`,
      [
        {
          text: state.groceryDay ? 'Turn off grocery day' : 'Remind grocery day',
          onPress: () => toggleReminder('groceryDay'),
        },
        {
          text: state.gymCheckIn ? 'Turn off gym check-in' : 'Remind gym check-in',
          onPress: () => toggleReminder('gymCheckIn'),
        },
        {
          text: 'Try one in 8 seconds',
          onPress: () => scheduleTestReminder(),
        },
      ]
    );
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
  if (Platform.OS !== 'web') {
    syncScheduledReminders(state).catch(() => {});
  }
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
