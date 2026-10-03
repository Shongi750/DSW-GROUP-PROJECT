/** App roles — one account can hold several. Everyone is a student first. */
export const ROLES = {
  STUDENT: 'student',
  MENTOR: 'mentor',
  CAMPUS_ADMIN: 'campus_admin',
};

export function normalizeRoles(input) {
  const list = Array.isArray(input) ? input : input ? [input] : [];
  const cleaned = list
    .map((item) => String(item || '').trim().toLowerCase())
    .filter((item) => Object.values(ROLES).includes(item));
  if (!cleaned.includes(ROLES.STUDENT)) cleaned.unshift(ROLES.STUDENT);
  return [...new Set(cleaned)];
}

export function hasRole(roles, role) {
  return normalizeRoles(roles).includes(role);
}

export function isMentorRole(roles) {
  return hasRole(roles, ROLES.MENTOR);
}

export function withRole(roles, role) {
  return normalizeRoles([...normalizeRoles(roles), role]);
}

export function withoutRole(roles, role) {
  return normalizeRoles(normalizeRoles(roles).filter((item) => item !== role));
}

/**
 * What this account can open. Mentors keep the full student product
 * and unlock Mentor Hub on top.
 */
export function capabilitiesFor(roles, { isCampusAdmin = false } = {}) {
  const list = normalizeRoles(roles);
  const mentor = list.includes(ROLES.MENTOR);
  const admin = isCampusAdmin || list.includes(ROLES.CAMPUS_ADMIN);
  return {
    roles: list,
    // Student baseline (everyone)
    myFitness: true,
    myProgress: true,
    meals: true,
    buddy: true,
    findMentor: true,
    // Mentor layer
    mentorHub: mentor,
    mentees: mentor,
    menteeProgress: mentor,
    guidance: mentor,
    // Campus admin
    campusAdmin: admin,
  };
}
