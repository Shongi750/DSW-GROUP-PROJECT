import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, display, spacing, radius } from '../../../context/ThemeContext';
import { useApp } from '../../../context/AppContext';
import InspoBackground from '../../../components/InspoBackground';
import { PHOTO_GLASS } from '../../../components/PhotoShell';
import { listActiveMentees } from '../lib/mentorRequests';
import MentorGate from '../components/MentorGate';
import EmptyState from '../../../components/EmptyState';
import { PressScale } from '../../../components/motion';
import { hapticLight } from '../../../lib/haptics';

export default function MentorMenteesScreen({ navigation }) {
  const { colors } = useTheme();
  const { profile, currentStudent } = useApp();
  const mentorId = profile.userId || currentStudent.id;
  const [rows, setRows] = useState([]);

  useFocusEffect(
    useCallback(() => {
      listActiveMentees(mentorId).then(setRows);
    }, [mentorId])
  );

  return (
    <MentorGate>
    <View style={styles.screen}>
      <InspoBackground plate="community" />
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>My Mentees</Text>
            <Text style={styles.copy}>Open progress or leave guidance for each student.</Text>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            title="No mentees yet"
            copy="Accept a request from Mentor Hub → Requests."
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.studentName}</Text>
            <Text style={styles.meta}>
              {[item.studentCampus, item.studentGoal].filter(Boolean).join(' · ') || 'Active mentee'}
            </Text>
            <View style={styles.row}>
              <PressScale
                style={[styles.btn, { backgroundColor: colors.brand }]}
                onPress={() => {
                  hapticLight();
                  navigation.navigate('MenteeProgress', { mentorship: item });
                }}
              >
                <Ionicons name="stats-chart-outline" size={16} color="#FFF" />
                <Text style={styles.btnText}>Progress</Text>
              </PressScale>
              <PressScale
                style={[styles.btn, styles.outline]}
                onPress={() => {
                  hapticLight();
                  navigation.navigate('MentorGuidance', { mentorship: item });
                }}
              >
                <Ionicons name="chatbubble-outline" size={16} color={colors.brand} />
                <Text style={[styles.btnText, { color: colors.brand }]}>Guide</Text>
              </PressScale>
              <PressScale
                style={[styles.btn, styles.outline]}
                onPress={() => {
                  hapticLight();
                  navigation.navigate('Chat', {
                    peerId: item.studentId,
                    peerName: item.studentName,
                    peerKind: 'mentee',
                  });
                }}
              >
                <Ionicons name="paper-plane-outline" size={16} color={colors.brand} />
                <Text style={[styles.btnText, { color: colors.brand }]}>Chat</Text>
              </PressScale>
            </View>
          </View>
        )}
      />
    </View>
    </MentorGate>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  list: { padding: spacing.section, paddingBottom: 40 },
  title: { ...display, fontSize: 28, color: '#FFFFFF', marginBottom: 6 },
  copy: { color: '#C9C9C9', marginBottom: 18, fontSize: 14 },
  empty: { color: '#C9C9C9', marginTop: 24, textAlign: 'center', lineHeight: 20 },
  card: { ...PHOTO_GLASS, borderRadius: radius.card, padding: 16, marginBottom: 12 },
  name: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  meta: { fontSize: 13, color: '#C9C9C9', marginTop: 4, marginBottom: 14 },
  row: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FF6A00',
  },
  btnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
});
