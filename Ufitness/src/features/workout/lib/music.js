import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { appLinkFromUrl, appSearchLink, searchUrl, spotifyOpenOrder } from '../data/music';

// Try each URL until one opens. If the app isn't installed we fall back to https.
async function openFirst(urls) {
  let i = 0;
  while (i < urls.length) {
    const url = urls[i];
    i = i + 1;
    if (!url) continue;

    try {
      // web / https always just open
      if (url.indexOf('http') === 0) {
        await Linking.openURL(url);
        return url;
      }

      // app schemes like spotify: — skip on web, they don't work there
      if (Platform.OS === 'web') continue;

      const ok = await Linking.canOpenURL(url);
      if (ok) {
        await Linking.openURL(url);
        return url;
      }
    } catch (e) {
      // that one failed, try the next
    }
  }
  return null;
}

export async function openSearch(platformId, query) {
  const app = appSearchLink(platformId, query);
  const web = searchUrl(platformId, query);
  return openFirst([app, web]);
}

export async function openSavedLink(platformId, url) {
  if (!url) return null;
  const app = appLinkFromUrl(platformId, url);
  return openFirst([app, url]);
}

// Open one of the curated Spotify playlists: app first, https if it isn't installed (https only on web).
export async function openSpotifyPlaylist(playlistId) {
  return openFirst(spotifyOpenOrder(playlistId, Platform.OS));
}

// Prefer their saved playlist; otherwise open a search
export async function openWorkoutMusic(options) {
  const platformId = (options && options.platformId) || 'spotify';
  const savedLink = (options && options.savedLink) || '';
  const query = (options && options.query) || 'workout';

  if (savedLink) {
    const opened = await openSavedLink(platformId, savedLink);
    if (opened) return opened;
  }
  return openSearch(platformId, query);
}

// Very basic check — just needs to look like a normal link
export function isLikelyPlaylistUrl(url) {
  if (!url) return false;
  const text = String(url).trim();
  if (text.indexOf('http://') === 0) return true;
  if (text.indexOf('https://') === 0) return true;
  return false;
}
