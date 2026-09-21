import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

export default function MenteeCard({ mentee, onPressConnect, onPressChat }) {
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  info: { marginLeft: 12 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  subText: { color: 'gray' },
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
