import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../context/ThemeContext';
import { useApp } from '../../../context/AppContext';
import { SEED_STUDENTS } from '../data/usageSeed';
import { loadLiveUsage } from '../lib/liveUsage';
import { mergeCloudStudents, mergeLiveStudent, recommendMentors } from '../lib/recommendMentors';
import { loadAdminState, sendMentorInvite } from '../lib/adminStore';
import AdminGate from '../components/AdminGate';

export default function MentorPipelineScreen({ navigation }) {
  const { colors } = useTheme();
  const { profile } = useApp();
  const [workoutProfile, setWorkoutProfile] = useState({});
  const [invites, setInvites] = useState([]);
  const [cloudStudents, setCloudStudents] = useState([]);

  const refresh = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('workoutapp.profile.v1');
      setWorkoutProfile(raw ? JSON.parse(raw) : {});
    } catch {
      setWorkoutProfile({});
    }
    const admin = await loadAdminState();
    setInvites(admin.invites);
    const usage = await loadLiveUsage();
    setCloudStudents(usage.students || []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const students = mergeLiveStudent(mergeCloudStudents(SEED_STUDENTS, cloudStudents), profile, workoutProfile);
  const blocked = invites.filter((row) => row.status !== 'declined').map((row) => row.studentId);
  const recommended = recommendMentors(students, blocked);

  const invite = async (student) => {
    const next = await sendMentorInvite(student);
    setInvites(next.invites);
    Alert.alert('Invite sent', `${student.name} will see: “${student.inviteMessage}”`);
  };

  return (
    <AdminGate navigation={navigation}>
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[styles.title, { color: colors.text }]}>Mentor pipeline</Text>
        <Text style={[styles.copy, { color: colors.muted }]}>
          AI only recommends after satisfactory results and 3rd year or above. You send the ask — the student accepts.
        </Text>

        {recommended.length ? (
          recommended.map((student) => (
            <View key={student.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.top}>
                <Text style={[styles.name, { color: colors.text }]}>{student.name}</Text>
                {student.live ? <Text style={styles.live}>This device</Text> : null}
              </View>
              <Text style={[styles.meta, { color: colors.muted }]}>
                {student.campus} · {student.yearOfStudy || 'Year not set'} · {student.goal}
              </Text>
              <Text style={[styles.why, { color: colors.text }]}>{student.inviteMessage}</Text>
              <TouchableOpacity style={styles.send} onPress={() => invite(student)}>
                <Ionicons name="send-outline" size={16} color="#fff" />
                <Text style={styles.sendText}>Send mentor request</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={[styles.copy, { color: colors.muted }]}>
            No new recommendations. Either invites are already out, or nobody has hit the year + results bar yet.
          </Text>
        )}

        <Text style={[styles.section, { color: colors.text }]}>Sent requests</Text>
        {invites.length ? (
          invites.map((row) => (
            <View key={row.id} style={[styles.sent, { backgroundColor: colors.overlay }]}>
              <Text style={[styles.name, { color: colors.text }]}>{row.studentName}</Text>
              <Text style={[styles.meta, { color: colors.muted }]}>
                {row.status} · {(row.reasons || []).join(', ')}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.copy, { color: colors.muted }]}>None sent yet.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
    </AdminGate>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800' },
  copy: { fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 14 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: '800' },
  live: { fontSize: 11, fontWeight: '800', color: '#0F766E' },
  meta: { fontSize: 12, marginTop: 4 },
  why: { fontSize: 14, lineHeight: 20, marginTop: 10, fontWeight: '600' },
  send: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#8C3A12',
    borderRadius: 10,
    paddingVertical: 11,
  },
  sendText: { color: '#fff', fontWeight: '800' },
  section: { fontSize: 18, fontWeight: '800', marginTop: 10, marginBottom: 8 },
  sent: { borderRadius: 12, padding: 12, marginBottom: 8 },
});
