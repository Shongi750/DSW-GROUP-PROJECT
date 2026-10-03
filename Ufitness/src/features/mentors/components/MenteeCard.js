import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

export default function MenteeCard({ mentee, onPressConnect, onPressChat }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.card}>
      {/* Avatar + Info */}
      <View style={styles.header}>
        <Image
          source={{ uri: mentee.photo || 'https://via.placeholder.com/60' }}
          style={styles.avatar}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{mentee.name}</Text>
          <Text style={styles.subText}>{mentee.year} • {mentee.level}</Text>
        </View>
      </View>

      {/* Quote */}
      <Text style={styles.quote}>
        {mentee.quote || 'New to the gym and hoping to find a supportive buddy for treadmill runs and light weights.'}
      </Text>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.connectBtn} onPress={onPressConnect}>
          <Text style={styles.connectText}>Connect</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chatBtn} onPress={onPressChat}>
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
      marginVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0 : 0.1,
      shadowRadius: 6,
      elevation: isDark ? 0 : 3,
    },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: isDark ? colors.overlay : '#eee' },
    info: { marginLeft: 12, flex: 1 },
    name: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    subText: { color: colors.muted },
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
