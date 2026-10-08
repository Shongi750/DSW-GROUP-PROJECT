import { friendlyAuthError, AUTH_MESSAGES } from '../src/lib/authErrors';

describe('friendly auth errors', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    console.warn.mockRestore();
  });

  test('wrong password and unknown account get the same message', () => {
    const wrong = friendlyAuthError({ message: 'Invalid login credentials' });
    const unknown = friendlyAuthError({ code: 'auth/user-not-found' });
    expect(wrong).toBe('Student number or password is incorrect.');
    expect(unknown).toBe(wrong);
  });

  test('known codes use the AUTH_MESSAGES table', () => {
    expect(friendlyAuthError({ code: 'auth/too-many-requests' })).toBe(AUTH_MESSAGES['auth/too-many-requests']);
  });

  test('Supabase messages are mapped to student language', () => {
    expect(friendlyAuthError({ message: 'Email not confirmed' })).toMatch(/8-digit code/);
    expect(friendlyAuthError({ message: 'Token has expired or is invalid' })).toMatch(/Send a new code/);
    expect(friendlyAuthError({ message: 'TypeError: Failed to fetch' })).toMatch(/No connection/);
    expect(friendlyAuthError({ message: 'UJ student email required (9-digit-number@student.uj.ac.za)' })).toBe(
      'Only UJ student numbers (9 digits) can use UFitness.'
    );
  });

  test('setup details (.env, anon key) are never shown to students', () => {
    const text = friendlyAuthError({ message: 'Supabase anon key missing in .env' });
    expect(text).toBe('Sign-in is temporarily unavailable. Try again later.');
  });

  test('already friendly messages pass through', () => {
    expect(friendlyAuthError(new Error('Student number must be exactly 9 digits.'))).toBe(
      'Student number must be exactly 9 digits.'
    );
  });

  test('empty or unknown errors get a generic message', () => {
    expect(friendlyAuthError(null)).toBe('Something went wrong. Try again.');
    expect(friendlyAuthError({ message: 'xyz' })).toBe('Something went wrong. Try again.');
  });
});
