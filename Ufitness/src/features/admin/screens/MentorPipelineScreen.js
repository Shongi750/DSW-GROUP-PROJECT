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

const display = { fontFamily: 'Anton_400Regular', letterSpacing: 0.8 };

export default function MentorPipelineScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { profile } = useApp();
  const styles = createStyles(colors, isDark);
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
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>Mentor Pipeline</Text>
        <Text style={styles.copy}>
          AI only recommends after satisfactory results and 3rd year or above. You send the ask — the student accepts.
        </Text>

        {recommended.length ? (
          recommended.map((student) => (
            <View key={student.id} style={styles.card}>
              <View style={styles.top}>
                <Text style={styles.name}>{student.name}</Text>
                {student.live ? <Text style={styles.live}>This device</Text> : null}
              </View>
              <Text style={styles.meta}>
                {student.campus} · {student.yearOfStudy || 'Year not set'} · {student.goal}
              </Text>
              <Text style={styles.why}>{student.inviteMessage}</Text>
              <TouchableOpacity style={styles.send} onPress={() => invite(student)}>
                <Ionicons name="send-outline" size={16} color="#FFFFFF" />
                <Text style={styles.sendText}>Send mentor request</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.copy}>
            No new recommendations. Either invites are already out, or nobody has hit the year + results bar yet.
          </Text>
        )}

        <Text style={styles.section}>Sent Requests</Text>
        {invites.length ? (
          invites.map((row) => (
            <View key={row.id} style={[styles.sent, { backgroundColor: colors.overlay }]}>
              <Text style={styles.name}>{row.studentName}</Text>
              <Text style={styles.meta}>
                {row.status} · {(row.reasons || []).join(', ')}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.copy}>None sent yet.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
    </AdminGate>
  );
}

function createStyles(colors, isDark) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    body: { padding: 16, paddingBottom: 40 },
    title: { ...display, fontSize: 27, color: colors.text, textTransform: 'uppercase' },
    copy: { fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 14, color: colors.muted },
    card: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
    },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    name: { fontSize: 16, fontWeight: '800', color: colors.text },
    live: {
      fontSize: 11,
      fontWeight: '800',
      color: isDark ? '#5EEAD4' : '#0F766E',
      backgroundColor: isDark ? 'rgba(20,184,166,0.16)' : '#CFF3EC',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      overflow: 'hidden',
    },
    meta: { fontSize: 12, marginTop: 4, color: colors.muted },
    why: { fontSize: 14, lineHeight: 20, marginTop: 10, fontWeight: '600', color: colors.text },
    send: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.brand,
      borderRadius: 999,
      paddingVertical: 11,
    },
    sendText: { color: '#FFFFFF', fontWeight: '800' },
    section: { ...display, fontSize: 19, color: colors.text, textTransform: 'uppercase', marginTop: 10, marginBottom: 8 },
    sent: { borderRadius: 12, padding: 12, marginBottom: 8 },
  });
}
