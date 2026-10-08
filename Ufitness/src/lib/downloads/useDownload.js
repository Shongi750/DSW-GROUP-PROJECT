import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { downloadId } from './downloadsCore';
import { removeDownload, useDownloads } from './downloadsStore';

/**
 * State for one "Download for offline" button.
 *   const dl = useDownload('recipe', meal.recipeId);
 *   dl.downloaded, dl.entry, dl.busy, dl.run(() => saveDownload(...)), dl.remove()
 */
export function useDownload(kind, refId) {
  const index = useDownloads();
  const entry = refId ? index[downloadId(kind, refId)] : null;
  const [busy, setBusy] = useState(false);

  const run = useCallback(async (save) => {
    setBusy(true);
    try {
      await save();
    } catch (error) {
      Alert.alert('Download failed', error?.message || 'Try again when you have signal.');
    } finally {
      setBusy(false);
    }
  }, []);

  const remove = useCallback(async () => {
    if (!entry) return;
    setBusy(true);
    try {
      await removeDownload(entry.id);
    } finally {
      setBusy(false);
    }
  }, [entry]);

  return { downloaded: Boolean(entry), entry, busy, run, remove };
}
