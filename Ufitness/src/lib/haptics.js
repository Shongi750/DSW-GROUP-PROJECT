import { Platform } from 'react-native';

async function run(fn) {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = require('expo-haptics');
    await fn(Haptics);
  } catch {
    /* haptics optional */
  }
}

export function hapticLight() {
  return run((H) => H.impactAsync(H.ImpactFeedbackStyle.Light));
}

export function hapticMedium() {
  return run((H) => H.impactAsync(H.ImpactFeedbackStyle.Medium));
}

export function hapticSuccess() {
  return run((H) => H.notificationAsync(H.NotificationFeedbackType.Success));
}

export function hapticSelection() {
  return run((H) => H.selectionAsync());
}
