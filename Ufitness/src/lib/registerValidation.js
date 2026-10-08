import { AUTH_HINTS } from './authErrors';
import { accountFromStudentOrEmail, personName } from './ujEmail';

// Sign-up form checks (used by RegisterScreen, tested in __tests__/signUpFlow.test.js).
// Returns { error } with a friendly hint, or { account } ready for register().
export function validateSignUp({ fullName, studentNumber, password, confirmPassword }) {
  const name = personName(fullName);
  if (!name) return { error: AUTH_HINTS.needName };
  if (!/^\d{9}$/.test(String(studentNumber || '').trim())) return { error: AUTH_HINTS.needNineDigits };
  if (String(password || '').length < 8) return { error: AUTH_HINTS.weakPassword };
  if (password !== confirmPassword) return { error: AUTH_HINTS.passwordMismatch };
  const account = accountFromStudentOrEmail(studentNumber);
  return {
    account: { name, email: account.email, studentNumber: account.studentNumber, password },
  };
}
