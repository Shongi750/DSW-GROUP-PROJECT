import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, display, radius, spacing, type } from '../../context/ThemeContext';
import InspoBackground from '../../components/InspoBackground';
import { PHOTO_GLASS } from '../../components/PhotoShell';
import { PressScale } from '../../components/motion';
import { DEFAULT_AVATAR, initialAvatar } from '../../data/profileAvatars';
import { genderLabel } from '../../data/genderOptions';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { inviteForStudent, loadAdminState, respondMentorInvite } from '../../features/admin/lib/adminStore';
import { biometricLabel, canUseBiometrics, disableUnlock, isUnlockEnabled } from '../../lib/biometrics';
import { hapticLight, hapticSuccess } from '../../lib/haptics';

const GOAL_LABELS = {
  weight: 'Weight Management',
  'Weight mgmt': 'Weight Management',
  'Weight Management': 'Weight Management',
  muscle: 'Build Muscle',
  'Muscle building': 'Build Muscle',
  'Build Muscle': 'Build Muscle',
  'Build strength': 'Build Muscle',
  general: 'General Fitness',
  'General fitness': 'General Fitness',
  'Improve general fitness': 'General Fitness',
  endurance: 'Endurance',
  'Improve endurance': 'Endurance',
};

export default function ProfileScreen({
  currentStudent,
  onEditProfile,
  onCampusSelection,
  onCourseSelection,
  onFitnessGoals,
  onEatAllergies,
  onNotifications,
  onPrivacySecurity,
  onLogout,
  onDeleteAccount,
  onOpenAdmin,
  onOpenMentorHub,
}) {
  const { isDark, colors, setTheme } = useTheme();
  const { profile, grantMentorRole, isMentor } = useApp();
  const styles = createStyles(colors, isDark);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mentorInvite, setMentorInvite] = useState(null);
  const [bioOn, setBioOn] = useState(false);
  const [bioLabel, setBioLabel] = useState('');

  const danger = isDark ? '#F87171' : '#B42318';

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadAdminState().then((state) => {
        if (alive) setMentorInvite(inviteForStudent(state.invites, profile));
      });
      canUseBiometrics().then(async (can) => {
        if (!alive || !can) {
          if (alive) setBioOn(false);
          return;
        }
        const [on, label] = await Promise.all([isUnlockEnabled(), biometricLabel()]);
        if (!alive) return;
        setBioOn(on);
        setBioLabel(label);
      });
      return () => {
        alive = false;
      };
    }, [profile])
  );

  const name = currentStudent?.name || 'Student';
  const campus = currentStudent?.campus || 'APK';
  const avatarUrl = currentStudent?.avatarUrl || initialAvatar(name) || DEFAULT_AVATAR;
  const meta = [
    currentStudent?.course,
    currentStudent?.yearOfStudy,
    genderLabel(currentStudent?.gender),
  ]
    .filter(Boolean)
    .join(' · ');
  const weeklyTarget = currentStudent?.weeklyTarget || 4;
  const goal =
    GOAL_LABELS[currentStudent?.fitnessGoal] || currentStudent?.fitnessGoal || 'Build Muscle';
  const foodRemaining = currentStudent?.foodBudgetRemaining ?? 340;

  const handleLogOut = async () => {
    if (!onLogout) return;
    setLoggingOut(true);
    try {
      await onLogout();
    } catch (error) {
      Alert.alert('Log out failed', error.message);
      setLoggingOut(false);
    }
  };

  const handleDeleteAccount = () => {
    if (!onDeleteAccount || deleting) return;
    Alert.alert(
      'Delete account',
      'This removes your Supabase login and wipes meals, community, workout, and mentor data saved on this device.',
      [
        { text: 'Keep account', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await onDeleteAccount();
            } catch (error) {
              Alert.alert('Could not delete account', error.message);
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const unlockMentorDemo = async () => {
    grantMentorRole();
    try {
      const { seedDemoMentorship } = require('../../features/mentors/lib/mentorRequests');
      await seedDemoMentorship(
        profile.userId || currentStudent?.id || 'guest',
        profile.name || name || 'Mentor'
      );
    } catch {
      /* demo seed optional */
    }
    Alert.alert('Mentor Hub unlocked', 'Same login — student tabs stay. Opening Mentor Hub.');
    onOpenMentorHub?.();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <InspoBackground plate="profile" />

      <Animated.View entering={FadeIn.duration(380)} style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={[styles.brand, { color: colors.text }]}>U</Text>
          <Text style={[styles.brand, { color: colors.brand }]}>FITNESS</Text>
        </View>
        <Pressable onPress={onNotifications} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
        </Pressable>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Identity — open on the plate, not boxed */}
        <Animated.View entering={FadeInDown.duration(420).delay(40)} style={styles.identity}>
          <Pressable onPress={onEditProfile} style={styles.avatarPress}>
            <View style={styles.avatarRing}>
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              <View style={[styles.avatar, styles.avatarFallback, styles.avatarBehind]}>
                <Text style={styles.avatarFallbackText}>{name.charAt(0)}</Text>
              </View>
            </View>
            <Text style={styles.editHint}>Edit</Text>
          </Pressable>

          <Text style={styles.name}>{name}</Text>
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
          <Text style={styles.campusLine}>{campus} · UJ</Text>
        </Animated.View>

        {/* One signal strip — two facts, one surface */}
        <Animated.View entering={FadeInDown.duration(420).delay(90)} style={styles.signal}>
          <Pressable style={styles.signalCell} onPress={onFitnessGoals}>
            <Text style={styles.signalLabel}>Goal</Text>
            <Text style={styles.signalValue} numberOfLines={1}>
              {goal}
            </Text>
            <Text style={styles.signalCaption}>{weeklyTarget} days / week</Text>
          </Pressable>
          <View style={styles.signalRule} />
          <Pressable style={styles.signalCell} onPress={onEatAllergies}>
            <Text style={styles.signalLabel}>Food</Text>
            <Text style={styles.signalValue} numberOfLines={1}>
              R {foodRemaining}
            </Text>
            <Text style={styles.signalCaption}>left this week</Text>
          </Pressable>
        </Animated.View>

        {mentorInvite ? (
          <Animated.View entering={FadeInDown.duration(400).delay(120)} style={styles.inviteCard}>
            <Text style={styles.inviteKicker}>Invite</Text>
            <Text style={styles.inviteTitle}>Mentor at UJ</Text>
            <Text style={styles.inviteCopy}>{mentorInvite.message}</Text>
            <View style={styles.inviteRow}>
              <Pressable
                style={styles.inviteYes}
                onPress={async () => {
                  await respondMentorInvite(mentorInvite.id, 'accepted', {
                    id: profile.userId || `mentor-${Date.now()}`,
                    name: profile.name || name,
                    expertise: profile.fitnessGoal || 'Fitness',
                    year: profile.yearOfStudy || '3rd Year',
                    level: profile.experienceLevel || 'Intermediate',
                    campus: profile.campus || campus,
                    photo: avatarUrl,
                    quote: 'I trained here first. I can help you stay consistent on campus.',
                    appearAsMentor: profile.privacy?.appearAsMentor !== false,
                  });
                  grantMentorRole();
                  setMentorInvite(null);
                  hapticSuccess();
                  Alert.alert(
                    'Mentor Hub unlocked',
                    'You keep the full student app. Open Community → Mentor Hub for mentees, progress, and guidance.'
                  );
                }}
              >
                <Text style={styles.inviteYesText}>Accept</Text>
              </Pressable>
              <Pressable
                style={styles.inviteNo}
                onPress={async () => {
                  await respondMentorInvite(mentorInvite.id, 'declined');
                  setMentorInvite(null);
                }}
              >
                <Text style={styles.inviteNoText}>Not now</Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.duration(420).delay(140)}>
          <Text style={styles.sectionLabel}>You</Text>
          <View style={styles.group}>
            {isMentor ? (
              <SettingsRow
                icon="ribbon-outline"
                label="Mentor Hub"
                caption="Mentees · progress · guidance"
                onPress={onOpenMentorHub}
                colors={colors}
                styles={styles}
                accent
              />
            ) : (
              <SettingsRow
                icon="ribbon-outline"
                label="Try Mentor Hub"
                caption="Demo unlock on this account"
                onPress={unlockMentorDemo}
                colors={colors}
                styles={styles}
              />
            )}
            <Hairline styles={styles} />
            <SettingsRow
              icon="school-outline"
              label="Campus & course"
              caption="APK · APB · DFC · SWC"
              onPress={onCampusSelection || onCourseSelection}
              colors={colors}
              styles={styles}
            />
            <Hairline styles={styles} />
            <SettingsRow
              icon="barbell-outline"
              label="Goals & training"
              caption="Goal, experience, days"
              onPress={onFitnessGoals}
              colors={colors}
              styles={styles}
            />
            <Hairline styles={styles} />
            <SettingsRow
              icon="nutrition-outline"
              label="Eat & allergies"
              caption="Diet filters for meals"
              onPress={onEatAllergies}
              colors={colors}
              styles={styles}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(420).delay(180)}>
          <Text style={styles.sectionLabel}>App</Text>
          <View style={styles.group}>
            <View style={styles.rowInner}>
              <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={20} color="#C9C9C9" />
              <View style={styles.rowCopy}>
                <Text style={styles.rowLabel}>Appearance</Text>
                <Text style={styles.rowCaption}>Light or dark</Text>
              </View>
            </View>
            <View style={styles.themeToggle}>
              <Pressable
                onPress={() => setTheme('light')}
                style={[styles.themeOption, !isDark && styles.themeOptionActive]}
              >
                <Text style={[styles.themeOptionText, !isDark && styles.themeOptionTextActive]}>
                  Light
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setTheme('dark')}
                style={[styles.themeOption, isDark && styles.themeOptionActive]}
              >
                <Text style={[styles.themeOptionText, isDark && styles.themeOptionTextActive]}>
                  Dark
                </Text>
              </Pressable>
            </View>
            <Hairline styles={styles} />
            <SettingsRow
              icon="notifications-outline"
              label="Notifications"
              onPress={onNotifications}
              colors={colors}
              styles={styles}
            />
            <Hairline styles={styles} />
            <SettingsRow
              icon="shield-checkmark-outline"
              label="Privacy & security"
              onPress={onPrivacySecurity}
              colors={colors}
              styles={styles}
            />
            {bioLabel ? (
              <>
                <Hairline styles={styles} />
                <SettingsRow
                  icon="finger-print-outline"
                  label={bioOn ? `Turn off ${bioLabel}` : `${bioLabel} unlock is off`}
                  onPress={() => {
                    if (!bioOn) {
                      Alert.alert(
                        `${bioLabel} unlock`,
                        'Sign out, then sign in with your password and choose Enable when asked.'
                      );
                      return;
                    }
                    disableUnlock().then(() => setBioOn(false));
                  }}
                  colors={colors}
                  styles={styles}
                />
              </>
            ) : null}
            {onOpenAdmin ? (
              <>
                <Hairline styles={styles} />
                <SettingsRow
                  icon="bar-chart-outline"
                  label="Campus Admin"
                  onPress={onOpenAdmin}
                  colors={colors}
                  styles={styles}
                  accent
                />
              </>
            ) : null}
          </View>
        </Animated.View>

        <Pressable
          style={styles.signOutButton}
          onPress={handleLogOut}
          disabled={loggingOut || deleting}
        >
          {loggingOut ? (
            <ActivityIndicator color={colors.brand} />
          ) : (
            <Text style={styles.signOutText}>Sign out</Text>
          )}
        </Pressable>
        {onDeleteAccount ? (
          <Pressable
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
            disabled={loggingOut || deleting}
          >
            {deleting ? (
              <ActivityIndicator color={danger} />
            ) : (
              <Text style={[styles.deleteText, { color: danger }]}>Delete account</Text>
            )}
          </Pressable>
        ) : null}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({ icon, label, caption, onPress, colors, styles, accent }) {
  return (
    <PressScale
      style={styles.rowPress}
      onPress={() => {
        hapticLight();
        onPress?.();
      }}
    >
      <View style={styles.rowInner}>
        <Ionicons name={icon} size={20} color={accent ? colors.brand : '#C9C9C9'} />
        <View style={styles.rowCopy}>
          <Text style={styles.rowLabel} numberOfLines={1}>
            {label}
          </Text>
          {caption ? <Text style={styles.rowCaption}>{caption}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.28)" />
      </View>
    </PressScale>
  );
}

function Hairline({ styles }) {
  return <View style={styles.hairline} />;
}

function createStyles(colors, isDark) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'transparent' },
    scroll: {
      flex: 1,
      minHeight: 0,
      ...(Platform.OS === 'web' ? { overflow: 'scroll' } : null),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.screen,
      paddingVertical: 10,
    },
    brandRow: { flexDirection: 'row', alignItems: 'center' },
    brand: {
      ...display,
      fontSize: 20,
    },
    headerBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      paddingHorizontal: spacing.screen,
      paddingBottom: 110,
    },
    identity: {
      alignItems: 'center',
      paddingTop: 8,
      paddingBottom: 22,
    },
    avatarPress: { alignItems: 'center' },
    avatarRing: {
      width: 104,
      height: 104,
      borderRadius: 52,
      borderWidth: 1.5,
      borderColor: 'rgba(255,106,0,0.55)',
      padding: 3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatar: { width: 94, height: 94, borderRadius: 47 },
    avatarBehind: { position: 'absolute', zIndex: -1 },
    avatarFallback: {
      backgroundColor: colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarFallbackText: { color: '#FFFFFF', fontWeight: '700', fontSize: 36 },
    editHint: {
      marginTop: 8,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.brand,
    },
    name: {
      ...display,
      fontSize: 34,
      color: '#FFFFFF',
      marginTop: 14,
      textAlign: 'center',
    },
    meta: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 20,
      color: 'rgba(255,255,255,0.62)',
      textAlign: 'center',
      paddingHorizontal: 12,
    },
    campusLine: {
      marginTop: 6,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: 'rgba(255,178,122,0.9)',
      textAlign: 'center',
    },
    signal: {
      ...PHOTO_GLASS,
      borderRadius: radius.card,
      flexDirection: 'row',
      alignItems: 'stretch',
      marginBottom: 8,
      overflow: 'hidden',
    },
    signalCell: {
      flex: 1,
      paddingVertical: 16,
      paddingHorizontal: 14,
    },
    signalRule: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: 'rgba(255,255,255,0.16)',
      marginVertical: 14,
    },
    signalLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.3,
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.45)',
    },
    signalValue: {
      marginTop: 8,
      fontSize: 17,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    signalCaption: {
      marginTop: 4,
      fontSize: 12,
      color: 'rgba(255,255,255,0.5)',
    },
    sectionLabel: {
      marginTop: 28,
      marginBottom: 10,
      marginLeft: 2,
      fontSize: type.kicker,
      fontWeight: type.kickerWeight,
      letterSpacing: type.kickerTracking,
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.38)',
    },
    group: {
      ...PHOTO_GLASS,
      borderRadius: radius.card,
      overflow: 'hidden',
    },
    rowPress: { width: '100%' },
    rowInner: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 15,
    },
    rowCopy: { flexGrow: 1, flexShrink: 1, marginHorizontal: 12 },
    rowLabel: { fontSize: 15.5, color: '#FFFFFF', fontWeight: '600' },
    rowCaption: { color: 'rgba(255,255,255,0.45)', fontSize: 12.5, marginTop: 2 },
    hairline: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: 'rgba(255,255,255,0.1)',
      marginLeft: 46,
    },
    themeToggle: {
      flexDirection: 'row',
      marginHorizontal: 14,
      marginBottom: 12,
      padding: 3,
      borderRadius: radius.input,
      gap: 3,
      backgroundColor: 'rgba(0,0,0,0.28)',
    },
    themeOption: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 9,
      borderRadius: 4,
    },
    themeOptionActive: { backgroundColor: 'rgba(255,255,255,0.12)' },
    themeOptionText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.45)' },
    themeOptionTextActive: { color: '#FFFFFF' },
    signOutButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 18,
      marginTop: 28,
    },
    signOutText: {
      color: colors.brand,
      fontWeight: '700',
      fontSize: 14,
      letterSpacing: 0.6,
    },
    deleteButton: {
      alignItems: 'center',
      paddingVertical: 8,
      marginBottom: 8,
    },
    deleteText: {
      fontWeight: '600',
      fontSize: 13,
      opacity: 0.85,
    },
    inviteCard: {
      ...PHOTO_GLASS,
      borderRadius: radius.card,
      padding: 16,
      marginTop: 18,
    },
    inviteKicker: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: colors.brand,
    },
    inviteTitle: {
      ...display,
      fontSize: 22,
      color: '#FFFFFF',
      marginTop: 6,
    },
    inviteCopy: { fontSize: 13, lineHeight: 19, marginTop: 8, color: 'rgba(255,255,255,0.62)' },
    inviteRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
    inviteYes: {
      flex: 1,
      backgroundColor: colors.brand,
      borderRadius: radius.pill,
      paddingVertical: 11,
      alignItems: 'center',
    },
    inviteYesText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
    inviteNo: {
      flex: 1,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.18)',
      borderRadius: radius.pill,
      paddingVertical: 11,
      alignItems: 'center',
    },
    inviteNoText: { fontWeight: '700', fontSize: 13, color: colors.text },
  });
}
