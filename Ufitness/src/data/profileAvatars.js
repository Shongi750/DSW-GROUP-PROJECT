/** Clean portrait defaults — no collage / UI mock seeds. */
function portrait(id, extras = '') {
  return `https://images.unsplash.com/${id}?w=400&h=400&fit=crop&auto=format&q=80${extras}`;
}

/** Solid brand fallback when no photo — orange initial via ui-avatars. */
export function initialAvatar(name = 'U') {
  const letter = encodeURIComponent(String(name || 'U').trim().charAt(0).toUpperCase() || 'U');
  return `https://ui-avatars.com/api/?name=${letter}&background=FF6A00&color=ffffff&size=256&bold=true&format=png`;
}

export const DEFAULT_AVATAR = initialAvatar('U');

export const PROFILE_AVATARS = [
  { id: 'thabo', uri: portrait('photo-1568602471122-7832951cc4c5') },
  { id: 'sipho', uri: portrait('photo-1506794778202-cad84cf45f1d') },
  { id: 'kai', uri: portrait('photo-1507003211169-0a1dd7228f2d') },
  { id: 'lerato', uri: portrait('photo-1531123897727-8f129e1688ce') },
  { id: 'nomsa', uri: portrait('photo-1529626455594-4ff0802cfb7e') },
  { id: 'aya', uri: portrait('photo-1589156280159-27698a70f29e') },
];
