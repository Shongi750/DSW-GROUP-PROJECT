import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme, display, spacing, radius } from '../../../context/ThemeContext';
import InspoBackground from '../../../components/InspoBackground';
import { PHOTO_GLASS } from '../../../components/PhotoShell';
import MentorGate from '../components/MentorGate';

/** Mentor view of a mentee's journey — honest placeholders until cloud progress is shared. */
export default function MenteeProgressScreen({ route }) {
  const { colors } = useTheme();
  const mentorship = route.params?.mentorship || {};
  const name = mentorship.studentName || 'Mentee';
  const notes = Array.isArray(mentorship.guidance) ? mentorship.guidance : [];

  return (
    <MentorGate>
    <View style={styles.screen}>
      <InspoBackground plate="community" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>MENTEE PROGRESS</Text>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.copy}>
          {[mentorship.studentCampus, mentorship.studentGoal].filter(Boolean).join(' · ') ||
            'Campus mentee'}
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>This week</Text>
          <Text style={styles.cardBody}>
            Session and meal logs stay private to the student until they share. Use chat and
            guidance notes to check in — then log what they report here.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Focus</Text>
          <Text style={[styles.focus, { color: colors.brand }]}>
            {mentorship.studentGoal || 'General fitness'}
          </Text>
          <Text style={styles.cardBody}>
            Matched since{' '}
            {mentorship.respondedAt
              ? new Date(mentorship.respondedAt).toLocaleDateString('en-ZA')
              : 'recently'}
            .
          </Text>
        </View>

        <Text style={styles.section}>Recent guidance</Text>
        {notes.length ? (
          notes.slice(0, 5).map((note) => (
            <View key={note.id} style={styles.note}>
              <Text style={styles.noteText}>{note.text}</Text>
              <Text style={styles.noteMeta}>
                {note.createdAt ? new Date(note.createdAt).toLocaleString('en-ZA') : ''}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No guidance notes yet. Add one from Guidance.</Text>
        )}
      </ScrollView>
    </View>
    </MentorGate>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.section, paddingBottom: 40 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, color: '#FF8A1A', marginBottom: 6 },
  title: { ...display, fontSize: 32, color: '#FFFFFF' },
  copy: { color: '#C9C9C9', marginTop: 6, marginBottom: 20, fontSize: 14 },
  card: { ...PHOTO_GLASS, borderRadius: radius.card, padding: 16, marginBottom: 12 },
  cardTitle: { ...display, fontSize: 18, color: '#FFFFFF', marginBottom: 8 },
  cardBody: { color: '#C9C9C9', lineHeight: 20, fontSize: 14 },
  focus: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  section: { ...display, fontSize: 18, color: '#FFFFFF', marginTop: 12, marginBottom: 10 },
  note: { ...PHOTO_GLASS, borderRadius: radius.input, padding: 12, marginBottom: 8 },
  noteText: { color: '#FFFFFF', fontSize: 14, lineHeight: 20 },
  noteMeta: { color: '#9A9A9A', fontSize: 11, marginTop: 6 },
  empty: { color: '#C9C9C9', fontSize: 14 },
});
