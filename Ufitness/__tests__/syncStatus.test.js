import {
  beginCloudWrite,
  endCloudWrite,
  getSyncStatus,
  resetSyncStatus,
  setSyncStatus,
  subscribeSyncStatus,
} from '../src/lib/syncStatus';

describe('sync status store', () => {
  beforeEach(() => resetSyncStatus());

  test('starts idle, shows saving, then synced', () => {
    expect(getSyncStatus()).toBe('idle');
    beginCloudWrite();
    expect(getSyncStatus()).toBe('saving');
    endCloudWrite(null);
    expect(getSyncStatus()).toBe('synced');
  });

  test('two saves at once: stays saving until both finish, worst result wins', () => {
    beginCloudWrite();
    beginCloudWrite();
    endCloudWrite({ code: 'PGRST205' });
    expect(getSyncStatus()).toBe('saving');
    endCloudWrite(null);
    expect(getSyncStatus()).toBe('missing');
  });

  test('a new burst starts fresh', () => {
    beginCloudWrite();
    endCloudWrite({ message: 'permission denied for table user_docs' });
    expect(getSyncStatus()).toBe('local');
    beginCloudWrite();
    endCloudWrite({ message: 'timeout' }); // network problems now show Offline (queued)
    expect(getSyncStatus()).toBe('offline');
    beginCloudWrite();
    endCloudWrite(null);
    expect(getSyncStatus()).toBe('synced');
  });

  test('listeners hear changes and can unsubscribe', () => {
    const heard = [];
    const stop = subscribeSyncStatus((s) => heard.push(s));
    setSyncStatus('local');
    stop();
    setSyncStatus('synced');
    expect(heard).toEqual(['local']);
  });
});
