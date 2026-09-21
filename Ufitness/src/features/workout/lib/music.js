import * as Linking from 'expo-linking';
import { getPlatform } from '../data/music';

// Try the platform's own app first so playback lands in the app the user is signed into,
// then fall back to the web URL, which universal links usually hand back to the app anyway.
async function openFirstAvailable(urls) {
  const candidates = urls.filter(Boolean);
  for (const url of candidates) {
    try {
      if (url.startsWith('http')) {
        await Linking.openURL(url);
        return url;
      }
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return url;
      }
    } catch {
      // Try the next candidate rather than failing the whole action.
    }
  }
  return null;
}

export async function openSearch(platformId, query) {
  const platform = getPlatform(platformId);
  return openFirstAvailable([platform.appSearch?.(query), platform.search(query)]);
}

export async function openSavedLink(platformId, url) {
  if (!url) return null;
  const platform = getPlatform(platformId);
  return openFirstAvailable([platform.appUri?.(url), url]);
}

// Saved link when the user has one, otherwise a search for something that fits the goal.
export async function openWorkoutMusic({ platformId, savedLink, query }) {
  if (savedLink) return openSavedLink(platformId, savedLink);
  return openSearch(platformId, query);
}

export function isLikelyPlaylistUrl(url = '') {
  return /^https?:\/\//i.test(url.trim());
}
