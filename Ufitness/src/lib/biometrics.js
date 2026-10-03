import { Alert, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const ENABLED_KEY = 'ufitness.bio.enabled';
const EMAIL_KEY = 'ufitness.bio.email';
const SECRET_KEY = 'ufitness.bio.secret';

const guarded = {
  requireAuthentication: true,
  authenticationPrompt: 'Unlock UFitness',
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

function canGuardSecret() {
  try {
    return nativeOk() && SecureStore.canUseBiometricAuthentication();
  } catch {
    return false;
  }
}

function nativeOk() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export async function canUseBiometrics() {
  if (!nativeOk()) return false;
  try {
    const [hardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return Boolean(hardware && enrolled);
  } catch {
    return false;
  }
}

export async function biometricLabel() {
  if (!nativeOk()) return 'biometrics';
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const face = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    const finger = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
    if (face && !finger) return 'Face ID';
    if (finger && !face) return 'fingerprint';
    if (face && finger) return 'Face ID or fingerprint';
  } catch {
    /* fall through */
  }
  return 'biometrics';
}

export async function isUnlockEnabled() {
  if (!nativeOk()) return false;
  try {
    const flag = await SecureStore.getItemAsync(ENABLED_KEY);
    return flag === '1';
  } catch {
    return false;
  }
}

export async function shouldLockSession() {
  return (await canUseBiometrics()) && (await isUnlockEnabled());
}

export async function hasUnlockSecret() {
  if (!nativeOk()) return false;
  try {
    if (canGuardSecret()) {
      const guardedSecret = await SecureStore.getItemAsync(SECRET_KEY, guarded);
      if (guardedSecret) return true;
    }
    const secret = await SecureStore.getItemAsync(SECRET_KEY);
    return Boolean(secret);
  } catch {
    return false;
  }
}

export async function enableUnlock({ email, password } = {}) {
  if (!nativeOk()) return false;
  if (!(await canUseBiometrics())) return false;
  await SecureStore.setItemAsync(ENABLED_KEY, '1');
  if (email) await SecureStore.setItemAsync(EMAIL_KEY, String(email).trim().toLowerCase());
  if (password) {
    const secret = String(password);
    if (canGuardSecret()) {
      try {
        await SecureStore.setItemAsync(SECRET_KEY, secret, guarded);
      } catch {
        await SecureStore.setItemAsync(SECRET_KEY, secret);
      }
    } else {
      await SecureStore.setItemAsync(SECRET_KEY, secret);
    }
  }
  return true;
}

export async function enableUnlockFlagOnly() {
  if (!nativeOk()) return false;
  if (!(await canUseBiometrics())) return false;
  if (!(await hasUnlockSecret())) return false;
  await SecureStore.setItemAsync(ENABLED_KEY, '1');
  return true;
}

export async function disableUnlock() {
  if (!nativeOk()) return;
  await Promise.allSettled([
    SecureStore.deleteItemAsync(ENABLED_KEY),
    SecureStore.deleteItemAsync(EMAIL_KEY),
    SecureStore.deleteItemAsync(SECRET_KEY, guarded),
    SecureStore.deleteItemAsync(SECRET_KEY),
  ]);
}

export async function authenticateUnlock(promptMessage) {
  if (!(await canUseBiometrics())) return false;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: promptMessage || 'Unlock UFitness',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
    biometricsSecurityLevel: 'weak',
  });
  return Boolean(result?.success);
}

export async function unlockCredentials() {
  let password = '';
  if (canGuardSecret()) {
    try {
      password = (await SecureStore.getItemAsync(SECRET_KEY, guarded)) || '';
    } catch {
      password = '';
    }
  }
  if (!password) {
    const ok = await authenticateUnlock(`Unlock with ${await biometricLabel()}`);
    if (!ok) return null;
    password = (await SecureStore.getItemAsync(SECRET_KEY)) || '';
  }
  const email = await SecureStore.getItemAsync(EMAIL_KEY);
  if (!email) return null;
  return { email, password };
}

export async function promptEnableAfterLogin({ email, password }) {
  if (!nativeOk() || !password) return;
  if (!(await canUseBiometrics())) return;
  if (await isUnlockEnabled()) {
    await enableUnlock({ email, password });
    return;
  }
  const label = await biometricLabel();
  Alert.alert(
    `Unlock next time with ${label}?`,
    'Your student email stays on this phone. The password is stored in the device keystore, not in ordinary app storage. Web still uses email and password.',
    [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Enable',
        onPress: () => {
          enableUnlock({ email, password }).catch(() => {});
        },
      },
    ]
  );
}
