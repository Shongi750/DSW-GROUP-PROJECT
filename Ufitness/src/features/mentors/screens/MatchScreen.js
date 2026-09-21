import React, { useCallback, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useApp } from '../../../context/AppContext';
import { getMentorRequest, sendMentorRequest, withdrawMentorRequest } from '../lib/mentorRequests';

export default function MatchScreen({ route }) {
  const { colors } = useTheme();
  const { currentStudent } = useApp();
  const mentor = route?.params?.mentor || {
    id: '0',
    name: 'Mentor',
    year: 'N/A',
    level: 'Unknown',
    campus: 'APK',
    photo: 'https://via.placeholder.com/60',
    expertise: 'Fitness',
    quote: 'Looking for someone to spot me on bench days and keep me accountable at 6 AM.',
  };
  const [request, setRequest] = useState(null);
  const [busy, setBusy] = useState(false);
  const studentId = currentStudent?.id || 'guest';

  const loadRequest = useCallback(async () => {
    const next = await getMentorRequest(studentId, mentor.id);
    setRequest(next);
  }, [mentor.id, studentId]);

  useFocusEffect(
    useCallback(() => {
      loadRequest();
    }, [loadRequest])
  );

  const handleConnect = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (request) {
        await withdrawMentorRequest(request.id);
        setRequest(null);
        Alert.alert('Request withdrawn', `Your request to ${mentor.name} is no longer pending.`);
      } else {
        const next = await sendMentorRequest({
          studentId,
          studentName: currentStudent?.name,
          mentor,
        });
        setRequest(next);
        Alert.alert('Request sent', `${mentor.name} will see this as a pending mentor request.`);
      }
    } catch (error) {
      Alert.alert('Could not update request', error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Image
          source={{ uri: mentor.photo || 'https://via.placeholder.com/60' }}
          style={styles.avatar}
        />
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>{mentor.name}</Text>
          <Text style={[styles.subText, { color: colors.muted }]}>{mentor.year} • {mentor.level}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{mentor.campus || 'APK'}</Text>
        </View>
      </View>

      <Text style={[styles.quote, { color: colors.muted }]}>
        {mentor.quote || 'Looking for someone to spot me on bench days and keep me accountable at 6 AM.'}
      </Text>

      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.connectBtn, request && styles.withdrawBtn]} onPress={handleConnect} disabled={busy}>
          <Text style={styles.connectText}>{request ? 'Withdraw' : 'Connect'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() =>
            Alert.alert(
              'Chat',
              request
                ? 'Chat unlocks after the mentor accepts. Your request is still pending.'
                : 'Send a connect request first so this mentor can accept and chat.'
            )
          }
        >
          <Text style={styles.chatText}>Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  subText: { color: 'gray' },
  badge: {
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { color: '#fff', fontWeight: 'bold' },
  quote: { color: '#444', fontStyle: 'italic', marginBottom: 12 },
  buttons: { flexDirection: 'row' },
  connectBtn: {
    flex: 1,
    backgroundColor: '#f97316',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  withdrawBtn: {
    backgroundColor: '#c2410c',
  },
  connectText: { color: '#fff', fontWeight: 'bold' },
  chatBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  chatText: { color: '#333', fontWeight: 'bold' },
});
