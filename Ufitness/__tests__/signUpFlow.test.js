// Sign-up validation, from the form fields to the account sent to register().
import { validateSignUp } from '../src/lib/registerValidation';
import { AUTH_HINTS } from '../src/lib/authErrors';
import { assertUjStudentAccount, isCampusAdmin, maskStudentInbox } from '../src/lib/ujEmail';

const good = { fullName: '  Lerato M ', studentNumber: '221234567', password: 'longpass1', confirmPassword: 'longpass1' };

describe('sign-up form', () => {
  test('valid form gives a UJ student account', () => {
    const { error, account } = validateSignUp(good);
    expect(error).toBeUndefined();
    expect(account).toEqual({
      name: 'Lerato M',
      email: '221234567@student.uj.ac.za',
      studentNumber: '221234567',
      password: 'longpass1',
    });
    // AppContext.register() checks the account again — it must pass.
    expect(assertUjStudentAccount(account)).toEqual({ email: account.email, studentNumber: '221234567' });
    expect(maskStudentInbox(account.studentNumber)).toBe('221234567@student.uj.ac.za');
  });

  test('checks run in order with friendly hints', () => {
    expect(validateSignUp({ ...good, fullName: '' }).error).toBe(AUTH_HINTS.needName);
    expect(validateSignUp({ ...good, fullName: '221234567' }).error).toBe(AUTH_HINTS.needName);
    expect(validateSignUp({ ...good, studentNumber: '12345' }).error).toBe(AUTH_HINTS.needNineDigits);
    expect(validateSignUp({ ...good, studentNumber: 'me@gmail.com' }).error).toBe(AUTH_HINTS.needNineDigits);
    expect(validateSignUp({ ...good, password: 'short', confirmPassword: 'short' }).error).toBe(AUTH_HINTS.weakPassword);
    expect(validateSignUp({ ...good, confirmPassword: 'different1' }).error).toBe(AUTH_HINTS.passwordMismatch);
  });

  test('register() rejects mismatched or non-student accounts', () => {
    expect(() => assertUjStudentAccount({ email: 'x@gmail.com' })).toThrow(/Only UJ students/);
    expect(() => assertUjStudentAccount({ email: '221234567@student.uj.ac.za', studentNumber: '229999999' })).toThrow(/must match/);
  });

  test('admin badge is only a client hint from the email', () => {
    expect(isCampusAdmin({ email: '223222161@student.uj.ac.za' })).toBe(true);
    expect(isCampusAdmin({ email: '221234567@student.uj.ac.za', studentNumber: '223222161' })).toBe(false);
  });
});
