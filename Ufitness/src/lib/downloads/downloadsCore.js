// Downloads for offline use — the pure part (no storage, no files), so it's easy to test.
//
// index    = { [id]: entry }   (kept in AsyncStorage by downloadsStore.js)
// entry    = { id, kind, refId, title, subtitle, savedAt, dataBytes, files: [{ url, uri, bytes }],
//              pdfUri, pdfBytes, mediaSkipped }
// registry = { [url]: { uri, bytes, owners: [downloadId] } }  (media files shared between downloads)

export const KINDS = {
  workout: { section: 'Workouts', icon: 'barbell-outline' },
  mealPlan: { section: 'Meal plans', icon: 'calendar-outline' },
  recipe: { section: 'Recipes', icon: 'restaurant-outline' },
  grocery: { section: 'Grocery lists', icon: 'cart-outline' },
};

export const SECTION_ORDER = ['workout', 'mealPlan', 'recipe', 'grocery'];

export function downloadId(kind, refId) {
  return `${kind}:${refId}`;
}

/** Rough size of the saved JSON in bytes (UTF-8). */
export function jsonBytes(data) {
  try {
    const text = JSON.stringify(data ?? null);
    let bytes = 0;
    for (let i = 0; i < text.length; i += 1) {
      const code = text.charCodeAt(i);
      if (code >= 0xdc00 && code <= 0xdfff) continue; // 2nd half of an emoji: counted below
      bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code >= 0xd800 && code <= 0xdbff ? 4 : 3;
    }
    return bytes;
  } catch {
    return 0;
  }
}

/** Add or replace one download. Returns a new index. */
export function addToIndex(index, entry) {
  if (!entry?.id || !KINDS[entry.kind]) return index || {};
  return { ...(index || {}), [entry.id]: entry };
}

export function removeFromIndex(index, id) {
  if (!index?.[id]) return index || {};
  const next = { ...index };
  delete next[id];
  return next;
}

/** Size of one download: its JSON + its media files + its PDF. */
export function entryBytes(entry) {
  if (!entry) return 0;
  const media = (entry.files || []).reduce((sum, file) => sum + (Number(file.bytes) || 0), 0);
  return (Number(entry.dataBytes) || 0) + media + (Number(entry.pdfBytes) || 0);
}

/**
 * Storage used by everything. A picture shared by two downloads is only counted once
 * (it is one file on the phone).
 */
export function totalBytes(index) {
  const seen = new Set();
  let total = 0;
  Object.values(index || {}).forEach((entry) => {
    total += (Number(entry.dataBytes) || 0) + (Number(entry.pdfBytes) || 0);
    (entry.files || []).forEach((file) => {
      const key = file.uri || file.url;
      if (seen.has(key)) return;
      seen.add(key);
      total += Number(file.bytes) || 0;
    });
  });
  return total;
}

/** Sections for the Downloads screen, newest first inside each section. Empty sections are left out. */
export function groupBySection(index) {
  const entries = Object.values(index || {});
  return SECTION_ORDER.map((kind) => ({
    kind,
    title: KINDS[kind].section,
    icon: KINDS[kind].icon,
    data: entries
      .filter((entry) => entry.kind === kind)
      .sort((a, b) => String(b.savedAt || '').localeCompare(String(a.savedAt || ''))),
  })).filter((section) => section.data.length);
}

export function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function downloadedOnLabel(savedAt) {
  const date = new Date(savedAt);
  if (!savedAt || Number.isNaN(date.getTime())) return 'Downloaded';
  return `Downloaded on ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Which copy a screen should show.
 *   'live'     → online and the live data loaded
 *   'download' → offline (or live failed) and there is a downloaded copy
 *   'fallback' → nothing downloaded: use the old built-in fallback (or show the error)
 */
export function pickOfflineSource({ online = true, liveOk = false, hasDownload = false } = {}) {
  if (online && liveOk) return 'live';
  if (hasDownload) return 'download';
  return liveOk ? 'live' : 'fallback';
}

// --- media ---------------------------------------------------------------

export function isCacheableUrl(url) {
  return /^https?:\/\//i.test(String(url || ''));
}

export function isDirectVideo(url) {
  return isCacheableUrl(url) && /\.(mp4|m4v|mov|webm)(\?|#|$)/i.test(String(url));
}

/** Unique http(s) links, in order. */
export function uniqueUrls(list) {
  const seen = new Set();
  return (list || []).filter((url) => {
    if (!isCacheableUrl(url) || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

/** Stable short file name for a link (same link → same file). */
export function mediaFileName(url) {
  const text = String(url || '');
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) hash = ((hash * 33) ^ text.charCodeAt(i)) >>> 0;
  const ext = (text.split(/[?#]/)[0].match(/\.([a-z0-9]{2,4})$/i) || [])[1] || 'bin';
  return `${hash.toString(36)}-${text.length}.${ext.toLowerCase()}`;
}

/** Remember that a download uses this media file. */
export function addOwner(registry, url, file, ownerId) {
  const current = registry?.[url];
  const owners = new Set(current?.owners || []);
  owners.add(ownerId);
  return {
    ...(registry || {}),
    [url]: { uri: file?.uri || current?.uri, bytes: Number(file?.bytes ?? current?.bytes) || 0, owners: [...owners] },
  };
}

/**
 * A download was removed: drop it from every media file.
 * Files nobody uses any more are returned so the caller can delete them.
 */
export function releaseOwner(registry, ownerId) {
  const next = {};
  const orphans = [];
  Object.entries(registry || {}).forEach(([url, file]) => {
    const owners = (file.owners || []).filter((id) => id !== ownerId);
    if (owners.length) next[url] = { ...file, owners };
    else orphans.push(file.uri);
  });
  return { registry: next, orphans: orphans.filter(Boolean) };
}

/** Local file for a link, or the link itself when it wasn't downloaded. */
export function resolveMedia(registry, url) {
  return registry?.[url]?.uri || url;
}

// --- what to cache for each kind -------------------------------------------

export function youtubeThumb(id) {
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

/** Media links worth saving for a workout: exercise GIFs / photos and clip videos (thumbnails for YouTube). */
export function workoutMediaUrls(workout) {
  const urls = [];
  (workout?.exercises || []).forEach((exercise) => {
    urls.push(exercise.gifUrl, ...(exercise.photoFrames || []));
  });
  (workout?.clips || []).forEach((clip) => {
    urls.push(clip.videoUrl, clip.thumbnail, youtubeThumb(clip.youtubeId));
  });
  return uniqueUrls(urls);
}

/** Media links for a recipe: the photo, a direct cook video file, or the YouTube thumbnail. */
export function recipeMediaUrls(recipe) {
  const video = recipe?.video || {};
  return uniqueUrls([recipe?.image, video.url, youtubeThumb(video.youtubeId)]);
}

export function mealPlanMediaUrls(plan) {
  const urls = [];
  Object.values(plan?.mealsByDay || {}).forEach((meals) => (meals || []).forEach((meal) => urls.push(meal.image)));
  return uniqueUrls(urls);
}
