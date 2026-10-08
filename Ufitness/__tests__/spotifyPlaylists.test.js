import {
  SPOTIFY_PLAYLISTS,
  spotifyPlaylistLinks,
  spotifyOpenOrder,
  playlistForWorkout,
  vibeForWorkout,
} from '../src/features/workout/data/music';

const BEAST = '37i9dQZF1DX76Wlfdnj7AP';

describe('Spotify playlist links', () => {
  test('builds the app URI and the https fallback', () => {
    expect(spotifyPlaylistLinks(BEAST)).toEqual({
      app: 'spotify:playlist:' + BEAST,
      web: 'https://open.spotify.com/playlist/' + BEAST,
    });
  });

  test('rejects ids that are not 22 letters/numbers', () => {
    expect(spotifyPlaylistLinks('')).toBeNull();
    expect(spotifyPlaylistLinks('abc')).toBeNull();
    expect(spotifyPlaylistLinks('../../evil/37i9dQZF1DX7')).toBeNull();
    expect(spotifyOpenOrder('abc', 'ios')).toEqual([]);
  });

  test('phones try the app first, then https; web only gets https', () => {
    expect(spotifyOpenOrder(BEAST, 'android')).toEqual([
      'spotify:playlist:' + BEAST,
      'https://open.spotify.com/playlist/' + BEAST,
    ]);
    expect(spotifyOpenOrder(BEAST, 'ios')[0]).toBe('spotify:playlist:' + BEAST);
    expect(spotifyOpenOrder(BEAST, 'web')).toEqual(['https://open.spotify.com/playlist/' + BEAST]);
  });

  test('every curated playlist has a valid id, name, vibe and colour', () => {
    const ids = new Set();
    SPOTIFY_PLAYLISTS.forEach((item) => {
      expect(spotifyPlaylistLinks(item.id)).not.toBeNull();
      expect(item.name).toBeTruthy();
      expect(item.color).toMatch(/^#[0-9A-F]{6}$/i);
      ids.add(item.id);
    });
    expect(ids.size).toBe(SPOTIFY_PLAYLISTS.length);
    ['warmup', 'strength', 'hiit', 'cardio', 'cooldown', 'amapiano'].forEach((vibe) => {
      expect(SPOTIFY_PLAYLISTS.some((item) => item.vibe === vibe)).toBe(true);
    });
  });
});

describe('playlist for today’s workout', () => {
  test('matches the workout type', () => {
    expect(vibeForWorkout({ title: 'HIIT Burner' })).toBe('hiit');
    expect(vibeForWorkout({ title: 'Push day', focus: 'Chest' })).toBe('strength');
    expect(vibeForWorkout({ focus: 'Cardio' })).toBe('cardio');
    expect(vibeForWorkout({ title: 'Mobility flow' })).toBe('cooldown');
    expect(vibeForWorkout({ title: 'Quick warm-up' })).toBe('warmup');
  });

  test('falls back to the goal, then SA gym energy', () => {
    expect(vibeForWorkout({ title: 'Session 3', goal: 'fatloss' })).toBe('hiit');
    expect(vibeForWorkout({ title: 'Session 3' })).toBe('amapiano');
    expect(playlistForWorkout({}).name).toBe('Beast Mode Amapiano');
    expect(playlistForWorkout({ title: 'Leg day' }).name).toBe('Heavy Workout');
  });
});
