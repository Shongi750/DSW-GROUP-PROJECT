import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { isRunningInExpoGo } from 'expo';
import { spacing, useTheme } from '../../context/ThemeContext';
import InspoBackground from '../../components/InspoBackground';
import { hapticSelection, hapticSuccess } from '../../lib/haptics';
import {
  loadReminders,
  notificationPermission,
  notificationsAvailable,
  saveReminders,
  scheduledReminderCount,
  scheduleTestReminder,
  updateReminders,
} from '../../lib/reminders';
import { DAY_LABELS, formatTime, MEALS } from '../../lib/notifications/reminderSchedule';
import { pushSupported, registerForPushAsync } from '../../lib/notifications/pushNotifications';

// Profile → Notifications (also the bell on Home).
// Local reminders scheduled on this phone: workout days + time, meal times, grocery day, gym check-in.
// They work in Expo Go and in the APK. Server push (announcements) needs the APK, see NOTIFICATIONS.md.

const MINUTE_STEP = 15;

function shiftTime(hour, minute, deltaMinutes) {
  const total = (((hour * 60 + minute + deltaMinutes) % 1440) + 1440) % 1440;
  return { hour: Math.floor(total / 60), minute: total % 60 };
}

function TimeStepper({ hour, minute, onChange, disabled, styles }) {
  return (
    <View style={[styles.stepper, disabled && styles.dim]}>
      <TouchableOpacity
        onPress={() => onChange(shiftTime(hour, minute, -MINUTE_STEP))}
        disabled={disabled}
        hitSlop={8}
        style={styles.stepBtn}
        accessibilityLabel="Earlier"
      >
        <Ionicons name="remove" size={18} color="#FFFFFF" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onChange(shiftTime(hour, minute, 60))}
        disabled={disabled}
        accessibilityLabel="Tap to add an hour"
      >
        <Text style={styles.time}>{formatTime(hour, minute)}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onChange(shiftTime(hour, minute, MINUTE_STEP))}
        disabled={disabled}
        hitSlop={8}
        style={styles.stepBtn}
        accessibilityLabel="Later"
      >
        <Ionicons name="add" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [state, setState] = useState(null);
  const [permission, setPermission] = useState('undetermined');
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState('');
  const [testSent, setTestSent] = useState(false);
  const [pushNote, setPushNote] = useState('');
  const applySeq = useRef(0); // only the latest change may overwrite the screen
  const available = notificationsAvailable();

  const refresh = useCallback(async () => {
    const [saved, perm, queued] = await Promise.all([
      loadReminders(),
      notificationPermission(),
      scheduledReminderCount(),
    ]);
    setState(saved);
    setPermission(perm);
    setCount(queued);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Save + reschedule. Optimistic so the switch moves straight away.
  async function apply(next, { turningOn = false, key = 'save' } = {}) {
    hapticSelection();
    const previous = state;
    const seq = ++applySeq.current;
    setState(next);
    setBusy(key);
    try {
      const result = await updateReminders(next, { turningOn });
      if (seq !== applySeq.current) return;
      setState(result.ok ? result.state : previous);
      setCount(await scheduledReminderCount());
      setPermission(await notificationPermission());
    } finally {
      if (seq === applySeq.current) setBusy('');
    }
  }

  async function sendTest() {
    setBusy('test');
    const ok = await scheduleTestReminder(5);
    setBusy('');
    setTestSent(ok);
    if (ok) hapticSuccess();
    setPermission(await notificationPermission());
  }

  async function enablePush() {
    setBusy('push');
    const result = await registerForPushAsync();
    setBusy('');
    if (result.token) {
      const next = await saveReminders({ ...state, expoPushToken: result.token });
      setState(next);
      setPushNote('Push is on for this phone.');
      return;
    }
    const messages = {
      expo_go: 'Push needs the installed UFitness app (APK). Reminders above still work here.',
      no_project: 'Push isn’t set up yet (needs the EAS project id). See NOTIFICATIONS.md.',
      denied: 'Notifications are blocked. Allow them in your phone settings.',
    };
    setPushNote(messages[result.error] || result.error);
  }

  if (!state) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]} edges={['bottom']}>
        <InspoBackground plate="profile" />
        <ActivityIndicator color={colors.brand} />
      </SafeAreaView>
    );
  }

  const workout = state.workout;
  const blocked = permission === 'denied';

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <InspoBackground plate="profile" />
      <ScrollView contentContainerStyle={styles.content}>
        {!available ? (
          <View style={styles.banner}>
            <Ionicons name="information-circle-outline" size={18} color="#0A0A0A" />
            <Text style={styles.bannerText}>
              Reminders only work in the phone app. Settings still save to your account.
            </Text>
          </View>
        ) : blocked ? (
          <TouchableOpacity style={styles.banner} onPress={() => Linking.openSettings()}>
            <Ionicons name="notifications-off-outline" size={18} color="#0A0A0A" />
            <Text style={styles.bannerText}>
              Notifications are blocked for {isRunningInExpoGo() ? 'Expo Go' : 'UFitness'}. Tap to open settings.
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Workout reminder */}
        <Text style={styles.section}>Workout</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="barbell-outline" size={22} color={colors.brand} />
            <View style={styles.copy}>
              <Text style={styles.title}>Workout reminder</Text>
              <Text style={styles.caption}>A nudge on your training days</Text>
            </View>
            <Switch
              value={workout.enabled}
              onValueChange={(on) =>
                apply({ ...state, workout: { ...workout, enabled: on } }, { turningOn: on, key: 'workout' })
              }
              trackColor={{ true: colors.brand, false: 'rgba(255,255,255,0.2)' }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={[styles.subRow, !workout.enabled && styles.dim]}>
            <Text style={styles.label}>Time</Text>
            <TimeStepper
              hour={workout.hour}
              minute={workout.minute}
              disabled={!workout.enabled}
              styles={styles}
              onChange={(t) => apply({ ...state, workout: { ...workout, ...t } }, { key: 'workout' })}
            />
          </View>
          <View style={[styles.days, !workout.enabled && styles.dim]}>
            {DAY_LABELS.map((label, day) => {
              const on = workout.days.includes(day);
              return (
                <TouchableOpacity
                  key={label}
                  disabled={!workout.enabled}
                  onPress={() => {
                    const days = on ? workout.days.filter((d) => d !== day) : [...workout.days, day];
                    apply({ ...state, workout: { ...workout, days } }, { key: 'workout' });
                  }}
                  style={[styles.day, on && styles.dayOn]}
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.dayText, on && styles.dayTextOn]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {workout.enabled && !workout.days.length ? (
            <Text style={styles.warn}>Pick at least one day.</Text>
          ) : null}
        </View>

        {/* Meal reminders */}
        <Text style={styles.section}>Meals</Text>
        <View style={styles.card}>
          {MEALS.map((meal, index) => {
            const m = state.meals[meal.key];
            const setMeal = (patch, opts) =>
              apply({ ...state, meals: { ...state.meals, [meal.key]: { ...m, ...patch } } }, { key: meal.key, ...opts });
            return (
              <View key={meal.key} style={index ? styles.hairTop : null}>
                <View style={styles.row}>
                  <Ionicons name="restaurant-outline" size={20} color={colors.brand} />
                  <View style={styles.copy}>
                    <Text style={styles.title}>{meal.label}</Text>
                  </View>
                  <TimeStepper
                    hour={m.hour}
                    minute={m.minute}
                    disabled={!m.enabled}
                    styles={styles}
                    onChange={(t) => setMeal(t)}
                  />
                  <Switch
                    value={m.enabled}
                    onValueChange={(on) => setMeal({ enabled: on }, { turningOn: on })}
                    trackColor={{ true: colors.brand, false: 'rgba(255,255,255,0.2)' }}
                    thumbColor="#FFFFFF"
                    style={styles.switchGap}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Weekly extras */}
        <Text style={styles.section}>Weekly</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="cart-outline" size={20} color={colors.brand} />
            <View style={styles.copy}>
              <Text style={styles.title}>Grocery day</Text>
              <Text style={styles.caption}>Saturday and Sunday, 09:00</Text>
            </View>
            <Switch
              value={state.groceryDay}
              onValueChange={(on) => apply({ ...state, groceryDay: on }, { turningOn: on, key: 'grocery' })}
              trackColor={{ true: colors.brand, false: 'rgba(255,255,255,0.2)' }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={[styles.row, styles.hairTop]}>
            <Ionicons name="location-outline" size={20} color={colors.brand} />
            <View style={styles.copy}>
              <Text style={styles.title}>Gym check-in</Text>
              <Text style={styles.caption}>Monday to Friday, 09:00</Text>
            </View>
            <Switch
              value={state.gymCheckIn}
              onValueChange={(on) => apply({ ...state, gymCheckIn: on }, { turningOn: on, key: 'gym' })}
              trackColor={{ true: colors.brand, false: 'rgba(255,255,255,0.2)' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Test + status */}
        <TouchableOpacity style={styles.testBtn} onPress={sendTest} disabled={busy === 'test'} activeOpacity={0.85}>
          {busy === 'test' ? (
            <ActivityIndicator color="#0A0A0A" />
          ) : (
            <>
              <Ionicons name="notifications-outline" size={18} color="#0A0A0A" />
              <Text style={styles.testText}>Send a test notification</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.status}>
          {testSent ? 'Test sent: it shows in about 5 seconds (lock the phone to see it on the lock screen). ' : ''}
          {count} reminder{count === 1 ? '' : 's'} scheduled on this phone · permission: {permission}
          {busy && busy !== 'test' ? ' · saving…' : ''}
        </Text>

        {/* Push (APK only) */}
        {Platform.OS !== 'web' ? (
          <>
            <Text style={styles.section}>Announcements (push)</Text>
            <View style={styles.card}>
              <Text style={styles.caption}>
                {pushSupported()
                  ? state.expoPushToken
                    ? 'Push is on for this phone. Campus announcements can reach you even when the app is closed.'
                    : 'Turn on push to get campus announcements from UFitness.'
                  : 'Push announcements need the installed UFitness app (APK). Reminders above already work here.'}
              </Text>
              {pushSupported() && !state.expoPushToken ? (
                <TouchableOpacity style={styles.linkBtn} onPress={enablePush} disabled={busy === 'push'}>
                  {busy === 'push' ? (
                    <ActivityIndicator color={colors.brand} />
                  ) : (
                    <Text style={styles.linkText}>Turn on push</Text>
                  )}
                </TouchableOpacity>
              ) : null}
              {pushNote ? <Text style={styles.warn}>{pushNote}</Text> : null}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'transparent' },
    center: { alignItems: 'center', justifyContent: 'center' },
    content: { padding: spacing.screen, paddingBottom: 120 },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#FACC15',
      borderRadius: 12,
      padding: 10,
      marginBottom: 8,
    },
    bannerText: { color: '#0A0A0A', fontWeight: '700', fontSize: 13, flex: 1 },
    section: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: 18,
      marginBottom: 8,
    },
    card: {
      padding: 14,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
    hairTop: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: 'rgba(255,255,255,0.14)',
      marginTop: 8,
      paddingTop: 8,
    },
    copy: { flex: 1 },
    title: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    caption: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2, lineHeight: 17 },
    label: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '700', flex: 1 },
    subRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    stepBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    time: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', minWidth: 52, textAlign: 'center' },
    switchGap: { marginLeft: 4 },
    days: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
    day: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
    },
    dayOn: { backgroundColor: colors.brand, borderColor: colors.brand },
    dayText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' },
    dayTextOn: { color: '#FFFFFF' },
    dim: { opacity: 0.45 },
    warn: { color: '#FACC15', fontSize: 12, marginTop: 8, fontWeight: '600' },
    testBtn: {
      marginTop: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.brand,
      borderRadius: 999,
      paddingVertical: 14,
    },
    testText: { color: '#0A0A0A', fontWeight: '800', fontSize: 15 },
    status: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 8, textAlign: 'center' },
    linkBtn: { marginTop: 10, alignSelf: 'flex-start', paddingVertical: 6 },
    linkText: { color: colors.brand, fontWeight: '800', fontSize: 14 },
  });
}
