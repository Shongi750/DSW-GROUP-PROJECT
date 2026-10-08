import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, spacing } from '../../context/ThemeContext';
import InspoBackground from '../../components/InspoBackground';
import Avatar from '../../components/Avatar';
import { unblockUser, useBlockedList } from '../../lib/moderation';

// Profile → Privacy & security → Blocked users.
// Lists people you blocked in chats (Supabase user_blocks) and feed authors you
// hid on this phone (name blocks). Unblock shows their messages / posts again.
export default function BlockedUsersScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const list = useBlockedList();
  const [busyKey, setBusyKey] = useState('');

  async function unblock(item) {
    setBusyKey(item.key);
    await unblockUser(item.key);
    setBusyKey('');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <InspoBackground plate="profile" />
      <FlatList
        data={list}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <Text style={styles.lead}>
            Blocked students can’t see that you blocked them. Their messages stay hidden for you, and they can’t send
            you direct messages.
          </Text>
        }
        ListEmptyComponent={<Text style={styles.empty}>You haven’t blocked anyone.</Text>}
        renderItem={({ item }) => {
          const feedOnly = String(item.key).startsWith('name:');
          return (
            <View style={styles.row}>
              <Avatar name={item.name} size={40} />
              <View style={styles.copy}>
                <Text style={styles.name}>{item.name || 'Student'}</Text>
                <Text style={styles.caption}>{feedOnly ? 'Community posts · this phone only' : 'Chats and DMs'}</Text>
              </View>
              <TouchableOpacity style={styles.button} onPress={() => unblock(item)} disabled={Boolean(busyKey)}>
                {busyKey === item.key ? (
                  <ActivityIndicator size="small" color={colors.brand} />
                ) : (
                  <Text style={styles.buttonText}>Unblock</Text>
                )}
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'transparent' },
    content: { padding: spacing.screen, paddingBottom: 80 },
    lead: { fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.6)', marginBottom: 14 },
    empty: { textAlign: 'center', marginTop: 40, color: 'rgba(255,255,255,0.6)' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    copy: { flex: 1 },
    name: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    caption: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
    button: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.brand,
      minWidth: 84,
      alignItems: 'center',
    },
    buttonText: { color: colors.brand, fontWeight: '800', fontSize: 13 },
  });
}
