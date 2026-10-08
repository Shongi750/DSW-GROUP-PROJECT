/**
 * AdminDashboardScreen — campus admin KPIs and decision log.
 * Numbers come from Supabase (admin_usage_summary + list_students). No sample data:
 * when nothing is recorded yet we say so instead of showing made-up bars.
 * Also lists chat reports (chat_reports) so the admin can follow up.
 */
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
import { loadLiveUsage } from '../lib/liveUsage';
import { mergeCloudStudents, mergeLiveStudent, recommendMentors } from '../lib/recommendMentors';
import { addDecision, loadAdminState, toggleDecision } from '../lib/adminStore';
import { loadSentInvites } from '../../mentors/lib/mentorInvites';
import { loadReports, loadSuspendedIds } from '../../../lib/moderation';
import { openReportCount, sortReports } from '../../../lib/moderationRules';
import ReportCard from '../components/ReportCard';
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
  const [reports, setReports] = useState({ rows: [], error: '' });
  const [suspendedIds, setSuspendedIds] = useState([]);
  const [showHandled, setShowHandled] = useState(false);

  // Pull local workout profile, admin invites/decisions, and optional live usage.
  const refresh = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('workoutapp.profile.v1');
      setWorkoutProfile(raw ? JSON.parse(raw) : {});
    } catch {
      setWorkoutProfile({});
    }
    const admin = await loadAdminState();
    setDecisions(admin.decisions);
    const sent = await loadSentInvites();
    setInvites(sent.rows);
    setUsage(await loadLiveUsage());
    setReports(await loadReports());
    setSuspendedIds(await loadSuspendedIds());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const students = mergeLiveStudent(mergeCloudStudents([], usage?.students || []), profile, workoutProfile);
  const alreadyMentors = (usage?.students || [])
    .filter((row) => Array.isArray(row.roles) && row.roles.includes('mentor'))
    .map((row) => row.id);
  const recommended = recommendMentors(students, [
    ...invites.filter((row) => row.status !== 'declined').map((row) => row.studentId),
    ...alreadyMentors,
  ]);
  const pendingInvites = invites.filter((row) => row.status === 'pending').length;
  const hasStudents = (usage?.byCampus || []).some((item) => item.value > 0);

  // After an admin action, reload reports + suspensions (cheap; keeps buttons right).
  const refreshModeration = async () => {
    setReports(await loadReports());
    setSuspendedIds(await loadSuspendedIds());
  };

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
          Real numbers from Supabase: signed-up students, who opened the app each day, and which
          features they used (last 7 days).
        </Text>

        {usage && usage.cloud !== 'ok' ? (
          <View style={styles.banner}>
            <Ionicons name="cloud-offline-outline" size={18} color="#F87171" />
            <Text style={styles.bannerText}>{CLOUD_MESSAGES[usage.cloud] || CLOUD_MESSAGES.error}</Text>
          </View>
        ) : null}

        <View style={styles.kpiRow}>
          <Kpi label="Students" value={usage ? usage.totalStudents : '–'} styles={styles} />
          <Kpi label="New (7 days)" value={usage ? usage.signups7d : '–'} styles={styles} />
          <Kpi label="Active (7 days)" value={usage ? usage.active7d : '–'} styles={styles} />
        </View>
        <View style={styles.kpiRow}>
          <Kpi label="Mentor ready" value={recommended.length} styles={styles} />
          <Kpi label="Invites out" value={pendingInvites} styles={styles} />
          <Kpi label="Open reports" value={openReportCount(reports.rows)} styles={styles} />
        </View>

        <View style={styles.card}>
          {usage?.hasUsage ? (
            <BarChart
              title="Active users per day"
              series={usage.byDay.map((item) => ({ label: item.label, value: item.users }))}
              color={colors.brand}
              track={isDark ? '#2E2A28' : '#F3E7DF'}
              labelColor={colors.text}
            />
          ) : (
            <EmptyChart
              title="Active users per day"
              copy="No app opens recorded in the last 7 days yet. Students appear here after they sign in on the updated app."
              styles={styles}
            />
          )}
        </View>

        <View style={styles.card}>
          {hasStudents ? (
            <BarChart
              title="Students by campus"
              series={usage.byCampus}
              color={isDark ? '#5EEAD4' : '#0F766E'}
              track={isDark ? '#2E2A28' : '#D7EDEA'}
              labelColor={colors.text}
            />
          ) : (
            <EmptyChart
              title="Students by campus"
              copy="No students have finished setup yet (or they chose not to show their campus)."
              styles={styles}
            />
          )}
        </View>

        <View style={styles.card}>
          {usage?.hasUsage ? (
            <BarChart
              title="Feature reach (7 days)"
              series={usage.byModule}
              color={isDark ? '#93C5FD' : '#1F3A5F'}
              track={isDark ? '#2E2A28' : '#E4EAF2'}
              labelColor={colors.text}
            />
          ) : (
            <EmptyChart
              title="Feature reach (7 days)"
              copy="Counts students who opened Meals, Workout, Community or Mentors. Nothing recorded yet."
              styles={styles}
            />
          )}
        </View>

        <TouchableOpacity
          style={styles.pipelineBtn}
          onPress={() => navigation.navigate('MentorPipeline')}
        >
          <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
          <Text style={styles.pipelineText}>AI mentor recommendations</Text>
        </TouchableOpacity>

        <Text style={styles.section}>Reports</Text>
        <Text style={styles.copy}>
          Messages and posts students reported (open first). Only Campus Admin can see this list.
          Every action is saved in the moderation log.
        </Text>
        {reports.error ? <Text style={styles.copy}>{reports.error}</Text> : null}
        {!reports.error && !openReportCount(reports.rows) ? (
          <Text style={styles.copy}>No open reports. Nice and quiet.</Text>
        ) : null}
        {reports.rows.length > openReportCount(reports.rows) ? (
          <Pressable onPress={() => setShowHandled((value) => !value)}>
            <Text style={styles.toggle}>{showHandled ? 'Hide handled reports' : 'Show handled reports'}</Text>
          </Pressable>
        ) : null}
        {sortReports(reports.rows)
          .filter((item) => showHandled || item.status === 'open')
          .map((item) => (
            <ReportCard
              key={item.id}
              report={item}
              colors={colors}
              suspendedIds={suspendedIds}
              onChanged={refreshModeration}
            />
          ))}

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

const CLOUD_MESSAGES = {
  local: 'Supabase keys are missing in .env, so there is no live data on this build.',
  missing: 'Cloud not set up: run supabase/schema.sql (or the 2026-10-08 migration) in the Supabase SQL editor.',
  error: 'Could not load live usage right now. Check your connection and that this account is a campus admin.',
};

function EmptyChart({ title, copy, styles }) {
  return (
    <View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyCopy}>{copy}</Text>
    </View>
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
    kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      backgroundColor: 'rgba(248,113,113,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(248,113,113,0.35)',
    },
    bannerText: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.text },
    emptyTitle: {
      ...display,
      fontSize: 15,
      color: colors.text,
      textTransform: 'uppercase',
      marginTop: 8,
      marginBottom: 6,
    },
    emptyCopy: { fontSize: 13, lineHeight: 19, color: colors.muted },
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
    toggle: { fontSize: 13, fontWeight: '700', color: colors.brand, marginBottom: 10 },
  });
}
