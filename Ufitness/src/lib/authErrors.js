// Student-facing auth copy.
// Keep messages short, actionable, and UJ-specific.
// Never say whether an account exists on failed login.

export const AUTH_MESSAGES = {
  'auth/invalid-email': 'Use your 9-digit UJ student number.',
  'auth/missing-password': 'Enter your password.',
  'auth/weak-password': 'Password must be at least 8 characters.',
  'auth/email-already-in-use': 'That student number already has an account. Try Sign in.',
  // Same copy for wrong / missing — do not reveal whether the account exists.
  'auth/invalid-credential': 'Student number or password is incorrect.',
  'auth/wrong-password': 'Student number or password is incorrect.',
  'auth/user-not-found': 'Student number or password is incorrect.',
  'auth/too-many-requests': 'Too many tries. Wait a minute, then try again.',
  'auth/network-request-failed': 'No connection. Check Wi‑Fi or mobile data, then try again.',
  'auth/operation-not-allowed': 'Sign-in is temporarily unavailable. Try again later.',
  'auth/configuration-not-found': 'Sign-in is temporarily unavailable. Try again later.',
  'auth/expired-action-code': 'That code expired. Tap Send a new code.',
  'auth/invalid-action-code': 'That code is wrong or already used. Tap Send a new code.',
  'auth/missing-email': 'Enter your 9-digit student number first.',
  'auth/unauthorized-continue-uri': 'Sign-in is temporarily unavailable. Try again later.',
  'auth/unauthorized-domain': 'Sign-in is temporarily unavailable. Try again later.',
  'auth/api-key-not-valid': 'Sign-in is temporarily unavailable. Try again later.',
  'auth/invalid-api-key': 'Sign-in is temporarily unavailable. Try again later.',
};

// Local form checks (before we hit Supabase)
export const AUTH_HINTS = {
  needNumber: 'Enter your 9-digit UJ student number.',
  needPassword: 'Enter your password.',
  needBoth: 'Enter your 9-digit student number and password.',
  needName: 'Enter your name (not your student number).',
  needNineDigits: 'Student number must be exactly 9 digits.',
  weakPassword: 'Password must be at least 8 characters.',
  passwordMismatch: 'Those passwords do not match.',
  needCode: 'Enter the 8-digit code from your UJ email.',
  forgotNeedNumber: 'Enter your 9-digit student number first, then tap Forgot.',
  resetSent:
    'If that student number has an account, a reset link was sent to the matching UJ inbox. Check Junk too.',
  bioNeedsLogin:
    'Sign in with your student number and password once before biometric unlock can be used.',
  unlockFailed: 'Could not unlock. Try again, or use your password.',
};

function mapAuthText(raw) {
  const message = String(raw || '');

  if (/invalid login credentials|invalid credentials/i.test(message)) {
    return 'Student number or password is incorrect.';
  }
  if (/already registered|already been registered|user already exists/i.test(message)) {
    return 'That student number already has an account. Try Sign in.';
  }
  if (/email not confirmed/i.test(message)) {
    return 'Confirm your account first. Enter the 8-digit code from your UJ inbox.';
  }
  if (/token has expired|otp expired|invalid otp|token is invalid|otp_expired/i.test(message)) {
    return 'That code is wrong or expired. Tap Send a new code.';
  }
  if (/invalid api key|invalid jwt|jwt expired|configuration/i.test(message)) {
    return 'Sign-in is temporarily unavailable. Try again later.';
  }
  if (/failed to fetch|network|load failed|timeout/i.test(message)) {
    return 'No connection. Check Wi‑Fi or mobile data, then try again.';
  }
  if (/signups not allowed|signup is disabled|email signups are disabled/i.test(message)) {
    return 'New accounts are temporarily closed. Try again later.';
  }
  if (/password should be at least|weak password/i.test(message)) {
    return 'Password must be at least 8 characters.';
  }
  if (/unable to validate email/i.test(message)) {
    return 'Use your 9-digit UJ student number.';
  }
  if (/UJ student email required|Only UJ/i.test(message)) {
    return 'Only UJ student numbers (9 digits) can use UFitness.';
  }
  if (/rate limit|too many/i.test(message)) {
    return 'Too many tries. Wait a minute, then try again.';
  }
  // Already student-friendly messages from ujEmail / AppContext — keep them
  if (
    /student number|password|UJ|code|inbox|account|name/i.test(message) &&
    !/\.env|Supabase|anon key|API/i.test(message)
  ) {
    return message;
  }
  if (/\.env|Supabase|anon key|Project Settings/i.test(message)) {
    return 'Sign-in is temporarily unavailable. Try again later.';
  }
  return '';
}

export function friendlyAuthError(error) {
  if (!error) return 'Something went wrong. Try again.';
  console.warn('Auth error', error.code || '', error.message || error);
  if (error.code && AUTH_MESSAGES[error.code]) return AUTH_MESSAGES[error.code];
  const raw = String(error.message || error || '');
  return mapAuthText(raw) || 'Something went wrong. Try again.';
}
