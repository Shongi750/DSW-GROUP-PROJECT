// Pure auth-session rules (no React Native / Supabase imports) so they can be unit-tested.
//
// Old builds had an "offline" fallback: when EXPO_PUBLIC_SUPABASE_URL / ANON_KEY were missing,
// sign-up and log-in invented a user id like "local-221234567@student.uj.ac.za" and went
// straight to Home. That account never existed in Supabase Auth. These helpers make sure only
// a real Supabase user (UUID id, from a confirmed session) can get past the auth screens.

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOCAL_PREFIX = 'local-';

/** True only for a Supabase auth.users id (UUID). */
export function isRealAuthUserId(id) {
  return UUID_PATTERN.test(String(id || ''));
}

/** True for the fake ids old builds made without Supabase ("local-<email>"). */
export function isLegacyLocalId(id) {
  return String(id || '').startsWith(LOCAL_PREFIX);
}

/** The email baked into a legacy "local-<email>" id, lower-cased ('' if not legacy). */
export function emailFromLegacyLocalId(id) {
  if (!isLegacyLocalId(id)) return '';
  return String(id).slice(LOCAL_PREFIX.length).trim().toLowerCase();
}

/**
 * Which screen group the root navigator may show.
 *  - 'verify' while an OTP sign-up is pending and nobody is signed in
 *  - 'auth'   when there is no real Supabase user (including legacy local-* users)
 *  - 'app'    only for a real, confirmed Supabase user
 */
export function authGate({ user, pendingOtp } = {}) {
  const real = Boolean(user && isRealAuthUserId(user.id));
  if (pendingOtp && !real) return 'verify';
  if (!real) return 'auth';
  return 'app';
}

/**
 * A saved session from AsyncStorage may only be restored if it belongs to the live Supabase
 * session user. Anything else (legacy local user, another account) is ignored.
 */
export function savedSessionUsable(savedUser, sessionUserId) {
  if (!savedUser || !sessionUserId) return false;
  return isRealAuthUserId(sessionUserId) && savedUser.id === sessionUserId;
}

/**
 * Does locally stored data stamped with `ownerId` belong to this signed-in account?
 *  - same Supabase uid → yes
 *  - legacy "local-<email>" with the same email → yes (one-time migration of old offline data)
 *  - no owner at all → treated as guest/legacy data on this phone → yes (folded in once)
 *  - anything else → no (another student's data on a shared phone)
 */
export function ownsLocalData(ownerId, { uid, email } = {}) {
  if (!ownerId) return true;
  if (uid && ownerId === uid) return true;
  const legacyEmail = emailFromLegacyLocalId(ownerId);
  return Boolean(legacyEmail && email && legacyEmail === String(email).trim().toLowerCase());
}
