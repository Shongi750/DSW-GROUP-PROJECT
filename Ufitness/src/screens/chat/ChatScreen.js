/**
 * ChatScreen — 1:1 messages between buddies, mentees, or mentors.
 * loadThread + subscribeThread + sendDirectMessage (Supabase when peer UUID is real).
 * Long-press their message to report it or block them (MessageActionSheet).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, spacing } from '../../context/ThemeContext';
import InspoBackground from '../../components/InspoBackground';
import { currentUid } from '../../lib/cloudCache';
import { isUuid, loadThread, sendDirectMessage, subscribeThread } from '../../lib/directChat';
import MessageActionSheet from '../../components/MessageActionSheet';
import { filterBlocked, isBlocked } from '../../lib/blockFilter';
import { unblockUser, useBlockedKeys } from '../../lib/moderation';

function formatTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function ChatScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const peerId = route.params?.peerId || '';
  const peerName = route.params?.peerName || 'Student';
  const peerKind = route.params?.peerKind || 'buddy';
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [actionTarget, setActionTarget] = useState(null);
  const listRef = useRef(null);
  const me = currentUid();
  const blocked = useBlockedKeys();
  const peerBlocked = isBlocked(blocked, peerId);
  // Hide anything written by people I blocked (my own messages always show).
  const visibleMessages = filterBlocked(messages, blocked, (item) => item.fromId, me);

  const reload = useCallback(async () => {
    const rows = await loadThread(peerId);
    setMessages(rows);
    setLoading(false);
  }, [peerId]);

  useEffect(() => {
    navigation.setOptions?.({
      title: peerName,
      headerShown: true,
    });
  }, [navigation, peerName]);

  // Load history once, then listen for new rows on this thread.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    reload().then(() => {
      if (!alive) return;
    });
    const unsub = subscribeThread(peerId, (row) => {
      setMessages((current) => {
        if (current.some((item) => item.id === row.id)) return current;
        return [...current, row];
      });
    });
    return () => {
      alive = false;
      unsub();
    };
  }, [peerId, reload]);

  const onSend = async () => {
    if (sending || !text.trim()) return;
    setSending(true);
    const saved = await sendDirectMessage(peerId, text);
    if (saved) {
      setMessages((current) => {
        if (current.some((item) => item.id === saved.id)) return current;
        return [...current, saved];
      });
      setText('');
      requestAnimationFrame(() => listRef.current?.scrollToEnd?.({ animated: true }));
    }
    setSending(false);
  };

  if (!me || !peerId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>Sign in to chat.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <InspoBackground plate="community" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        {!isUuid(peerId) ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              Demo chat on this device — cloud chat needs a real UFitness account for this {peerKind}.
            </Text>
          </View>
        ) : null}

        {peerBlocked ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>You blocked {peerName}. Their messages are hidden.</Text>
            <TouchableOpacity onPress={() => unblockUser(peerId)}>
              <Text style={styles.unblock}>Unblock</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.brand} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={visibleMessages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: false })}
            ListEmptyComponent={
              <Text style={styles.empty}>
                Say hi to {peerName}. Plan a session or ask about campus gyms.
              </Text>
            }
            ListFooterComponent={
              visibleMessages.some((item) => !item.mine) ? (
                <Text style={styles.hint}>Long-press a message to report or block.</Text>
              ) : null
            }
            renderItem={({ item }) => (
              <Pressable
                style={[styles.bubble, item.mine ? styles.mine : styles.theirs]}
                delayLongPress={350}
                onLongPress={
                  item.mine
                    ? undefined
                    : () =>
                        setActionTarget({
                          table: 'direct_messages',
                          messageId: item.id,
                          authorId: item.fromId,
                          authorName: peerName,
                          text: item.body,
                        })
                }
              >
                <Text style={[styles.bubbleText, item.mine && styles.mineText]}>{item.body}</Text>
                <Text style={[styles.time, item.mine && styles.mineTime]}>
                  {formatTime(item.createdAt)}
                </Text>
              </Pressable>
            )}
          />
        )}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder={`Message ${peerName}…`}
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.send, (!text.trim() || sending) && styles.sendDisabled]}
            onPress={onSend}
            disabled={!text.trim() || sending}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <MessageActionSheet target={actionTarget} onClose={() => setActionTarget(null)} />
    </SafeAreaView>
  );
}

function createStyles(colors, isDark) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'transparent' },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    banner: {
      marginHorizontal: spacing.card,
      marginTop: 10,
      padding: 10,
      borderRadius: radius.input,
      backgroundColor: colors.accentSoft || 'rgba(255,106,0,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,106,0,0.28)',
    },
    bannerText: { fontSize: 12, color: colors.muted, lineHeight: 16 },
    unblock: { fontSize: 12, fontWeight: '800', color: colors.brand, marginTop: 6 },
    hint: { textAlign: 'center', fontSize: 11, color: colors.muted, marginTop: 4 },
    list: { padding: spacing.card, paddingBottom: 8, flexGrow: 1 },
    empty: {
      textAlign: 'center',
      color: colors.muted,
      marginTop: 48,
      paddingHorizontal: spacing.section,
      lineHeight: 20,
    },
    bubble: {
      maxWidth: '78%',
      borderRadius: radius.input,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 10,
    },
    mine: {
      alignSelf: 'flex-end',
      backgroundColor: colors.brand,
      borderBottomRightRadius: 6,
    },
    theirs: {
      alignSelf: 'flex-start',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderBottomLeftRadius: 6,
    },
    bubbleText: { fontSize: 15, color: colors.text, lineHeight: 20 },
    mineText: { color: '#FFFFFF' },
    time: { fontSize: 10, color: colors.muted, marginTop: 4, alignSelf: 'flex-end' },
    mineTime: { color: 'rgba(255,255,255,0.75)' },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      paddingHorizontal: spacing.gap,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: isDark ? colors.tabBar : colors.card,
    },
    input: {
      flex: 1,
      maxHeight: 120,
      borderRadius: radius.input,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.input || colors.overlay,
      color: colors.text,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 15,
    },
    send: {
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      backgroundColor: colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendDisabled: { opacity: 0.45 },
  });
}
