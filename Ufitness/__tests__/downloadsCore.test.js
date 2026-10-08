import {
  addOwner,
  addToIndex,
  downloadId,
  downloadedOnLabel,
  entryBytes,
  formatBytes,
  groupBySection,
  isDirectVideo,
  jsonBytes,
  mediaFileName,
  pickOfflineSource,
  recipeMediaUrls,
  releaseOwner,
  removeFromIndex,
  resolveMedia,
  totalBytes,
  workoutMediaUrls,
} from '../src/lib/downloads/downloadsCore';

const entry = (kind, refId, extra = {}) => ({
  id: downloadId(kind, refId),
  kind,
  refId,
  title: refId,
  savedAt: '2026-10-08T10:00:00.000Z',
  dataBytes: 100,
  files: [],
  ...extra,
});

describe('downloads index', () => {
  test('add replaces the same item, ignores unknown kinds, remove drops it', () => {
    let index = addToIndex({}, entry('recipe', 'pap'));
    index = addToIndex(index, entry('recipe', 'pap', { dataBytes: 300 }));
    expect(Object.keys(index)).toEqual(['recipe:pap']);
    expect(index['recipe:pap'].dataBytes).toBe(300);
    expect(addToIndex(index, { id: 'x:1', kind: 'video' })).toBe(index);
    expect(removeFromIndex(index, 'recipe:pap')).toEqual({});
    expect(removeFromIndex(index, 'nope')).toBe(index);
  });

  test('sections in order, newest first, empty sections hidden', () => {
    let index = addToIndex({}, entry('grocery', 'cheapest-weekly'));
    index = addToIndex(index, entry('workout', 'session-legs', { savedAt: '2026-10-01T00:00:00Z' }));
    index = addToIndex(index, entry('workout', 'program-full-body', { savedAt: '2026-10-08T00:00:00Z' }));
    const sections = groupBySection(index);
    expect(sections.map((s) => s.title)).toEqual(['Workouts', 'Grocery lists']);
    expect(sections[0].data.map((e) => e.refId)).toEqual(['program-full-body', 'session-legs']);
    expect(groupBySection({})).toEqual([]);
  });
});

describe('sizes', () => {
  test('entry size = JSON + media + PDF', () => {
    const e = entry('grocery', 'a', { dataBytes: 1000, pdfBytes: 500, files: [{ uri: 'f1', bytes: 2000 }] });
    expect(entryBytes(e)).toBe(3500);
    expect(entryBytes(null)).toBe(0);
  });

  test('total counts a shared picture once', () => {
    const shared = { url: 'https://x/a.gif', uri: 'file:///d/a.gif', bytes: 4000 };
    const index = {
      a: entry('workout', 'a', { files: [shared] }),
      b: entry('workout', 'b', { files: [shared, { uri: 'file:///d/b.gif', bytes: 1000 }] }),
    };
    expect(totalBytes(index)).toBe(100 + 100 + 4000 + 1000);
    expect(totalBytes(null)).toBe(0);
  });

  test('jsonBytes counts UTF-8 bytes', () => {
    expect(jsonBytes('abc')).toBe(5); // "abc" with quotes
    expect(jsonBytes('é')).toBe(4);
    expect(jsonBytes('💪')).toBe(6);
  });

  test('labels', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(3.5 * 1024 * 1024)).toBe('3.5 MB');
    expect(downloadedOnLabel('2026-10-08T10:00:00Z')).toBe('Downloaded on 8 Oct 2026');
    expect(downloadedOnLabel('')).toBe('Downloaded');
  });
});

describe('offline fallback choice', () => {
  test('online with live data → live', () => {
    expect(pickOfflineSource({ online: true, liveOk: true, hasDownload: true })).toBe('live');
  });
  test('offline with a download → download (even if built-in data loaded)', () => {
    expect(pickOfflineSource({ online: false, liveOk: true, hasDownload: true })).toBe('download');
    expect(pickOfflineSource({ online: false, liveOk: false, hasDownload: true })).toBe('download');
  });
  test('live failed while online → download if there is one', () => {
    expect(pickOfflineSource({ online: true, liveOk: false, hasDownload: true })).toBe('download');
  });
  test('nothing downloaded → old fallback', () => {
    expect(pickOfflineSource({ online: false, liveOk: false, hasDownload: false })).toBe('fallback');
    expect(pickOfflineSource({ online: false, liveOk: true, hasDownload: false })).toBe('live');
  });
});

describe('media', () => {
  test('owners: a file is only deleted when no download uses it', () => {
    const file = { uri: 'file:///d/a.gif', bytes: 10 };
    let reg = addOwner({}, 'https://x/a.gif', file, 'workout:a');
    reg = addOwner(reg, 'https://x/a.gif', file, 'workout:b');
    let out = releaseOwner(reg, 'workout:a');
    expect(out.orphans).toEqual([]);
    expect(resolveMedia(out.registry, 'https://x/a.gif')).toBe('file:///d/a.gif');
    out = releaseOwner(out.registry, 'workout:b');
    expect(out.orphans).toEqual(['file:///d/a.gif']);
    expect(resolveMedia(out.registry, 'https://x/a.gif')).toBe('https://x/a.gif');
  });

  test('file names are stable and keep the extension', () => {
    const name = mediaFileName('https://raw.githubusercontent.com/x/0.jpg?raw=1');
    expect(name).toMatch(/\.jpg$/);
    expect(mediaFileName('https://raw.githubusercontent.com/x/0.jpg?raw=1')).toBe(name);
    expect(mediaFileName('https://a/b')).toMatch(/\.bin$/);
  });

  test('what gets cached for workouts and recipes', () => {
    const workout = {
      exercises: [
        { gifUrl: 'https://g/1.gif', photoFrames: ['https://p/1a.jpg', 'https://p/1b.jpg'] },
        { gifUrl: 'https://g/1.gif', photoFrames: [] },
        { gifUrl: null },
      ],
      clips: [{ youtubeId: 'abc' }, { videoUrl: 'https://v/clip.mp4' }],
    };
    expect(workoutMediaUrls(workout)).toEqual([
      'https://g/1.gif',
      'https://p/1a.jpg',
      'https://p/1b.jpg',
      'https://i.ytimg.com/vi/abc/hqdefault.jpg',
      'https://v/clip.mp4',
    ]);
    expect(recipeMediaUrls({ image: 'https://w/pap.jpg', video: { url: 'https://v/cook.mp4' } })).toEqual([
      'https://w/pap.jpg',
      'https://v/cook.mp4',
    ]);
    expect(isDirectVideo('https://v/cook.mp4?x=1')).toBe(true);
    expect(isDirectVideo('https://youtube.com/watch?v=1')).toBe(false);
  });
});
