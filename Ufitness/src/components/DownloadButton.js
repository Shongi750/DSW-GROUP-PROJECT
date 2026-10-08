import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { downloadedOnLabel, formatBytes, entryBytes } from '../lib/downloads/downloadsCore';

// "Download for offline" → "Downloaded ✓" (+ remove). Used on workouts, meal plans,
// recipes and the grocery list. `dl` comes from useDownload().
export default function DownloadButton({ dl, onDownload, media = true, style, light = false }) {
  const text = light ? '#0A0A0A' : '#FFFFFF';
  const sub = light ? 'rgba(10,10,10,0.6)' : '#C9C9C9';

  if (dl.busy) {
    return (
      <View style={[styles.row, styles.pill, style]}>
        <ActivityIndicator size="small" color="#FF6A00" />
        <Text style={[styles.label, { color: text }]}>{dl.downloaded ? 'Removing…' : 'Downloading…'}</Text>
      </View>
    );
  }

  if (dl.downloaded) {
    return (
      <View style={style}>
        <View style={styles.row}>
          <View style={[styles.pill, styles.done]}>
            <Text style={styles.doneText}>Downloaded ✓</Text>
          </View>
          <Pressable onPress={dl.remove} hitSlop={8} style={styles.remove} accessibilityLabel="Remove download">
            <Ionicons name="trash-outline" size={16} color={text} />
            <Text style={[styles.removeText, { color: text }]}>Remove</Text>
          </Pressable>
        </View>
        <Text style={[styles.note, { color: sub }]}>
          {downloadedOnLabel(dl.entry.savedAt)} · {formatBytes(entryBytes(dl.entry))}
        </Text>
        {media && dl.entry.mediaSkipped ? (
          <Text style={[styles.note, { color: sub }]}>Videos download on the phone app.</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={style}>
      <Pressable onPress={onDownload} style={[styles.row, styles.pill, styles.idle]}>
        <Ionicons name="download-outline" size={18} color="#FF6A00" />
        <Text style={[styles.label, { color: text }]}>Download for offline</Text>
      </Pressable>
      {media && Platform.OS === 'web' ? (
        <Text style={[styles.note, { color: sub }]}>Videos download on the phone app.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  idle: { borderWidth: 1, borderColor: 'rgba(255,106,0,0.7)' },
  label: { fontSize: 14, fontWeight: '700' },
  done: { backgroundColor: 'rgba(34,197,94,0.18)' },
  doneText: { color: '#22C55E', fontSize: 14, fontWeight: '800' },
  remove: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 },
  removeText: { fontSize: 13, fontWeight: '600' },
  note: { marginTop: 6, fontSize: 12 },
});
