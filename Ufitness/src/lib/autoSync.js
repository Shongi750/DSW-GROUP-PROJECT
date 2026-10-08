import { AppState, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { flushQueue, onFlushed } from './syncQueue';
import { setSyncStatus } from './syncStatus';

// Watches the connection and flushes the offline queue:
//   - when the phone comes back online (NetInfo; browser online/offline events on web)
//   - when the app comes back to the foreground
// While offline the sync badge says "Offline".

let online = true;
let started = false;
let stopFns = [];
const onlineListeners = new Set();

export function isOnline() {
  return online;
}

function setOnline(next, uid) {
  const wasOffline = !online;
  online = next;
  if (wasOffline === next) onlineListeners.forEach((fn) => fn(next)); // changed
  if (!next) {
    setSyncStatus('offline');
  } else if (wasOffline) {
    flushQueue(uid, { notify: true }); // then screens reload buddies / groups / mentors
  }
}

/** Start watching for this signed-in user. Returns a stop function. */
export function startAutoSync(uid) {
  stopAutoSync();
  if (!uid) return () => {};
  started = true;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.addEventListener) {
      const goOnline = () => setOnline(true, uid);
      const goOffline = () => setOnline(false, uid);
      window.addEventListener('online', goOnline);
      window.addEventListener('offline', goOffline);
      stopFns.push(() => {
        window.removeEventListener('online', goOnline);
        window.removeEventListener('offline', goOffline);
      });
      if (typeof navigator !== 'undefined' && navigator.onLine === false) setOnline(false, uid);
    }
  } else {
    // Loaded here so web bundles don't need the native module.
    const NetInfo = require('@react-native-community/netinfo').default;
    const unsubscribe = NetInfo.addEventListener((state) => {
      // isInternetReachable is null while unknown: treat that as online.
      setOnline(Boolean(state.isConnected) && state.isInternetReachable !== false, uid);
    });
    stopFns.push(unsubscribe);
  }

  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active' && online) flushQueue(uid);
  });
  stopFns.push(() => sub.remove());

  // Anything left over from last time (e.g. app closed while offline).
  if (online) flushQueue(uid);
  return stopAutoSync;
}

export function stopAutoSync() {
  stopFns.forEach((fn) => fn());
  stopFns = [];
  started = false;
}

export function autoSyncStarted() {
  return started;
}

/** Hook: true / false as the connection changes (Downloads offline banner, offline-first screens). */
export function useOnline() {
  const [value, setValue] = useState(online);
  useEffect(() => {
    onlineListeners.add(setValue);
    setValue(online);
    return () => onlineListeners.delete(setValue);
  }, []);
  return value;
}

/** Hook: a number that goes up after each successful flush (add it to a screen's load deps). */
export function useSyncTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => onFlushed(() => setTick((value) => value + 1)), []);
  return tick;
}
