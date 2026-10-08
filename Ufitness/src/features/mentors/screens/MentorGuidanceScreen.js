/**
 * MentorGuidanceScreen — short weekly notes stored on the mentorship record.
 * addGuidanceNote writes to mentorRequests; mentee sees history on MenteeProgress.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, display, spacing, radius } from '../../../context/ThemeContext';
import { useApp } from '../../../context/AppContext';
import InspoBackground from '../../../components/InspoBackground';
import { PHOTO_GLASS } from '../../../components/PhotoShell';
import { addGuidanceNote, listActiveMentees } from '../lib/mentorRequests';
import MentorGate from '../components/MentorGate';

const QUICK = [
  '3 campus sessions this week — keep it simple.',
  'Hit protein at breakfast before lectures.',
  'Form first on squats; film one set for me.',
  'Rest day is training too. Walk APK loop.',
];

export default function MentorGuidanceScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { profile, currentStudent } = useApp();
  const mentorId = profile.userId || currentStudent.id;
  const preselected = route.params?.mentorship || null;
  const [mentees, setMentees] = useState([]);
  const [selectedId, setSelectedId] = useState(preselected?.id || '');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    const rows = await listActiveMentees(mentorId);
    setMentees(rows);
    if (!selectedId && rows[0]) setSelectedId(rows[0].id);
  }, [mentorId, selectedId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const selected = useMemo(
    () => mentees.find((row) => row.id === selectedId) || preselected,
    [mentees, selectedId, preselected]
  );
  const notes = Array.isArray(selected?.guidance) ? selected.guidance : [];

  const send = async () => {
    if (!selected?.id || !text.trim()) return;
    setSaving(true);
    let updated = null;
    try {
      updated = await addGuidanceNote(selected.id, text, profile.name || 'Mentor');
    } catch (error) {
      Alert.alert('Could not save note', error.message);
    } finally {
      setSaving(false);
    }
    if (!updated) return;
    setText('');
    await reload();
    Alert.alert('Saved', `Guidance noted for ${selected.studentName}.`);
  };

  return (
    <MentorGate>
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <InspoBackground plate="community" />
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Guidance</Text>
            <Text style={styles.copy}>Short check-ins your mentee can act on this week.</Text>

            <Text style={styles.label}>Mentee</Text>
            <View style={styles.chipRow}>
              {mentees.map((row) => {
                const on = row.id === selected?.id;
                return (
                  <TouchableOpacity
                    key={row.id}
                    style={[styles.chip, on && { backgroundColor: colors.brand, borderColor: colors.brand }]}
                    onPress={() => setSelectedId(row.id)}
                  >
                    <Text style={[styles.chipText, on && { color: '#FFF' }]}>{row.studentName}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {!mentees.length ? (
              <Text style={styles.empty}>Accept a mentee first from Requests.</Text>
            ) : null}

            <Text style={styles.label}>Quick tips</Text>
            <View style={styles.chipRow}>
              {QUICK.map((tip) => (
                <TouchableOpacity key={tip} style={styles.chip} onPress={() => setText(tip)}>
                  <Text style={styles.chipText} numberOfLines={2}>
                    {tip}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder={selected ? `Note for ${selected.studentName}…` : 'Pick a mentee…'}
              placeholderTextColor="#9A9A9A"
              value={text}
              onChangeText={setText}
              multiline
              editable={Boolean(selected)}
            />
            <TouchableOpacity
              style={[styles.send, { backgroundColor: colors.brand, opacity: !text.trim() || saving ? 0.5 : 1 }]}
              disabled={!text.trim() || saving || !selected}
              onPress={send}
            >
              <Text style={styles.sendText}>Save guidance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.link}
              onPress={() =>
                selected
                  ? navigation.navigate('MenteeProgress', { mentorship: selected })
                  : null
              }
            >
              <Text style={[styles.linkText, { color: colors.brand }]}>View mentee progress</Text>
            </TouchableOpacity>

            <Text style={styles.section}>History</Text>
          </>
        }
        ListEmptyComponent={
          selected ? <Text style={styles.empty}>No notes yet for this mentee.</Text> : null
        }
        renderItem={({ item }) => (
          <View style={styles.note}>
            <Text style={styles.noteText}>{item.text}</Text>
            <Text style={styles.noteMeta}>
              {item.createdAt ? new Date(item.createdAt).toLocaleString('en-ZA') : ''}
            </Text>
          </View>
        )}
      />
    </KeyboardAvoidingView>
    </MentorGate>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  list: { padding: spacing.section, paddingBottom: 100 },
  title: { ...display, fontSize: 28, color: '#FFFFFF', marginBottom: 6 },
  copy: { color: '#C9C9C9', marginBottom: 16, fontSize: 14 },
  label: { color: '#FFB27A', fontWeight: '800', fontSize: 12, letterSpacing: 0.8, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    ...PHOTO_GLASS,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  chipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  input: {
    ...PHOTO_GLASS,
    borderRadius: radius.input,
    minHeight: 96,
    padding: 14,
    color: '#FFFFFF',
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  send: { borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  sendText: { color: '#FFF', fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  link: { alignItems: 'center', paddingVertical: 8, marginBottom: 12 },
  linkText: { fontWeight: '800' },
  section: { ...display, fontSize: 18, color: '#FFFFFF', marginBottom: 10 },
  note: { ...PHOTO_GLASS, borderRadius: radius.input, padding: 12, marginBottom: 8 },
  noteText: { color: '#FFFFFF', fontSize: 14, lineHeight: 20 },
  noteMeta: { color: '#9A9A9A', fontSize: 11, marginTop: 6 },
  empty: { color: '#C9C9C9', marginBottom: 12 },
});
