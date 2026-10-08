import { Alert, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// Biometric unlock = an app lock on top of the Supabase session that is already
// saved on the phone. We never store the password. If the student signs out,
// they type their password again (that is the safe, normal behaviour).

const ENABLED_KEY = 'ufitness.bio.enabled';

// Older builds saved the email + password here. We only delete them now.
const LEGACY_EMAIL_KEY = 'ufitness.bio.email';
const LEGACY_SECRET_KEY = 'ufitness.bio.secret';

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

/** Remove any password/email an older version saved. Safe to call on every start. */
export async function clearLegacySecrets() {
  if (!nativeOk()) return;
  await Promise.allSettled([
    SecureStore.deleteItemAsync(LEGACY_EMAIL_KEY),
    SecureStore.deleteItemAsync(LEGACY_SECRET_KEY),
  ]);
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

/** True when a reopened app should show the Unlock screen first. */
export async function shouldLockSession() {
  return (await canUseBiometrics()) && (await isUnlockEnabled());
}

/** Turn the app lock on. Only a flag is stored, no credentials. */
export async function enableUnlock() {
  if (!nativeOk()) return false;
  if (!(await canUseBiometrics())) return false;
  await SecureStore.setItemAsync(ENABLED_KEY, '1');
  return true;
}

export async function disableUnlock() {
  if (!nativeOk()) return;
  await Promise.allSettled([SecureStore.deleteItemAsync(ENABLED_KEY)]);
  await clearLegacySecrets();
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

/** After a password login, offer to lock the saved session with biometrics. */
export async function promptEnableAfterLogin() {
  if (!nativeOk()) return;
  if (!(await canUseBiometrics())) return;
  if (await isUnlockEnabled()) return;
  const label = await biometricLabel();
  Alert.alert(
    `Lock UFitness with ${label}?`,
    'When you reopen the app you unlock it with ' +
      label +
      '. Your password is not saved on this phone. After signing out you type it again.',
    [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Enable',
        onPress: () => {
          enableUnlock().catch(() => {});
        },
      },
    ]
  );
}
