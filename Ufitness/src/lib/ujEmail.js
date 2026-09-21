const UJ_STUDENT_DOMAIN = 'student.uj.ac.za';
const STUDENT_EMAIL_PATTERN = /^\d{8,9}@student\.uj\.ac\.za$/;
export const CAMPUS_ADMIN_STUDENT_NUMBER = '223222161';

export function normalizeStudentEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function isUjStudentEmail(email) {
  return STUDENT_EMAIL_PATTERN.test(normalizeStudentEmail(email));
}

export function studentNumberFromEmail(email) {
  const normalized = normalizeStudentEmail(email);
  if (!isUjStudentEmail(normalized)) return '';
  return normalized.split('@')[0];
}

export function assertUjStudentAccount({ email, studentNumber } = {}) {
  const normalized = normalizeStudentEmail(email);
  if (!normalized) {
    throw new Error('Enter your UJ student email.');
  }
  if (!normalized.endsWith(`@${UJ_STUDENT_DOMAIN}`)) {
    throw new Error(
      'Use your UJ student email, for example 223222181@student.uj.ac.za. Gmail and @uj.ac.za addresses cannot be used to sign up.',
    );
  }
  if (!STUDENT_EMAIL_PATTERN.test(normalized)) {
    throw new Error(
      'UJ student email is your 8- or 9-digit student number plus @student.uj.ac.za.',
    );
  }
  const fromEmail = studentNumberFromEmail(normalized);
  const number = String(studentNumber || '').trim();
  if (number && number !== fromEmail) {
    throw new Error('Student number must match the email address.');
  }
  return { email: normalized, studentNumber: fromEmail };
}

export function accountStudentNumber({ studentNumber, email } = {}) {
  const fromProfile = String(studentNumber || '').trim();
  if (fromProfile) return fromProfile;
  return studentNumberFromEmail(email);
}

export function isCampusAdmin(account = {}) {
  return accountStudentNumber(account) === CAMPUS_ADMIN_STUDENT_NUMBER;
}
