export const AUTH_MESSAGES = {
  'auth/invalid-email': 'Use your 9-digit UJ student number.',
  'auth/missing-password': 'Enter your password.',
  'auth/weak-password': 'Passwords need at least 8 characters.',
  'auth/email-already-in-use': 'That student number already has an account. Try signing in instead.',
  // Same copy for wrong / missing — do not reveal whether the account exists.
  'auth/invalid-credential': 'Student number or password is incorrect.',
  'auth/wrong-password': 'Student number or password is incorrect.',
  'auth/user-not-found': 'Student number or password is incorrect.',
  'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
  'auth/network-request-failed': 'Network problem. Check your connection and retry.',
  'auth/operation-not-allowed':
    'Email sign-in is turned off in Supabase. Open Authentication → Providers → Email and enable it.',
  'auth/configuration-not-found':
    'Supabase Auth is not ready. Check the project URL and anon key in Ufitness/.env, then restart the app.',
  'auth/expired-action-code': 'That sign-up code has expired. Tap Resend code.',
  'auth/invalid-action-code': 'That sign-up code is invalid or already used. Tap Resend code.',
  'auth/missing-email': 'Enter your 9-digit student number so we can email the code.',
  'auth/unauthorized-continue-uri':
    'Add this app address under Supabase Authentication → URL Configuration.',
  'auth/unauthorized-domain':
    'This address is not allowed. Add it under Supabase Authentication → URL Configuration.',
  'auth/api-key-not-valid':
    'The Supabase anon key in Ufitness/.env is not valid. Copy it again from Project Settings → API.',
  'auth/invalid-api-key':
    'The Supabase anon key in Ufitness/.env is not valid. Copy it again from Project Settings → API.',
};

function mapAuthText(raw) {
  const message = String(raw || '');
  if (/invalid login credentials/i.test(message)) {
    return 'Student number or password is incorrect.';
  }
  if (/already registered|already been registered|user already exists/i.test(message)) {
    return 'That student number already has an account. Use Sign in instead.';
  }
  if (/email not confirmed/i.test(message)) {
    return 'Enter the 8-digit code sent to your UJ student inbox.';
  }
  if (/token has expired|otp expired|invalid otp|token is invalid|otp_expired/i.test(message)) {
    return 'That code is wrong or expired. Request a new one.';
  }
  if (/invalid api key|invalid jwt|jwt expired/i.test(message)) {
    return 'The Supabase key in Ufitness/.env was rejected. Paste the anon public key again from Project Settings → API, then restart the app.';
  }
  if (/failed to fetch|network|load failed/i.test(message)) {
    return 'Could not reach Supabase. Check the project URL in Ufitness/.env and your connection, then restart the app.';
  }
  if (/signups not allowed|signup is disabled|email signups are disabled/i.test(message)) {
    return 'Email sign-up is turned off in Supabase. Open Authentication → Sign In / Providers → Email and enable it.';
  }
  if (/password should be at least|weak password/i.test(message)) {
    return 'Use a password of at least 8 characters.';
  }
  if (/unable to validate email/i.test(message)) {
    return 'Use your 9-digit UJ student number.';
  }
  if (/UJ student email required/i.test(message)) {
    return 'Only UJ student numbers (9 digits) can use UFitness.';
  }
  return '';
}

export function friendlyAuthError(error) {
  if (!error) return 'Something went wrong.';
  console.warn('Auth error', error.code || '', error.message || error);
  if (AUTH_MESSAGES[error.code]) return AUTH_MESSAGES[error.code];
  const raw = String(error.message || error || '').replace(/^Firebase:\s*/i, '');
  return mapAuthText(raw) || raw || 'Something went wrong.';
}
