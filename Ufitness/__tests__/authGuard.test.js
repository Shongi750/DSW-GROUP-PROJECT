// Sign-up must create a real Supabase user before Home; old "local-…" users never get in.
import {
  authGate,
  emailFromLegacyLocalId,
  isLegacyLocalId,
  isRealAuthUserId,
  ownsLocalData,
  savedSessionUsable,
} from '../src/lib/authGuard';

const UID = '3f2b8c1e-9a4d-4e5f-8b6a-1c2d3e4f5a6b';
const OTHER = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const EMAIL = '221234567@student.uj.ac.za';

describe('auth ids', () => {
  test('only Supabase UUIDs count as real users', () => {
    expect(isRealAuthUserId(UID)).toBe(true);
    expect(isRealAuthUserId(`local-${EMAIL}`)).toBe(false);
    expect(isRealAuthUserId('')).toBe(false);
    expect(isRealAuthUserId(undefined)).toBe(false);
    expect(isRealAuthUserId('guest')).toBe(false);
  });

  test('legacy local ids are recognised and carry their email', () => {
    expect(isLegacyLocalId(`local-${EMAIL}`)).toBe(true);
    expect(isLegacyLocalId(UID)).toBe(false);
    expect(emailFromLegacyLocalId(`local-${EMAIL.toUpperCase()}`)).toBe(EMAIL);
    expect(emailFromLegacyLocalId(UID)).toBe('');
  });
});

describe('authGate (which screens the root navigator shows)', () => {
  test('sign-up with a code pending stays on Verify', () => {
    expect(authGate({ user: null, pendingOtp: { email: EMAIL } })).toBe('verify');
  });

  test('a fake local user cannot reach Home', () => {
    expect(authGate({ user: { id: `local-${EMAIL}`, email: EMAIL } })).toBe('auth');
    expect(authGate({ user: { id: `local-${EMAIL}` }, pendingOtp: { email: EMAIL } })).toBe('verify');
  });

  test('nobody signed in → Auth', () => {
    expect(authGate({})).toBe('auth');
    expect(authGate({ user: null })).toBe('auth');
  });

  test('a confirmed Supabase user → app', () => {
    expect(authGate({ user: { id: UID, email: EMAIL } })).toBe('app');
    expect(authGate({ user: { id: UID }, pendingOtp: { email: EMAIL } })).toBe('app');
  });
});

describe('saved sessions and local data ownership', () => {
  test('saved session is only reused for the same live Supabase user', () => {
    expect(savedSessionUsable({ id: UID }, UID)).toBe(true);
    expect(savedSessionUsable({ id: UID }, OTHER)).toBe(false);
    expect(savedSessionUsable({ id: `local-${EMAIL}` }, `local-${EMAIL}`)).toBe(false);
    expect(savedSessionUsable(null, UID)).toBe(false);
  });

  test('ownsLocalData: same uid, legacy same email, or guest data', () => {
    expect(ownsLocalData(UID, { uid: UID, email: EMAIL })).toBe(true);
    expect(ownsLocalData(`local-${EMAIL}`, { uid: UID, email: EMAIL })).toBe(true);
    expect(ownsLocalData(null, { uid: UID, email: EMAIL })).toBe(true);
  });

  test("ownsLocalData: never another student's data", () => {
    expect(ownsLocalData(OTHER, { uid: UID, email: EMAIL })).toBe(false);
    expect(ownsLocalData('local-229999999@student.uj.ac.za', { uid: UID, email: EMAIL })).toBe(false);
    expect(ownsLocalData(`local-${EMAIL}`, { uid: UID, email: '' })).toBe(false);
  });
});
