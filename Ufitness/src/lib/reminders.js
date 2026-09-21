import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { currentUid, fetchCloudDoc, saveCloudDoc } from './cloudCache';

const KEY = 'ufitness.reminders.v1';

const empty = {
  groceryDay: false,
  gymCheckIn: false,
  lastGrocery: '',
  lastGym: '',
};

function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
  const next = { ...current, [field]: !current[field] };
  await saveReminders(next);
  return next;
}

export function showNotificationsSheet() {
  loadReminders().then((state) => {
    Alert.alert(
      'Notifications',
      `Local reminders on this phone only.\n\nGrocery day: ${state.groceryDay ? 'on' : 'off'}\nGym check-in: ${state.gymCheckIn ? 'on' : 'off'}`,
      [
        {
          text: state.groceryDay ? 'Turn off grocery day' : 'Remind grocery day',
          onPress: () => toggleReminder('groceryDay'),
        },
        {
          text: state.gymCheckIn ? 'Turn off gym check-in' : 'Remind gym check-in',
          onPress: () => toggleReminder('gymCheckIn'),
        },
        { text: 'Close', style: 'cancel' },
      ]
    );
  });
}

export function showPrivacySheet() {
  Alert.alert(
    'Privacy & Security',
    'Login, meals, community posts, theme, and these reminders stay on this device as cache. When you are signed in they also copy to your Firebase account so another phone can pick them up. Signing out clears the session, not the cloud profile. No extra permissions are required for grocery-day or gym check-in reminders.'
  );
}

export async function promptDueReminders() {
  const state = await loadReminders();
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
