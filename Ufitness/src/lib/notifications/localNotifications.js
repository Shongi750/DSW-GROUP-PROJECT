import { Platform } from 'react-native';

// Local (on-phone) notifications: scheduled workout / meal / grocery reminders.
//
// Why the deep imports: `import 'expo-notifications'` loads the push-token auto-registration
// code, and in Expo Go on Android (SDK 53+) that code throws ("push notifications were removed
// from Expo Go"), which crashed the app after login. Local notifications still work in Expo Go,
// so we only load the local pieces here. Push lives in ./pushNotifications.js (APK only).
let api; // undefined = not tried yet, null = not available

export function getLocalNotifications() {
  if (api !== undefined) return api;
  api = null;
  if (Platform.OS === 'web') return null;
  try {
    const { scheduleNotificationAsync } = require('expo-notifications/build/scheduleNotificationAsync');
    const { cancelScheduledNotificationAsync } = require('expo-notifications/build/cancelScheduledNotificationAsync');
    const { getAllScheduledNotificationsAsync } = require('expo-notifications/build/getAllScheduledNotificationsAsync');
    const { getPermissionsAsync, requestPermissionsAsync } = require('expo-notifications/build/NotificationPermissions');
    const { setNotificationChannelAsync } = require('expo-notifications/build/setNotificationChannelAsync');
    const { setNotificationHandler } = require('expo-notifications/build/NotificationsHandler');
    const { AndroidImportance } = require('expo-notifications/build/NotificationChannelManager.types');

    // Show reminders as a banner even when UFitness is open.
    setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    api = {
      scheduleNotificationAsync,
      cancelScheduledNotificationAsync,
      getAllScheduledNotificationsAsync,
      getPermissionsAsync,
      requestPermissionsAsync,
      setNotificationChannelAsync,
      AndroidImportance,
    };
  } catch (error) {
    if (__DEV__) console.warn('[reminders] local notifications unavailable:', error?.message);
    api = null;
  }
  return api;
}
