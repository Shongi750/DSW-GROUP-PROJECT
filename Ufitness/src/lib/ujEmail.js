const UJ_STUDENT_DOMAIN = 'student.uj.ac.za';
const STUDENT_EMAIL_PATTERN = /^\d{9}@student\.uj\.ac\.za$/;
export const CAMPUS_ADMIN_STUDENT_NUMBER = '223222161';

export function normalizeStudentEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function isUjStudentEmail(email) {
  return STUDENT_EMAIL_PATTERN.test(normalizeStudentEmail(email));
}

export function personName(value) {
  const name = String(value || '').trim();
  if (!name || /^\d{9}$/.test(name)) return '';
  return name;
}

export function studentNumberFromEmail(email) {
  const normalized = normalizeStudentEmail(email);
  if (!isUjStudentEmail(normalized)) return '';
  return normalized.split('@')[0];
}

export function assertUjStudentAccount({ email, studentNumber } = {}) {
  const normalized = normalizeStudentEmail(email);
  if (!normalized) {
    throw new Error('Enter your 9-digit UJ student number.');
  }
  if (!normalized.endsWith(`@${UJ_STUDENT_DOMAIN}`)) {
    throw new Error(
      'Only UJ students can use UFitness. Enter your 9-digit student number — not Gmail or @uj.ac.za.',
    );
  }
  if (!STUDENT_EMAIL_PATTERN.test(normalized)) {
    throw new Error('Student number must be exactly 9 digits.');
  }
  const fromEmail = studentNumberFromEmail(normalized);
  const number = String(studentNumber || '').trim();
  if (number && number !== fromEmail) {
    throw new Error('Student number must match your UJ account.');
  }
  return { email: normalized, studentNumber: fromEmail };
}

/** Prefer a 9-digit student number; still accepts a full student email for migration. */
export function accountFromStudentOrEmail(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) {
    throw new Error('Enter your 9-digit UJ student number.');
  }
  if (/^\d{9}$/.test(raw)) {
    return { email: `${raw}@${UJ_STUDENT_DOMAIN}`, studentNumber: raw };
  }
  if (/^\d+$/.test(raw)) {
    throw new Error('Student number must be exactly 9 digits.');
  }
  return assertUjStudentAccount({ email: raw });
}

export function maskStudentInbox(emailOrNumber) {
  try {
    const account = accountFromStudentOrEmail(emailOrNumber);
    return `${account.studentNumber}@student.uj.ac.za`;
  } catch {
    return 'your UJ student inbox';
  }
}

export function accountStudentNumber({ studentNumber, email } = {}) {
  const fromProfile = String(studentNumber || '').trim();
  if (fromProfile) return fromProfile;
  return studentNumberFromEmail(email);
}

/** Client UX hint only — never trust editable profile.studentNumber. Server uses is_campus_admin(). */
export function isCampusAdmin(account = {}) {
  const email = normalizeStudentEmail(account.email);
  if (!email) return false;
  return studentNumberFromEmail(email) === CAMPUS_ADMIN_STUDENT_NUMBER;
}
