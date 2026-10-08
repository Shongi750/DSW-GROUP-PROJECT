import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing } from '../../context/ThemeContext';
import InspoBackground from '../../components/InspoBackground';
import { useOnline } from '../../lib/autoSync';
import {
  downloadedOnLabel,
  entryBytes,
  formatBytes,
  groupBySection,
  KINDS,
  totalBytes,
} from '../../lib/downloads/downloadsCore';
import { removeAllDownloads, removeDownload, useDownloads } from '../../lib/downloads/downloadsStore';
import { queueWorkoutAction } from '../../features/workout/lib/pendingStart';
import { openTab } from '../../navigation/nav';

// Profile → Downloads (also the download icon in the Home header).
// Everything saved for offline use, grouped by type. Tap an item to open it in its
// normal screen with the downloaded data.
export default function DownloadsScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const index = useDownloads();
  const online = useOnline();
  const sections = groupBySection(index);
  const [busyId, setBusyId] = useState('');
  const [confirmAll, setConfirmAll] = useState(false);
  const confirmTimer = useRef(null);

  useEffect(() => () => clearTimeout(confirmTimer.current), []);

  async function open(entry) {
    if (entry.kind === 'workout') {
      // The Workout tab has its own navigator: leave a note for Workout Home, then switch tabs.
      await queueWorkoutAction({ openDownload: entry.refId });
      openTab(navigation, 'Workout');
      return;
    }
    navigation.navigate('Meals', { openDownload: entry.id, at: Date.now() });
  }

  async function remove(entry) {
    setBusyId(entry.id);
    try {
      await removeDownload(entry.id);
    } finally {
      setBusyId('');
    }
  }

  // Tap twice to delete everything (Alert does nothing on web).
  async function deleteAll() {
    if (!confirmAll) {
      setConfirmAll(true);
      confirmTimer.current = setTimeout(() => setConfirmAll(false), 4000);
      return;
    }
    clearTimeout(confirmTimer.current);
    setConfirmAll(false);
    setBusyId('all');
    await removeAllDownloads();
    setBusyId('');
  }

  async function openPdf(entry) {
    try {
      const Sharing = await import('expo-sharing');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(entry.pdfUri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      }
    } catch {
      /* file missing: nothing to open */
    }
  }

  const count = Object.keys(index).length;

  const header = (
    <View>
      {!online ? (
        <View style={styles.offline}>
          <Ionicons name="cloud-offline-outline" size={18} color="#0A0A0A" />
          <Text style={styles.offlineText}>You’re offline. Downloaded items still open.</Text>
        </View>
      ) : null}
      <View style={styles.summary}>
        <View style={{ flex: 1 }}>
          <Text style={styles.summaryTitle}>{formatBytes(totalBytes(index))} used</Text>
          <Text style={styles.summarySub}>
            {count} {count === 1 ? 'download' : 'downloads'} on this {Platform.OS === 'web' ? 'browser' : 'phone'}
          </Text>
        </View>
        {count ? (
          <TouchableOpacity onPress={deleteAll} style={styles.deleteAll} disabled={busyId === 'all'}>
            {busyId === 'all' ? (
              <ActivityIndicator size="small" color="#F87171" />
            ) : (
              <Text style={styles.deleteAllText}>{confirmAll ? 'Tap again to delete all' : 'Delete all'}</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
      {Platform.OS === 'web' ? (
        <Text style={styles.note}>Videos download on the phone app. Here only the plans and lists are saved.</Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <InspoBackground plate="profile" />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="download-outline" size={44} color={colors.brand} />
            <Text style={styles.emptyTitle}>Nothing downloaded yet</Text>
            <Text style={styles.emptyBody}>
              Tap “Download for offline” on a workout, your week’s meal plan, a recipe or the grocery list. They’ll show
              up here and work without data.
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHead}>
            <Ionicons name={section.icon} size={16} color={colors.brand} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => open(item)} activeOpacity={0.8}>
            <Ionicons name={KINDS[item.kind].icon} size={22} color="#FFFFFF" />
            <View style={styles.copy}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              {item.subtitle ? <Text style={styles.caption} numberOfLines={1}>{item.subtitle}</Text> : null}
              <Text style={styles.caption}>
                {downloadedOnLabel(item.savedAt)} · {formatBytes(entryBytes(item))}
                {item.files?.length ? ` · ${item.files.length} media` : ''}
              </Text>
              {item.pdfUri ? (
                <TouchableOpacity onPress={() => openPdf(item)} style={styles.pdf} hitSlop={6}>
                  <Ionicons name="document-text-outline" size={14} color={colors.brand} />
                  <Text style={styles.pdfText}>Open PDF</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity onPress={() => remove(item)} hitSlop={10} disabled={Boolean(busyId)} accessibilityLabel="Delete download">
              {busyId === item.id ? (
                <ActivityIndicator size="small" color="#F87171" />
              ) : (
                <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.7)" />
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'transparent' },
    content: { padding: spacing.screen, paddingBottom: 100 },
    offline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#FACC15',
      borderRadius: 12,
      padding: 10,
      marginBottom: 12,
    },
    offlineText: { color: '#0A0A0A', fontWeight: '700', fontSize: 13, flex: 1 },
    summary: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      marginBottom: 8,
    },
    summaryTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
    summarySub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
    deleteAll: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: '#F87171' },
    deleteAllText: { color: '#F87171', fontWeight: '800', fontSize: 13 },
    note: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 8 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18, marginBottom: 8 },
    sectionTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    copy: { flex: 1 },
    title: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    caption: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
    pdf: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    pdfText: { color: colors.brand, fontWeight: '700', fontSize: 12 },
    empty: { alignItems: 'center', marginTop: 48, paddingHorizontal: 16 },
    emptyTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginTop: 12 },
    emptyBody: { color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6 },
  });
}
