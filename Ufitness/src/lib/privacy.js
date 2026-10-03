/** Default privacy prefs — opt-out of discovery / field visibility. */
export const DEFAULT_PRIVACY = {
  /** Appear in buddy finder / campus student list */
  discoverable: true,
  /** Show fitness goal on public profile */
  showGoal: true,
  /** Show campus */
  showCampus: true,
  /** Show beginner / intermediate / advanced */
  showExperience: true,
  /** Mentors may see progress check-ins you share via Hub */
  shareProgressWithMentor: true,
  /** Appear on Find a Mentor roster when you are a mentor */
  appearAsMentor: true,
};

export function normalizePrivacy(input) {
  const raw = input && typeof input === 'object' ? input : {};
  return {
    discoverable: raw.discoverable !== false,
    showGoal: raw.showGoal !== false,
    showCampus: raw.showCampus !== false,
    showExperience: raw.showExperience !== false,
    shareProgressWithMentor: raw.shareProgressWithMentor !== false,
    appearAsMentor: raw.appearAsMentor !== false,
  };
}
