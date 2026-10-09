import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import InspoBackground from '../../../components/InspoBackground';
import { useApp } from '../../../context/AppContext';
import { radius, spacing, useTheme } from '../../../context/ThemeContext';
import { useOnline } from '../../../lib/autoSync';
import { hapticSelection } from '../../../lib/haptics';
import { trackFeature } from '../../../lib/usagePing';
import CoachPlanCard from '../components/CoachPlanCard';
import { askCoach } from '../lib/coachApi';
import { MAX_INPUT_CHARS, QUICK_PROMPTS, makeMessage, usageLabel, validateInput } from '../lib/coachCore';
import { clearCoachHistory, loadCoachHistory, saveCoachHistory } from '../lib/coachHistory';

// Height of the on-screen keyboard measured from the bottom of the screen (0 when hidden).
// Android reports the keyboard height *above* the nav bar, so add the bottom inset back there.
function useKeyboardBottom(bottomInset) {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvt, (e) => setHeight(e?.endCoordinates?.height || 0));
    const hide = Keyboard.addListener(hideEvt, () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  if (!height) return 0;
  return Platform.OS === 'android' ? height + bottomInset : height;
}

// Profile stack → "AI Coach" (also the AI Coach card on Home).
// Chat with the UFitness AI Coach. Answers come from supabase/functions/ai-coach (Gemini),
// which reads this student's own profile / workouts / meal plan / progress. Chat is saved on this phone.
export default function AiCoachScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { user } = useApp();
  const uid = user?.uid || null;
  const online = useOnline();
  const listRef = useRef(null);
  const insets = useSafeAreaInsets();
  // The tab bar floats over this screen (position: absolute) and already includes the
  // bottom inset, so sit above it. Outside the tabs, just clear the system area.
  const tabBarHeight = useContext(BottomTabBarHeightContext);
  const keyboardBottom = useKeyboardBottom(insets.bottom);
  const bottomPad = keyboardBottom || tabBarHeight || insets.bottom;

  const [messages, setMessages] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [usage, setUsage] = useState(null);
  const [blocked, setBlocked] = useState(null); // { kind, message } for not_setup / rate_limit
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    trackFeature('AiCoach');
  }, []);

  useEffect(() => {
    let active = true;
    loadCoachHistory(uid).then((saved) => {
      if (!active) return;
      setMessages(saved);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [uid]);

  const update = useCallback(
    (next) => {
      setMessages(next);
      saveCoachHistory(uid, next);
    },
    [uid]
  );

  async function send(raw) {
    if (sending) return;
    const check = validateInput(raw);
    if (!check.ok) return;
    hapticSelection();
    const history = messages;
    const withQuestion = [...history, makeMessage('user', check.text)];
    update(withQuestion);
    setText('');

    if (!online) {
      update([...withQuestion, makeMessage('notice', 'You’re offline. The AI Coach needs internet — try again when you’re connected.', { kind: 'offline' })]);
      return;
    }

    setSending(true);
    const result = await askCoach(history, check.text);
    setSending(false);

    if (result.error) {
      const { kind, message } = result.error;
      if (result.error.usage) setUsage(result.error.usage);
      if (kind === 'not_setup' || kind === 'rate_limit') setBlocked({ kind, message });
      update([...withQuestion, makeMessage('notice', message, { kind })]);
      return;
    }
    if (result.usage) setUsage(result.usage);
    setBlocked(null);
    update([...withQuestion, makeMessage('assistant', result.reply, { plan: result.plan || null })]);
  }

  async function clearChat() {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
      return;
    }
    setConfirmClear(false);
    setMessages([]);
    await clearCoachHistory(uid);
  }

  const canSend = Boolean(text.trim()) && !sending && blocked?.kind !== 'rate_limit';

  const header = (
    <View>
      {!online ? (
        <View style={styles.offline}>
          <Ionicons name="cloud-offline-outline" size={18} color="#0A0A0A" />
          <Text style={styles.offlineText}>You’re offline. The AI Coach isn’t available offline — your chat is still here.</Text>
        </View>
      ) : null}
      {blocked?.kind === 'not_setup' ? (
        <View style={styles.setup}>
          <Ionicons name="construct-outline" size={18} color={colors.brand} />
          <View style={{ flex: 1 }}>
            <Text style={styles.setupTitle}>AI Coach not set up yet</Text>
            <Text style={styles.setupBody}>{blocked.message}</Text>
          </View>
        </View>
      ) : null}
      <View style={styles.intro}>
        <Ionicons name="sparkles" size={18} color={colors.brand} />
        <Text style={styles.introText}>
          Ask about workouts, cheap meals in rand, or your progress. I can read your UFitness plan to give
          personal tips. General guidance only — not medical advice.
        </Text>
      </View>
      {messages.length ? (
        <TouchableOpacity onPress={clearChat} style={styles.clear} hitSlop={8}>
          <Text style={styles.clearText}>{confirmClear ? 'Tap again to clear chat' : 'Clear chat'}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <InspoBackground plate="profile" />
      <View style={{ flex: 1, paddingBottom: bottomPad }}>
        {!loaded ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.brand} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: true })}
            ListHeaderComponent={header}
            ListFooterComponent={
              sending ? (
                <View style={[styles.bubble, styles.theirs, styles.typing]}>
                  <ActivityIndicator size="small" color={colors.brand} />
                  <Text style={styles.typingText}>Coach is thinking…</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              if (item.role === 'notice') {
                return (
                  <View style={styles.notice}>
                    <Ionicons
                      name={item.kind === 'offline' ? 'cloud-offline-outline' : item.kind === 'rate_limit' ? 'time-outline' : 'alert-circle-outline'}
                      size={14}
                      color="#FACC15"
                    />
                    <Text style={styles.noticeText}>{item.text}</Text>
                  </View>
                );
              }
              const mine = item.role === 'user';
              return (
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs, item.plan && styles.wide]}>
                  {!mine ? <Text style={[styles.who, { color: colors.brand }]}>COACH</Text> : null}
                  <Text style={[styles.bubbleText, mine && styles.mineText]} selectable>
                    {item.text}
                  </Text>
                  {item.plan ? <CoachPlanCard plan={item.plan} colors={colors} /> : null}
                </View>
              );
            }}
          />
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          keyboardShouldPersistTaps="handled"
          style={styles.chipsBar}
        >
          {QUICK_PROMPTS.map((prompt) => (
            <TouchableOpacity
              key={prompt}
              style={[styles.chip, (sending || !online) && styles.chipDisabled]}
              onPress={() => send(prompt)}
              disabled={sending || !online}
            >
              <Text style={styles.chipText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {usage ? <Text style={styles.usage}>{usageLabel(usage)}</Text> : null}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder={online ? 'Ask your coach…' : 'Offline — AI Coach needs internet'}
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={MAX_INPUT_CHARS}
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.send, !canSend && styles.sendDisabled]}
            onPress={() => send(text)}
            disabled={!canSend}
            accessibilityLabel="Send to AI Coach"
          >
            {sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="send" size={18} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'transparent' },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: spacing.card, paddingBottom: 8, flexGrow: 1 },
    offline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#FACC15',
      borderRadius: 12,
      padding: 10,
      marginBottom: 12,
    },
    offlineText: { color: '#0A0A0A', fontWeight: '700', fontSize: 13, flex: 1 },
    setup: {
      flexDirection: 'row',
      gap: 10,
      padding: 12,
      borderRadius: 12,
      marginBottom: 12,
      backgroundColor: 'rgba(255,106,0,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,106,0,0.35)',
    },
    setupTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
    setupBody: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2, lineHeight: 17 },
    intro: {
      flexDirection: 'row',
      gap: 10,
      padding: 12,
      borderRadius: 12,
      marginBottom: 12,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    introText: { flex: 1, color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 19 },
    clear: { alignSelf: 'flex-end', marginBottom: 8 },
    clearText: { color: '#F87171', fontSize: 12, fontWeight: '800' },
    bubble: {
      maxWidth: '82%',
      borderRadius: radius.input,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 10,
    },
    wide: { maxWidth: '94%' },
    mine: { alignSelf: 'flex-end', backgroundColor: colors.brand, borderBottomRightRadius: 6 },
    theirs: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(20,20,20,0.88)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      borderBottomLeftRadius: 6,
    },
    who: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 3 },
    bubbleText: { fontSize: 15, color: '#FFFFFF', lineHeight: 21 },
    mineText: { color: '#FFFFFF' },
    typing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    typingText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
    notice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      alignSelf: 'center',
      maxWidth: '92%',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      marginBottom: 10,
      backgroundColor: 'rgba(10,10,10,0.7)',
      borderWidth: 1,
      borderColor: 'rgba(250,204,21,0.35)',
    },
    noticeText: { flex: 1, color: '#FDE68A', fontSize: 12.5, lineHeight: 17 },
    chipsBar: { flexGrow: 0 },
    chips: { gap: 8, paddingHorizontal: spacing.gap, paddingVertical: 8 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(10,10,10,0.7)',
      borderWidth: 1,
      borderColor: 'rgba(255,106,0,0.45)',
    },
    chipDisabled: { opacity: 0.45 },
    chipText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
    usage: { textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: 11, marginBottom: 4 },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      paddingHorizontal: spacing.gap,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.tabBar,
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
