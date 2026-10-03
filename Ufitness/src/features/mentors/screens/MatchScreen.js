import React, { useCallback, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useApp } from '../../../context/AppContext';
import { getMentorRequest, sendMentorRequest, withdrawMentorRequest } from '../lib/mentorRequests';

const display = { fontFamily: 'Anton_400Regular', letterSpacing: 0.8 };

export default function MatchScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const { currentStudent, profile } = useApp();
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
          studentName: currentStudent?.name || profile?.name,
          mentor,
          studentCampus: profile?.campus || currentStudent?.campus || '',
          studentGoal: profile?.fitnessGoal || currentStudent?.fitnessGoal || '',
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
    <View style={styles.card}>
      <View style={styles.header}>
        <Image
          source={{ uri: mentor.photo || 'https://via.placeholder.com/60' }}
          style={styles.avatar}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{mentor.name}</Text>
          <Text style={styles.subText}>{mentor.year} • {mentor.level}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{mentor.campus || 'APK'}</Text>
        </View>
      </View>

      <Text style={styles.quote}>
        {mentor.quote || 'Looking for someone to spot me on bench days and keep me accountable at 6 AM.'}
      </Text>

      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.connectBtn, request && styles.withdrawBtn]} onPress={handleConnect} disabled={busy}>
          <Text style={styles.connectText}>{request ? 'Withdraw' : 'Connect'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => {
            if (!request) {
              Alert.alert('Connect first', 'Send a connect request, then you can open chat.');
              return;
            }
            navigation.navigate('Chat', {
              peerId: mentor.id,
              peerName: mentor.name,
              peerKind: 'mentor',
            });
          }}
        >
          <Text style={styles.chatText}>Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(colors, isDark) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      margin: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0 : 0.1,
      shadowRadius: 6,
      elevation: isDark ? 0 : 3,
    },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: isDark ? colors.overlay : '#eee' },
    info: { flex: 1, marginLeft: 12 },
    name: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    subText: { color: colors.muted },
    badge: {
      backgroundColor: isDark ? 'rgba(20,184,166,0.16)' : '#D8F1EC',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    badgeText: { color: isDark ? '#5EEAD4' : '#0F766E', fontWeight: 'bold', fontSize: 12 },
    quote: { color: colors.muted, fontStyle: 'italic', marginBottom: 12 },
    buttons: { flexDirection: 'row' },
    connectBtn: {
      flex: 1,
      backgroundColor: colors.brand,
      paddingVertical: 11,
      borderRadius: 999,
      alignItems: 'center',
      marginRight: 8,
    },
    withdrawBtn: {
      backgroundColor: isDark ? colors.overlay : '#c2410c',
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    connectText: { color: '#fff', fontWeight: 'bold' },
    chatBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.brand,
      paddingVertical: 11,
      borderRadius: 999,
      alignItems: 'center',
    },
    chatText: { color: colors.brand, fontWeight: 'bold' },
  });
}
