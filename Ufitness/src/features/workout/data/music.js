// Music platforms we can hand off to. Streaming a service's catalogue inside a third-party
// app is not permitted, so we open the user's own app instead and let it own playback.

export const PLATFORMS = [
  {
    id: 'spotify',
    name: 'Spotify',
    icon: 'musical-notes',
    color: '#1DB954',
    search: (query) => `https://open.spotify.com/search/${encodeURIComponent(query)}`,
    appSearch: (query) => `spotify:search:${encodeURIComponent(query)}`,
    // open.spotify.com/playlist/ID -> spotify:playlist:ID so the app opens instead of the browser
    appUri: (url) => {
      const match = url.match(/open\.spotify\.com\/(playlist|album|track|artist)\/([a-zA-Z0-9]+)/);
      return match ? `spotify:${match[1]}:${match[2]}` : null;
    },
    linkHint: 'Share a playlist in Spotify, then paste the open.spotify.com link.',
  },
  {
    id: 'appleMusic',
    name: 'Apple Music',
    icon: 'musical-note',
    color: '#FA2D48',
    search: (query) => `https://music.apple.com/search?term=${encodeURIComponent(query)}`,
    appSearch: null,
    appUri: () => null,
    linkHint: 'Share a playlist in Apple Music, then paste the music.apple.com link.',
  },
  {
    id: 'youtubeMusic',
    name: 'YouTube Music',
    icon: 'logo-youtube',
    color: '#FF0033',
    search: (query) => `https://music.youtube.com/search?q=${encodeURIComponent(query)}`,
    appSearch: null,
    appUri: () => null,
    linkHint: 'Share a playlist in YouTube Music, then paste the music.youtube.com link.',
  },
  {
    id: 'deezer',
    name: 'Deezer',
    icon: 'musical-notes-outline',
    color: '#A238FF',
    search: (query) => `https://www.deezer.com/search/${encodeURIComponent(query)}`,
    appSearch: null,
    appUri: () => null,
    linkHint: 'Share a playlist in Deezer, then paste the deezer.com link.',
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    icon: 'cloud-outline',
    color: '#FF5500',
    search: (query) => `https://soundcloud.com/search?q=${encodeURIComponent(query)}`,
    appSearch: null,
    appUri: () => null,
    linkHint: 'Share a playlist in SoundCloud, then paste the soundcloud.com link.',
  },
];

// Search terms rather than hardcoded playlist ids, so nothing breaks when a playlist moves.
export const GOAL_MUSIC = {
  hypertrophy: { query: 'hypertrophy gym workout', label: 'Heavy, steady tempo' },
  strength: { query: 'powerlifting heavy lifting', label: 'Big lift energy' },
  fatloss: { query: 'hiit cardio workout', label: 'Fast and relentless' },
  endurance: { query: 'running intervals tempo', label: 'Interval pacing' },
  mobility: { query: 'calm stretching focus', label: 'Slow and calm' },
};

export const MOOD_MUSIC = [
  { id: 'warmup', query: 'warm up workout', label: 'Warm-up' },
  { id: 'push', query: 'workout hype', label: 'Hard sets' },
  { id: 'cardio', query: 'cardio running', label: 'Cardio' },
  { id: 'cooldown', query: 'cool down stretching', label: 'Cool-down' },
];

export function getPlatform(id) {
  return PLATFORMS.find((item) => item.id === id) || PLATFORMS[0];
}
