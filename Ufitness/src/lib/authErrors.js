export const AUTH_MESSAGES = {
  'auth/invalid-email': 'That email address is not valid.',
  'auth/missing-password': 'Enter your password.',
  'auth/weak-password': 'Passwords need at least 6 characters.',
  'auth/email-already-in-use': 'That email already has an account. Try signing in instead.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'No account with that email yet.',
  'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
  'auth/network-request-failed': 'Network problem. Check your connection and retry.',
  'auth/operation-not-allowed':
    'Turn on Email/Password and Email link (passwordless) in Firebase: Authentication → Sign-in method.',
  'auth/configuration-not-found':
    'Authentication is not turned on for this Firebase project. Open Authentication in the console, click Get started, then enable Email/Password and Email link.',
  'auth/expired-action-code': 'That sign-up link has expired. Tap Resend email.',
  'auth/invalid-action-code': 'That sign-up link is invalid or already used. Tap Resend email.',
  'auth/missing-email': 'Enter your UJ student email so we can send the link.',
  'auth/unauthorized-continue-uri':
    'Add http://localhost:8090 and localhost to Firebase Authentication → Settings → Authorized domains.',
  'auth/unauthorized-domain':
    'This address is not an authorized domain. In Firebase go to Authentication → Settings → Authorized domains and add localhost and 127.0.0.1.',
  'auth/api-key-not-valid': 'The Firebase API key in .env is not valid. Copy it again from Project settings.',
  'auth/invalid-api-key': 'The Firebase API key in .env is not valid. Copy it again from Project settings.',
};

export function friendlyAuthError(error) {
  if (!error) return 'Something went wrong.';
  console.warn('Auth error', error.code || '', error.message || error);
  return AUTH_MESSAGES[error.code] || error.message?.replace('Firebase: ', '') || 'Something went wrong.';
}
