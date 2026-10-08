import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addOwner,
  addToIndex,
  downloadId,
  jsonBytes,
  mediaFileName,
  releaseOwner,
  removeFromIndex,
  resolveMedia,
  totalBytes,
  uniqueUrls,
} from './downloadsCore';

// Downloads for offline use.
//   - Index of downloads:   AsyncStorage 'ufitness.downloads.v1'
//   - Each item's JSON:      AsyncStorage 'ufitness.downloads.data.<id>'
//   - Media + PDFs (phone):  FileSystem.documentDirectory + 'downloads/'
//   - Which media file is used by which download: 'ufitness.downloads.media.v1'
// On web only the JSON is saved (no files), so videos/photos still need internet there.

const INDEX_KEY = 'ufitness.downloads.v1';
const MEDIA_KEY = 'ufitness.downloads.media.v1';
const DATA_PREFIX = 'ufitness.downloads.data.';

let index = null;
let registry = null;
const listeners = new Set();

// Loaded lazily so the web bundle never touches the native module.
function fileSystem() {
  if (Platform.OS === 'web') return null;
  try {
    const FileSystem = require('expo-file-system/legacy');
    return FileSystem.documentDirectory ? FileSystem : null;
  } catch {
    return null;
  }
}

/** True on the phone app: media and PDFs can be saved as files. */
export function canSaveFiles() {
  return Boolean(fileSystem());
}

function downloadsDir() {
  const FileSystem = fileSystem();
  return FileSystem ? `${FileSystem.documentDirectory}downloads/` : null;
}

async function readJson(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : fallback;
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

async function load() {
  if (!index) index = await readJson(INDEX_KEY, {});
  if (!registry) registry = await readJson(MEDIA_KEY, {});
}

async function persist() {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index || {}));
  await AsyncStorage.setItem(MEDIA_KEY, JSON.stringify(registry || {}));
  listeners.forEach((fn) => fn(index));
}

export async function loadDownloads() {
  await load();
  return index;
}

/** Read the saved data for one download (null when it isn't downloaded). */
export async function getDownload(kind, refId) {
  await load();
  const id = downloadId(kind, refId);
  if (!index[id]) return null;
  const data = await readJson(DATA_PREFIX + id, null);
  return data ? { entry: index[id], data } : null;
}

/** Newest download of a kind (e.g. the latest meal plan when offline). */
export async function latestDownload(kind) {
  await load();
  const newest = Object.values(index)
    .filter((entry) => entry.kind === kind)
    .sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)))[0];
  return newest ? getDownload(kind, newest.refId) : null;
}

export async function isDownloaded(kind, refId) {
  await load();
  return Boolean(index[downloadId(kind, refId)]);
}

/** Save one media file (or reuse it if another download already has it). */
async function cacheMediaFile(url, ownerId) {
  const FileSystem = fileSystem();
  if (!FileSystem) return null;
  const existing = registry[url];
  if (existing?.uri) {
    const info = await FileSystem.getInfoAsync(existing.uri).catch(() => null);
    if (info?.exists) {
      registry = addOwner(registry, url, existing, ownerId);
      return { url, uri: existing.uri, bytes: existing.bytes };
    }
  }
  const dir = `${downloadsDir()}media/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
  const target = dir + mediaFileName(url);
  // Same link → same file name, so a file left from an earlier download is reused.
  const already = await FileSystem.getInfoAsync(target, { size: true }).catch(() => null);
  if (already?.exists && already.size) {
    const file = { url, uri: target, bytes: already.size };
    registry = addOwner(registry, url, file, ownerId);
    return file;
  }
  const result = await FileSystem.downloadAsync(url, target);
  if (result.status && result.status >= 400) {
    await FileSystem.deleteAsync(target, { idempotent: true }).catch(() => {});
    return null;
  }
  const info = await FileSystem.getInfoAsync(target, { size: true });
  const file = { url, uri: target, bytes: info?.size || 0 };
  registry = addOwner(registry, url, file, ownerId);
  return file;
}

/**
 * Save something for offline use.
 *   kind / refId  what it is ('workout' + 'legs', 'recipe' + 'pap', …)
 *   data          the JSON the normal screen needs
 *   media         http links to save as files (phone only)
 *   makePdf       optional async () => file uri of a PDF to keep (phone only)
 * Media that fails to download is skipped; the JSON is still saved.
 */
export async function saveDownload({ kind, refId, title, subtitle = '', data, media = [], makePdf }) {
  await load();
  const id = downloadId(kind, refId);
  const FileSystem = fileSystem();
  const files = [];

  if (FileSystem) {
    // Re-downloading: forget the old media first (files still used elsewhere stay).
    const released = releaseOwner(registry, id);
    registry = released.registry;
    for (const url of uniqueUrls(media)) {
      try {
        const file = await cacheMediaFile(url, id);
        if (file) files.push(file);
      } catch {
        /* no signal for this one file: skip it */
      }
    }
    await Promise.all(
      released.orphans
        .filter((uri) => !files.some((file) => file.uri === uri))
        .map((uri) => FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {}))
    );
  }

  let pdfUri = null;
  let pdfBytes = 0;
  if (FileSystem && makePdf) {
    try {
      const tmp = await makePdf();
      const dir = `${downloadsDir()}pdf/`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
      pdfUri = `${dir}${id.replace(/[^a-z0-9-]/gi, '_')}.pdf`;
      await FileSystem.deleteAsync(pdfUri, { idempotent: true }).catch(() => {});
      await FileSystem.copyAsync({ from: tmp, to: pdfUri });
      pdfBytes = (await FileSystem.getInfoAsync(pdfUri, { size: true }))?.size || 0;
    } catch {
      pdfUri = null;
    }
  }

  const entry = {
    id,
    kind,
    refId: String(refId),
    title: title || 'Download',
    subtitle,
    savedAt: new Date().toISOString(),
    dataBytes: jsonBytes(data),
    files,
    pdfUri,
    pdfBytes,
    mediaSkipped: !FileSystem && uniqueUrls(media).length > 0,
  };
  await AsyncStorage.setItem(DATA_PREFIX + id, JSON.stringify(data));
  index = addToIndex(index, entry);
  await persist();
  return entry;
}

/** Delete one download and any files only it was using. */
export async function removeDownload(id) {
  await load();
  const entry = index[id];
  const FileSystem = fileSystem();
  const released = releaseOwner(registry, id);
  registry = released.registry;
  if (FileSystem) {
    const doomed = [...released.orphans, entry?.pdfUri].filter(Boolean);
    await Promise.all(doomed.map((uri) => FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {})));
  }
  await AsyncStorage.removeItem(DATA_PREFIX + id);
  index = removeFromIndex(index, id);
  await persist();
}

export async function removeAllDownloads() {
  await load();
  const ids = Object.keys(index);
  const FileSystem = fileSystem();
  if (FileSystem) await FileSystem.deleteAsync(downloadsDir(), { idempotent: true }).catch(() => {});
  await Promise.all(ids.map((id) => AsyncStorage.removeItem(DATA_PREFIX + id)));
  index = {};
  registry = {};
  await persist();
}

export async function storageUsed() {
  await load();
  return totalBytes(index);
}

/** Local file for a picture/video link if it was downloaded (sync; null-safe). */
export function localMediaUri(url) {
  return resolveMedia(registry, url);
}

export function subscribeDownloads(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Hook: the download index (re-renders when something is added or removed). */
export function useDownloads() {
  const [state, setState] = useState(index || {});
  useEffect(() => {
    let alive = true;
    loadDownloads().then((value) => alive && setState({ ...value }));
    const stop = subscribeDownloads((value) => setState({ ...value }));
    return () => {
      alive = false;
      stop();
    };
  }, []);
  return state;
}

/** Hook: link → local file once the media list has loaded. */
export function useLocalMedia(url) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!registry) loadDownloads().then(() => setTick((value) => value + 1));
    return subscribeDownloads(() => setTick((value) => value + 1));
  }, []);
  return url ? localMediaUri(url) : url;
}

/** Test helper: forget the in-memory copy. */
export function resetDownloadsCache() {
  index = null;
  registry = null;
}
