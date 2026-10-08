import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { reasonLabel } from '../../../lib/blockFilter';
import { reportActions, statusLabel } from '../../../lib/moderationRules';
import { deleteReportedMessage, resolveReport, setUserSuspended } from '../../../lib/moderation';

// One report on the Campus Admin dashboard, with Resolve / Dismiss / Delete message / Suspend.
// Risky buttons need a second tap ("Tap again to confirm") instead of an Alert,
// so this works the same on web and on phones.

const WHERE_LABELS = {
  group_messages: 'Group chat',
  direct_messages: 'Direct message',
  community_posts: 'Community post',
};

function formatWhen(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function ReportCard({ report, colors, suspendedIds, onChanged }) {
  const styles = createStyles(colors);
  const [busy, setBusy] = useState('');
  const [armed, setArmed] = useState(''); // action waiting for its confirm tap
  const [note, setNote] = useState('');
  const actions = reportActions(report, { suspendedIds });

  // Confirm taps expire after 4 seconds.
  useEffect(() => {
    if (!armed) return undefined;
    const timer = setTimeout(() => setArmed(''), 4000);
    return () => clearTimeout(timer);
  }, [armed]);

  async function run(name, needsConfirm, task) {
    if (needsConfirm && armed !== name) {
      setArmed(name);
      return;
    }
    setArmed('');
    setBusy(name);
    const result = await task();
    setBusy('');
    setNote(result.message);
    if (result.ok && onChanged) onChanged(name, report);
  }

  const buttons = [
    actions.resolve && { name: 'resolve', label: 'Resolve', task: () => resolveReport(report.id, 'resolved') },
    actions.dismiss && { name: 'dismiss', label: 'Dismiss', task: () => resolveReport(report.id, 'dismissed') },
    actions.reopen && { name: 'reopen', label: 'Reopen', task: () => resolveReport(report.id, 'open') },
    actions.deleteMessage && {
      name: 'delete',
      label: 'Delete message',
      danger: true,
      confirm: true,
      task: () => deleteReportedMessage(report.table, report.messageId),
    },
    actions.suspend && {
      name: 'suspend',
      label: 'Suspend user',
      danger: true,
      confirm: true,
      task: () => setUserSuspended(report.reportedUserId, true, `${reasonLabel(report.reason)} report`),
    },
    actions.unsuspend && {
      name: 'unsuspend',
      label: 'Lift suspension',
      confirm: true,
      task: () => setUserSuspended(report.reportedUserId, false),
    },
  ].filter(Boolean);

  const open = report.status === 'open';

  return (
    <View style={[styles.card, !open && { opacity: 0.7 }]}>
      <View style={styles.top}>
        <Text style={styles.reason}>{reasonLabel(report.reason)}</Text>
        <Text style={[styles.status, open ? styles.statusOpen : styles.statusDone]}>{statusLabel(report.status)}</Text>
      </View>
      <Text style={styles.meta}>
        {report.reportedName} · {WHERE_LABELS[report.table] || report.table} · {formatWhen(report.createdAt)}
      </Text>
      {report.excerpt ? <Text style={styles.text}>“{report.excerpt}”</Text> : null}

      <View style={styles.row}>
        {buttons.map((button) => (
          <TouchableOpacity
            key={button.name}
            style={[styles.button, button.danger && styles.danger, armed === button.name && styles.armed]}
            onPress={() => run(button.name, button.confirm, button.task)}
            disabled={Boolean(busy)}
          >
            {busy === button.name ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={[styles.buttonText, button.danger && styles.dangerText]}>
                {armed === button.name ? 'Tap again to confirm' : button.label}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
    },
    top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    reason: { fontSize: 14, fontWeight: '800', color: colors.text },
    status: { fontSize: 11, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
    statusOpen: { color: '#FFFFFF', backgroundColor: '#E5484D' },
    statusDone: { color: colors.muted, backgroundColor: colors.overlay },
    meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
    text: { fontSize: 13, lineHeight: 18, color: colors.text, marginTop: 6 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    button: {
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 70,
      alignItems: 'center',
    },
    buttonText: { fontSize: 12, fontWeight: '700', color: colors.text },
    danger: { borderColor: 'rgba(229,72,77,0.5)' },
    dangerText: { color: '#E5484D' },
    armed: { backgroundColor: 'rgba(229,72,77,0.12)' },
    note: { fontSize: 12, color: colors.muted, marginTop: 8 },
  });
}
