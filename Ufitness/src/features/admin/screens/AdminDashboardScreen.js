import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useApp } from '../../../context/AppContext';
import { USAGE_BY_CAMPUS, USAGE_BY_DAY, USAGE_BY_MODULE, SEED_STUDENTS } from '../data/usageSeed';
import { loadLiveUsage } from '../lib/liveUsage';
import { mergeCloudStudents, mergeLiveStudent, recommendMentors } from '../lib/recommendMentors';
import { addDecision, loadAdminState, toggleDecision } from '../lib/adminStore';
import BarChart from '../components/BarChart';
import AdminGate from '../components/AdminGate';
import AsyncStorage from '@react-native-async-storage/async-storage';

const display = { fontFamily: 'Anton_400Regular', letterSpacing: 0.8 };

export default function AdminDashboardScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { profile } = useApp();
  const styles = createStyles(colors, isDark);
  const [workoutProfile, setWorkoutProfile] = useState({});
  const [invites, setInvites] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [note, setNote] = useState('');
  const [usage, setUsage] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('workoutapp.profile.v1');
      setWorkoutProfile(raw ? JSON.parse(raw) : {});
    } catch {
      setWorkoutProfile({});
    }
    const admin = await loadAdminState();
    setInvites(admin.invites);
    setDecisions(admin.decisions);
    setUsage(await loadLiveUsage());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const students = mergeLiveStudent(
    mergeCloudStudents(SEED_STUDENTS, usage?.students || []),
    profile,
    workoutProfile
  );
  const recommended = recommendMentors(
    students,
    invites.filter((row) => row.status !== 'declined').map((row) => row.studentId)
  );
  const campusSeries = usage?.byCampus || USAGE_BY_CAMPUS;
  const daySeries = usage?.byDay || USAGE_BY_DAY;
  const moduleSeries = usage?.byModule || USAGE_BY_MODULE;
  const activeUsers = usage?.activeUsers ?? campusSeries.reduce((sum, item) => sum + item.users, 0);
  const pendingInvites = invites.filter((row) => row.status === 'pending').length;

  const saveNote = async () => {
    if (!note.trim()) return;
    const next = await addDecision(note);
    setDecisions(next.decisions);
    setNote('');
  };

  return (
    <AdminGate navigation={navigation}>
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>Campus Admin</Text>
        <Text style={styles.title}>Usage & Decisions</Text>
        <Text style={styles.copy}>
          {usage?.weekLive
            ? 'Week bars count students who opened the app this week. Campus bars use signed-up students.'
            : usage?.live
              ? 'Campus bars use signed-up students. Week bars stay sample until someone opens the app while signed in.'
              : 'Sample campus numbers until students appear in Firestore.'}
        </Text>

        <View style={styles.kpiRow}>
          <Kpi label="Active users" value={activeUsers} styles={styles} />
          <Kpi label="Mentor ready" value={recommended.length} styles={styles} />
          <Kpi label="Invites out" value={pendingInvites} styles={styles} />
        </View>

        <View style={styles.card}>
          <BarChart
            title="Users this week"
            series={daySeries.map((item) => ({ label: item.label, value: item.users }))}
            color={colors.brand}
            track={isDark ? '#2E2A28' : '#F3E7DF'}
            labelColor={colors.text}
          />
        </View>

        <View style={styles.card}>
          <BarChart
            title="Users by campus"
            series={campusSeries}
            color={isDark ? '#5EEAD4' : '#0F766E'}
            track={isDark ? '#2E2A28' : '#D7EDEA'}
            labelColor={colors.text}
          />
        </View>

        <View style={styles.card}>
          <BarChart
            title="Module reach"
            series={moduleSeries}
            color={isDark ? '#93C5FD' : '#1F3A5F'}
            track={isDark ? '#2E2A28' : '#E4EAF2'}
            labelColor={colors.text}
          />
        </View>

        <TouchableOpacity
          style={styles.pipelineBtn}
          onPress={() => navigation.navigate('MentorPipeline')}
        >
          <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
          <Text style={styles.pipelineText}>AI mentor recommendations</Text>
        </TouchableOpacity>

        <Text style={styles.section}>Decisions</Text>
        <Text style={styles.copy}>
          Pin a call from the graphs — who to invite, which campus to push, what to ship next.
        </Text>
        <View style={styles.noteRow}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Invite two APK mentors this week"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <Pressable style={styles.addBtn} onPress={saveNote}>
            <Text style={styles.addText}>Add</Text>
          </Pressable>
        </View>
        {decisions.map((item) => (
          <Pressable
            key={item.id}
            style={styles.decision}
            onPress={async () => setDecisions((await toggleDecision(item.id)).decisions)}
          >
            <Ionicons
              name={item.done ? 'checkbox' : 'square-outline'}
              size={18}
              color={item.done ? '#16a34a' : colors.muted}
            />
            <Text style={[styles.decisionText, item.done && styles.decisionDone]}>
              {item.text}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
    </AdminGate>
  );
}

function Kpi({ label, value, styles }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function createStyles(colors, isDark) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    body: { padding: 16, paddingBottom: 40 },
    kicker: { ...display, fontSize: 13, color: colors.brand, textTransform: 'uppercase' },
    title: { ...display, fontSize: 28, color: colors.text, marginTop: 4, textTransform: 'uppercase' },
    copy: { fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 14, color: colors.muted },
    kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    kpi: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 12,
    },
    kpiValue: { ...display, fontSize: 24, color: colors.text },
    kpiLabel: { fontSize: 11, fontWeight: '700', marginTop: 4, color: colors.muted },
    card: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
    },
    pipelineBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.brand,
      borderRadius: 999,
      paddingVertical: 14,
      marginTop: 4,
      marginBottom: 22,
    },
    pipelineText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
    section: { ...display, fontSize: 19, color: colors.text, textTransform: 'uppercase' },
    noteRow: { flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 10 },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.input,
      color: colors.text,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
    },
    addBtn: {
      backgroundColor: colors.brand,
      borderRadius: 999,
      paddingHorizontal: 16,
      justifyContent: 'center',
    },
    addText: { color: '#FFFFFF', fontWeight: '800' },
    decision: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
      backgroundColor: colors.overlay,
    },
    decisionText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
    decisionDone: { textDecorationLine: 'line-through', opacity: 0.6 },
  });
}
