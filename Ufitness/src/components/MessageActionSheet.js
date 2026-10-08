import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { REPORT_REASONS } from '../lib/blockFilter';
import { blockUser, reportMessage } from '../lib/moderation';

// Bottom sheet for a long-pressed message or post: Report (pick a reason) or Block.
// Built as a Modal (not Alert) so it works the same on Android, iOS and web.
//
// target = { table, messageId, authorId, authorName, text, blockKey? }
//   blockKey defaults to authorId (feed posts pass a name key instead).
// Pass target = null to hide it.
export default function MessageActionSheet({ target, onClose, onBlocked = null }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [step, setStep] = useState('menu'); // menu | reasons | confirmBlock | done
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');

  // Fresh sheet every time a new message is long-pressed.
  useEffect(() => {
    setStep('menu');
    setBusy(false);
    setResult('');
  }, [target]);

  if (!target) return null;
  const name = target.authorName || 'this student';
  const blockKey = target.blockKey || target.authorId;

  async function sendReport(reason) {
    setBusy(true);
    const res = await reportMessage({ ...target, reason });
    setBusy(false);
    setResult(res.message);
    setStep('done');
  }

  async function confirmBlock() {
    setBusy(true);
    const res = await blockUser({ key: blockKey, name: target.authorName });
    setBusy(false);
    setResult(res.message);
    setStep('done');
    if (res.ok && onBlocked) onBlocked(blockKey);
  }

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={busy ? undefined : onClose}>
        {/* Inner Pressable stops taps on the sheet from closing it */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          {busy ? <ActivityIndicator color={colors.brand} style={{ marginVertical: 24 }} /> : null}

          {!busy && step === 'menu' ? (
            <>
              <Text style={styles.title}>Message from {name}</Text>
              {target.text ? (
                <Text style={styles.preview} numberOfLines={2}>
                  “{target.text}”
                </Text>
              ) : null}
              <Row icon="flag-outline" label="Report" onPress={() => setStep('reasons')} styles={styles} colors={colors} />
              {blockKey ? (
                <Row
                  icon="hand-left-outline"
                  label={`Block ${name}`}
                  onPress={() => setStep('confirmBlock')}
                  styles={styles}
                  colors={colors}
                  danger
                />
              ) : null}
              <Row icon="close" label="Cancel" onPress={onClose} styles={styles} colors={colors} />
            </>
          ) : null}

          {!busy && step === 'reasons' ? (
            <>
              <Text style={styles.title}>Why are you reporting this?</Text>
              <Text style={styles.preview}>Campus Admin sees the reason and a short copy of the message.</Text>
              {REPORT_REASONS.map((reason) => (
                <Row
                  key={reason.id}
                  icon="chevron-forward"
                  label={reason.label}
                  onPress={() => sendReport(reason.id)}
                  styles={styles}
                  colors={colors}
                />
              ))}
              <Row icon="arrow-back" label="Back" onPress={() => setStep('menu')} styles={styles} colors={colors} />
            </>
          ) : null}

          {!busy && step === 'confirmBlock' ? (
            <>
              <Text style={styles.title}>Block {name}?</Text>
              <Text style={styles.preview}>
                You won’t see their messages in chats or groups. They are not told. Direct messages from them are
                stopped too.
              </Text>
              <Row icon="hand-left-outline" label="Block" onPress={confirmBlock} styles={styles} colors={colors} danger />
              <Row icon="arrow-back" label="Back" onPress={() => setStep('menu')} styles={styles} colors={colors} />
            </>
          ) : null}

          {!busy && step === 'done' ? (
            <>
              <Text style={styles.title}>Done</Text>
              <Text style={styles.preview}>{result}</Text>
              <Row icon="checkmark" label="Close" onPress={onClose} styles={styles} colors={colors} />
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({ icon, label, onPress, styles, colors, danger }) {
  const tint = danger ? '#E5484D' : colors.text;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={18} color={tint} />
      <Text style={[styles.rowText, { color: tint }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 28,
      borderWidth: 1,
      borderColor: colors.border,
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
    },
    title: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 6 },
    preview: { fontSize: 13, lineHeight: 19, color: colors.muted, marginBottom: 10 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 13,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    rowText: { fontSize: 15, fontWeight: '600' },
  });
}
