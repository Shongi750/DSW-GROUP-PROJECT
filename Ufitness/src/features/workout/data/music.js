// Music = open the student's own streaming app.
// We do NOT play songs inside UFitness (licence rules / too heavy for the MVP).

export const PLATFORMS = [
  {
    id: 'spotify',
    name: 'Spotify',
    icon: 'musical-notes',
    color: '#1DB954',
    linkHint: 'In Spotify: Share playlist → Copy link → paste here.',
  },
  {
    id: 'appleMusic',
    name: 'Apple Music',
    icon: 'musical-note',
    color: '#FA2D48',
    linkHint: 'In Apple Music: Share playlist → Copy link → paste here.',
  },
  {
    id: 'youtubeMusic',
    name: 'YouTube Music',
    icon: 'logo-youtube',
    color: '#FF0033',
    linkHint: 'In YouTube Music: Share playlist → Copy link → paste here.',
  },
  {
    id: 'deezer',
    name: 'Deezer',
    icon: 'musical-notes-outline',
    color: '#A238FF',
    linkHint: 'In Deezer: Share playlist → Copy link → paste here.',
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    icon: 'cloud-outline',
    color: '#FF5500',
    linkHint: 'In SoundCloud: Share → Copy link → paste here.',
  },
];

// Search text matched to the student's fitness goal
export const GOAL_MUSIC = {
  hypertrophy: { query: 'gym workout afrobeats', label: 'Lift energy' },
  strength: { query: 'heavy gym workout', label: 'Heavy lifts' },
  fatloss: { query: 'hiit cardio amapiano', label: 'Cardio push' },
  endurance: { query: 'running workout mix', label: 'Run pace' },
  mobility: { query: 'calm stretch music', label: 'Slow and calm' },
};

// Quick campus picks — plain search text (playlist ids break when people delete them)
export const CAMPUS_PLAYLISTS = [
  { id: 'dorm', label: 'Dorm room', query: 'afrobeats workout' },
  { id: 'exam', label: 'Exam week', query: 'lofi study calm' },
  { id: 'gym', label: 'UJ gym day', query: 'amapiano gym' },
  { id: 'desk', label: 'Desk break', query: 'upbeat focus' },
];

// Different vibe depending where you are in the session
export const MOOD_MUSIC = [
  { id: 'warmup', query: 'warm up workout', label: 'Warm-up' },
  { id: 'push', query: 'workout hype amapiano', label: 'Hard sets' },
  { id: 'cardio', query: 'cardio running', label: 'Cardio' },
  { id: 'cooldown', query: 'cool down stretching', label: 'Cool-down' },
];

export function getPlatform(id) {
  let i = 0;
  while (i < PLATFORMS.length) {
    if (PLATFORMS[i].id === id) return PLATFORMS[i];
    i = i + 1;
  }
  // default to Spotify if somehow unknown
  return PLATFORMS[0];
}

// Which search to use based on Player phase
export function moodQueryForPhase(phase) {
  if (phase === 'ready') return MOOD_MUSIC[0].query; // warm-up
  if (phase === 'rest') return MOOD_MUSIC[3].query; // cool-down-ish
  return MOOD_MUSIC[1].query; // hard sets
}

// Build a normal https search URL
export function searchUrl(platformId, query) {
  const q = encodeURIComponent(query || 'workout');
  if (platformId === 'spotify') return 'https://open.spotify.com/search/' + q;
  if (platformId === 'appleMusic') return 'https://music.apple.com/search?term=' + q;
  if (platformId === 'youtubeMusic') return 'https://music.youtube.com/search?q=' + q;
  if (platformId === 'deezer') return 'https://www.deezer.com/search/' + q;
  if (platformId === 'soundcloud') return 'https://soundcloud.com/search?q=' + q;
  return 'https://open.spotify.com/search/' + q;
}

// Try to turn a https link into an app:// link so Spotify opens instead of Chrome
export function appLinkFromUrl(platformId, url) {
  if (!url) return null;

  if (platformId === 'spotify') {
    // example: https://open.spotify.com/playlist/ABC123
    const match = url.match(/open\.spotify\.com\/(playlist|album|track|artist)\/([a-zA-Z0-9]+)/);
    if (match) return 'spotify:' + match[1] + ':' + match[2];
  }

  if (platformId === 'appleMusic') {
    if (url.indexOf('music.apple.com') !== -1) return url;
  }

  if (platformId === 'youtubeMusic') {
    if (url.indexOf('music.youtube.com') !== -1) return url;
  }

  if (platformId === 'deezer') {
    const match = url.match(/deezer\.com\/(?:\w+\/)?(playlist|album|track)\/(\d+)/);
    if (match) return 'deezer://www.deezer.com/' + match[1] + '/' + match[2];
  }

  if (platformId === 'soundcloud') {
    if (url.indexOf('soundcloud.com') !== -1) return url;
  }

  return null;
}

// Only Spotify has a reliable search scheme on phones
export function appSearchLink(platformId, query) {
  const q = encodeURIComponent(query || 'workout');
  if (platformId === 'spotify') return 'spotify:search:' + q;
  return null;
}

// --- Spotify playlists (no login, no API key: we just open the playlist) ---
// Spotify's own editorial playlists (creator = open.spotify.com/user/spotify).
// Every id was checked on 8 Oct 2026: https://open.spotify.com/playlist/<id> → 200 with this title.
export const SPOTIFY_PLAYLISTS = [
  { id: '37i9dQZF1DX7FiQUm1UvSn', name: 'Stretching', vibe: 'warmup', label: 'Warm-up', color: '#38BDF8', icon: 'body-outline' },
  { id: '37i9dQZF1DXe6bgV3TmZOL', name: 'Heavy Workout', vibe: 'strength', label: 'Strength', color: '#EF4444', icon: 'barbell-outline' },
  { id: '37i9dQZF1DX76Wlfdnj7AP', name: 'Beast Mode', vibe: 'strength', label: 'Strength', color: '#F97316', icon: 'flame-outline' },
  { id: '37i9dQZF1DWUVpAXiEPK8P', name: 'Power Workout', vibe: 'hiit', label: 'HIIT', color: '#A855F7', icon: 'flash-outline' },
  { id: '37i9dQZF1DWSJHnPb1f0X3', name: 'Cardio', vibe: 'cardio', label: 'Cardio', color: '#EC4899', icon: 'heart-outline' },
  { id: '37i9dQZF1DX4Y1uAfxGdKJ', name: 'Electronic Running', vibe: 'cardio', label: 'Cardio', color: '#14B8A6', icon: 'walk-outline' },
  { id: '37i9dQZF1DX7vu1ck1olx9', name: 'lofi cool down', vibe: 'cooldown', label: 'Cool-down', color: '#6366F1', icon: 'snow-outline' },
  { id: '37i9dQZF1DX1in2XW8zzxO', name: 'Beast Mode Amapiano', vibe: 'amapiano', label: 'Amapiano / SA gym', color: '#22C55E', icon: 'musical-notes-outline' },
  { id: '37i9dQZF1DXd9mvqWzJEWg', name: 'GQOM Power House', vibe: 'amapiano', label: 'Gqom / SA gym', color: '#EAB308', icon: 'musical-notes-outline' },
];

/** App link + web link for one Spotify playlist. */
export function spotifyPlaylistLinks(playlistId) {
  const id = String(playlistId || '').trim();
  if (!/^[A-Za-z0-9]{22}$/.test(id)) return null;
  return { app: 'spotify:playlist:' + id, web: 'https://open.spotify.com/playlist/' + id };
}

/** Which links to try, in order: the app first on phones (https if it isn't installed), https only on web. */
export function spotifyOpenOrder(playlistId, os) {
  const links = spotifyPlaylistLinks(playlistId);
  if (!links) return [];
  return os === 'web' ? [links.web] : [links.app, links.web];
}

/** Pick a playlist vibe for a workout from its title / focus / goal. */
export function vibeForWorkout(workout) {
  const w = workout || {};
  const text = [w.title, w.focus, w.group, w.level].join(' ').toLowerCase();
  if (/stretch|mobility|yoga|recover|cool/.test(text)) return 'cooldown';
  if (/warm/.test(text)) return 'warmup';
  if (/hiit|burpee|tabata|circuit|conditioning|power|challenge/.test(text)) return 'hiit';
  if (/cardio|run|endurance|jump|sprint/.test(text)) return 'cardio';
  if (/strength|lift|push|pull|leg|arm|chest|back|shoulder|glute|upper|lower|full body|core|split/.test(text)) return 'strength';
  if (w.goal === 'fatloss') return 'hiit';
  if (w.goal === 'endurance') return 'cardio';
  if (w.goal === 'mobility') return 'cooldown';
  return 'amapiano'; // default: SA gym energy
}

export function playlistForWorkout(workout) {
  const vibe = vibeForWorkout(workout);
  return SPOTIFY_PLAYLISTS.find((item) => item.vibe === vibe) || SPOTIFY_PLAYLISTS[0];
}
