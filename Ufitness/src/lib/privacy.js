// Privacy toggles stored on the profile.
// Default is "visible" — students turn things OFF if they want.

export const DEFAULT_PRIVACY = {
  discoverable: true, // show up in buddy finder
  showGoal: true, // show fitness goal on public profile
  showCampus: true,
  showExperience: true, // beginner / intermediate / advanced
  shareProgressWithMentor: true, // mentors can see check-ins
  appearAsMentor: true, // show on Find a Mentor if you are a mentor
};

// Fill in any missing keys with the defaults above.
// If a value is missing we treat it as "on" (true).
export function normalizePrivacy(input) {
  let raw = {};
  if (input && typeof input === 'object') {
    raw = input;
  }

  return {
    discoverable: raw.discoverable !== false,
    showGoal: raw.showGoal !== false,
    showCampus: raw.showCampus !== false,
    showExperience: raw.showExperience !== false,
    shareProgressWithMentor: raw.shareProgressWithMentor !== false,
    appearAsMentor: raw.appearAsMentor !== false,
  };
}
