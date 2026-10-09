import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';

// Remote push (server → phone). Only works in the installed APK / dev build:
// Expo Go on Android removed push in SDK 53, and the full expo-notifications import throws there.
// Needs an EAS project id (app.json → expo.extra.eas.projectId, added by `eas init`). See NOTIFICATIONS.md.

export function pushSupported() {
  if (Platform.OS === 'web') return false;
  if (isRunningInExpoGo()) return false; // Android: removed; iOS Expo Go: not our app's token
  return true;
}

function easProjectId() {
  try {
    const Constants = require('expo-constants').default;
    return Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId || '';
  } catch {
    return '';
  }
}

/**
 * Ask for permission and get this phone's Expo push token.
 * Returns { token } or { error: 'expo_go' | 'no_project' | 'denied' | message }.
 */
export async function registerForPushAsync() {
  if (!pushSupported()) return { error: 'expo_go' };
  const projectId = easProjectId();
  if (!projectId) return { error: 'no_project' };
  try {
    const Notifications = require('expo-notifications');
    const current = await Notifications.getPermissionsAsync();
    const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return { error: 'denied' };
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data ? { token: data } : { error: 'No token returned' };
  } catch (error) {
    return { error: error?.message || 'Push registration failed' };
  }
}
