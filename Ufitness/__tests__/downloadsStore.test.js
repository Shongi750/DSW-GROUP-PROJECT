/* eslint-disable import/first -- the mocks must be set up before the imports below */
// downloadsStore with the AsyncStorage mock and a fake expo-file-system (phone build).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockFiles = new Map(); // uri -> size
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///docs/',
  makeDirectoryAsync: jest.fn(async () => {}),
  getInfoAsync: jest.fn(async (uri) => ({ exists: mockFiles.has(uri), size: mockFiles.get(uri) || 0 })),
  downloadAsync: jest.fn(async (url, uri) => {
    if (url.includes('broken')) throw new Error('Network request failed');
    mockFiles.set(uri, url.endsWith('.mp4') ? 50000 : 2000);
    return { uri, status: 200 };
  }),
  copyAsync: jest.fn(async ({ to }) => {
    mockFiles.set(to, 8000);
  }),
  deleteAsync: jest.fn(async (uri) => {
    [...mockFiles.keys()].forEach((key) => key.startsWith(uri) && mockFiles.delete(key));
  }),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import {
  getDownload,
  latestDownload,
  loadDownloads,
  localMediaUri,
  removeAllDownloads,
  removeDownload,
  resetDownloadsCache,
  saveDownload,
  storageUsed,
} from '../src/lib/downloads/downloadsStore';

beforeEach(async () => {
  await AsyncStorage.clear();
  mockFiles.clear();
  resetDownloadsCache();
  jest.clearAllMocks();
});

const workout = (id, gif) => ({
  kind: 'workout',
  refId: id,
  title: id,
  data: { id, exercises: [{ id: 'squat', name: 'Squat', gifUrl: gif }] },
  media: [gif, 'https://cdn/broken.gif'],
});

test('saves JSON + media files, skips media that fails, and reports sizes', async () => {
  const entry = await saveDownload(workout('session-legs', 'https://cdn/squat.gif'));
  expect(entry.id).toBe('workout:session-legs');
  expect(entry.files).toHaveLength(1); // broken.gif skipped
  expect(entry.files[0].uri).toMatch(/^file:\/\/\/docs\/downloads\/media\/.+\.gif$/);
  expect(entry.dataBytes).toBeGreaterThan(0);
  expect(localMediaUri('https://cdn/squat.gif')).toBe(entry.files[0].uri);
  expect(localMediaUri('https://cdn/other.gif')).toBe('https://cdn/other.gif');

  const saved = await getDownload('workout', 'session-legs');
  expect(saved.data.exercises[0].name).toBe('Squat');
  expect(await storageUsed()).toBe(entry.dataBytes + 2000);
});

test('a shared GIF is downloaded once and kept until the last owner is removed', async () => {
  const a = await saveDownload(workout('session-legs', 'https://cdn/squat.gif'));
  await saveDownload(workout('program-full-body', 'https://cdn/squat.gif'));
  expect(FileSystem.downloadAsync).toHaveBeenCalledTimes(3); // squat once + broken twice
  const uri = a.files[0].uri;

  await removeDownload('workout:session-legs');
  expect(mockFiles.has(uri)).toBe(true);
  expect(await getDownload('workout', 'session-legs')).toBeNull();

  await removeDownload('workout:program-full-body');
  expect(mockFiles.has(uri)).toBe(false);
  expect(await loadDownloads()).toEqual({});
});

test('grocery list keeps a PDF copy; delete all clears files and index', async () => {
  const entry = await saveDownload({
    kind: 'grocery',
    refId: 'cheapest-weekly',
    title: 'Grocery list',
    data: { items: [{ id: 'maize', name: 'Maize meal' }] },
    makePdf: async () => 'file:///cache/print.pdf',
  });
  expect(entry.pdfUri).toBe('file:///docs/downloads/pdf/grocery_cheapest-weekly.pdf');
  expect(entry.pdfBytes).toBe(8000);

  await removeAllDownloads();
  expect(await loadDownloads()).toEqual({});
  expect(mockFiles.size).toBe(0);
  expect(await AsyncStorage.getItem('ufitness.downloads.data.grocery:cheapest-weekly')).toBeNull();
});

test('latestDownload picks the newest of a kind (offline meal plan)', async () => {
  await saveDownload({ kind: 'mealPlan', refId: 'week-400-bulk', title: 'A', data: { budget: 400 } });
  await new Promise((resolve) => setTimeout(resolve, 5));
  await saveDownload({ kind: 'mealPlan', refId: 'week-300-cut', title: 'B', data: { budget: 300 } });
  const latest = await latestDownload('mealPlan');
  expect(latest.data.budget).toBe(300);
  expect(await latestDownload('recipe')).toBeNull();
});

test('index survives an app restart', async () => {
  await saveDownload(workout('session-arms', 'https://cdn/curl.gif'));
  resetDownloadsCache(); // like a cold start
  const index = await loadDownloads();
  expect(Object.keys(index)).toEqual(['workout:session-arms']);
});
