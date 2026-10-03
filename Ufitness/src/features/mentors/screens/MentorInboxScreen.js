import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, display, spacing, radius } from '../../../context/ThemeContext';
import { useApp } from '../../../context/AppContext';
import InspoBackground from '../../../components/InspoBackground';
import { PHOTO_GLASS } from '../../../components/PhotoShell';
import { listRequestsForMentor, respondToMentorRequest } from '../lib/mentorRequests';
import MentorGate from '../components/MentorGate';

export default function MentorInboxScreen({ navigation }) {
  const { colors } = useTheme();
  const { profile, currentStudent } = useApp();
  const mentorId = profile.userId || currentStudent.id;
  const [rows, setRows] = useState([]);
  const [busyId, setBusyId] = useState('');

  const reload = useCallback(async () => {
    setRows(await listRequestsForMentor(mentorId));
  }, [mentorId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const respond = async (id, status) => {
    setBusyId(id);
    await respondToMentorRequest(id, status);
    await reload();
    setBusyId('');
    if (status === 'active') {
      Alert.alert('Mentee added', 'They appear under My Mentees. You can chat and leave guidance.');
      navigation.navigate('MentorMentees');
    }
  };

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
            <Text style={styles.title}>Requests</Text>
            <Text style={styles.copy}>Students asking you to mentor them.</Text>
          </>
        }
        ListEmptyComponent={<Text style={styles.empty}>No pending requests.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.studentName}</Text>
            <Text style={styles.meta}>
              {[item.studentCampus, item.studentGoal].filter(Boolean).join(' · ') || 'UJ student'}
            </Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.brand }]}
                disabled={busyId === item.id}
                onPress={() => respond(item.id, 'active')}
              >
                {busyId === item.id ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.btnText}>Accept</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.outline]}
                disabled={busyId === item.id}
                onPress={() => respond(item.id, 'declined')}
              >
                <Text style={[styles.btnText, { color: colors.brand }]}>Decline</Text>
              </TouchableOpacity>
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
  empty: { color: '#C9C9C9', marginTop: 24, textAlign: 'center' },
  card: { ...PHOTO_GLASS, borderRadius: radius.card, padding: 16, marginBottom: 12 },
  name: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  meta: { fontSize: 13, color: '#C9C9C9', marginTop: 4, marginBottom: 14 },
  row: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FF6A00',
  },
  btnText: { color: '#FFFFFF', fontWeight: '800' },
});
