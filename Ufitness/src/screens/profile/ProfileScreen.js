import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { DEFAULT_AVATAR } from '../../data/profileAvatars';
import { genderLabel } from '../../data/genderOptions';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { inviteForStudent, loadAdminState, respondMentorInvite } from '../../features/admin/lib/adminStore';

const BRAND = '#8C3A12';
const ACCENT = '#E8722C';

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
}) {
  const { isDark, colors, setTheme } = useTheme();
  const { profile } = useApp();
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mentorInvite, setMentorInvite] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadAdminState().then((state) => {
        if (alive) setMentorInvite(inviteForStudent(state.invites, profile));
      });
      return () => {
        alive = false;
      };
    }, [profile])
  );
  const name = currentStudent?.name || 'Student';
  const campus = currentStudent?.campus || 'APK';
  const avatarUrl = currentStudent?.avatarUrl || DEFAULT_AVATAR;
  const subtitle = [currentStudent?.course, currentStudent?.yearOfStudy].filter(Boolean).join(', ')
    || currentStudent?.experienceLevel
    || 'UJ student';
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
      'This removes your Firebase login and wipes meals, community, workout, and mentor data saved on this device.',
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

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.headerAvatar} />
        ) : (
          <View style={[styles.headerAvatar, styles.headerAvatarFallback]}>
            <Text style={styles.headerAvatarText}>{name.charAt(0)}</Text>
          </View>
        )}
        <Text style={[styles.brand, { color: colors.brand }]}>UFitness</Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={onNotifications} hitSlop={8}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarWrap}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View style={[styles.avatar, styles.avatarFallback, styles.avatarBehind]}>
            <Text style={styles.avatarFallbackText}>{name.charAt(0)}</Text>
          </View>
          <Pressable style={styles.editBadge} onPress={onEditProfile}>
            <Ionicons name="pencil" size={15} color="#fff" />
          </Pressable>
        </View>

        <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>
        {genderLabel(currentStudent?.gender) ? (
          <Text style={[styles.subtitle, { color: colors.muted }]}>{genderLabel(currentStudent.gender)}</Text>
        ) : null}

        <View style={[styles.campusPill, { backgroundColor: isDark ? colors.overlay : '#CFF3EC' }]}>
          <Ionicons name="location-outline" size={13} color="#0F766E" />
          <Text style={styles.campusText}>{campus} Campus</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.overlay }]}>
            <View style={styles.statHeader}>
              <Ionicons name="radio-button-on" size={17} color="#0F766E" />
              <Text style={[styles.statLabel, { color: colors.muted }]}>GOAL</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{goal}</Text>
            <Text style={[styles.statCaption, { color: colors.muted }]}>{weeklyTarget} days/week target</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.overlay }]}>
            <View style={styles.statHeader}>
              <Ionicons name="card-outline" size={17} color={ACCENT} />
              <Text style={[styles.statLabel, { color: colors.muted }]}>FOOD BUDGET</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>R {foodRemaining}</Text>
            <Text style={[styles.statCaption, { color: colors.muted }]}>Weekly remaining</Text>
          </View>
        </View>

        {mentorInvite ? (
          <View style={[styles.inviteCard, { backgroundColor: colors.overlay }]}>
            <Text style={[styles.inviteTitle, { color: colors.text }]}>Mentor invite</Text>
            <Text style={[styles.inviteCopy, { color: colors.muted }]}>{mentorInvite.message}</Text>
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
                  });
                  setMentorInvite(null);
                  Alert.alert('You are on the mentor list', 'Other students can now find you under Community → Mentors.');
                }}
              >
                <Text style={styles.inviteYesText}>Yes, I will mentor</Text>
              </Pressable>
              <Pressable
                style={[styles.inviteNo, { borderColor: colors.border }]}
                onPress={async () => {
                  await respondMentorInvite(mentorInvite.id, 'declined');
                  setMentorInvite(null);
                }}
              >
                <Text style={[styles.inviteNoText, { color: colors.text }]}>Not now</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Text style={[styles.sectionLabel, { color: isDark ? '#D6B09A' : '#9A6B52' }]}>ACCOUNT & PROFILE</Text>
        <View style={[styles.group, { backgroundColor: colors.overlay }]}>
          <SettingsRow icon="person-outline" label="Edit Profile Details" onPress={onEditProfile} colors={colors} />
          <Divider colors={colors} />
          <SettingsRow
            icon="school-outline"
            label="Campus Selection (APK/APB/DFC)"
            onPress={onCampusSelection}
            colors={colors}
          />
          <Divider colors={colors} />
          <SettingsRow
            icon="library-outline"
            label="Course of Study"
            onPress={onCourseSelection || onEditProfile}
            colors={colors}
          />
          <Divider colors={colors} />
          <SettingsRow
            icon="barbell-outline"
            label="Fitness Goals & Assessments"
            onPress={onFitnessGoals}
            colors={colors}
          />
          <Divider colors={colors} />
          <SettingsRow
            icon="nutrition-outline"
            label="Eat & Allergies"
            onPress={onEatAllergies}
            colors={colors}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: isDark ? '#D6B09A' : '#9A6B52' }]}>APP SETTINGS</Text>
        <View style={[styles.group, { backgroundColor: colors.overlay }]}>
          <View style={styles.rowInner}>
            <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={21} color={colors.brand} />
            <View style={{ flexGrow: 1, flexShrink: 1, marginHorizontal: 12 }}>
              <Text style={[styles.rowLabel, { color: colors.text, marginHorizontal: 0 }]}>Appearance</Text>
              <Text style={{ color: colors.muted, fontSize: 12.5, marginTop: 2 }}>
                Light and dark mode
              </Text>
            </View>
          </View>
          <View style={[styles.themeToggle, { backgroundColor: isDark ? '#2A2624' : '#E7EBED' }]}>
            <Pressable
              onPress={() => setTheme('light')}
              style={[styles.themeOption, !isDark && { backgroundColor: colors.card }]}
            >
              <Ionicons name="sunny" size={16} color={!isDark ? ACCENT : colors.muted} />
              <Text style={[styles.themeOptionText, { color: !isDark ? colors.text : colors.muted }]}>
                Light
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTheme('dark')}
              style={[styles.themeOption, isDark && { backgroundColor: colors.card }]}
            >
              <Ionicons name="moon" size={16} color={isDark ? ACCENT : colors.muted} />
              <Text style={[styles.themeOptionText, { color: isDark ? colors.text : colors.muted }]}>
                Dark
              </Text>
            </Pressable>
          </View>
          <Divider colors={colors} />
          <SettingsRow
            icon="notifications-outline"
            label="Notifications"
            onPress={onNotifications}
            colors={colors}
          />
          <Divider colors={colors} />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Privacy & Security"
            onPress={onPrivacySecurity}
            colors={colors}
          />
          {onOpenAdmin ? (
            <>
              <Divider colors={colors} />
              <SettingsRow
                icon="bar-chart-outline"
                label="Campus Admin"
                onPress={onOpenAdmin}
                colors={colors}
              />
            </>
          ) : null}
        </View>

        <Pressable
          style={[styles.signOutButton, { borderColor: colors.signOut }]}
          onPress={handleLogOut}
          disabled={loggingOut || deleting}
        >
          {loggingOut ? (
            <ActivityIndicator color={colors.signOut} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={19} color={colors.signOut} />
              <Text style={[styles.signOutText, { color: colors.signOut }]}>SIGN OUT</Text>
            </>
          )}
        </Pressable>
        {onDeleteAccount ? (
          <Pressable
            style={[styles.signOutButton, styles.deleteAccountButton]}
            onPress={handleDeleteAccount}
            disabled={loggingOut || deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#B42318" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={19} color="#B42318" />
                <Text style={[styles.signOutText, styles.deleteAccountText]}>DELETE ACCOUNT</Text>
              </>
            )}
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({ icon, label, onPress, colors }) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.rowPress}>
      <View style={styles.rowInner}>
        <Ionicons name={icon} size={21} color={colors?.brand || BRAND} />
        <Text style={[styles.rowLabel, { color: colors?.text || '#1F2933' }]} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name="chevron-forward" size={19} color={colors?.muted || '#9CA3AF'} />
      </View>
    </TouchableOpacity>
  );
}

function Divider({ colors }) {
  return <View style={[styles.divider, { backgroundColor: colors?.border || '#E4E8EA' }]} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: {
    flex: 1,
    minHeight: 0,
    ...(Platform.OS === 'web' ? { overflow: 'scroll' } : null),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F3',
    gap: 10,
  },
  headerAvatar: { width: 34, height: 34, borderRadius: 17 },
  brand: { fontSize: 21, fontWeight: '800', color: BRAND, letterSpacing: 0.2 },
  content: { padding: 16, paddingBottom: 40 },
  avatarWrap: { marginTop: 12, alignSelf: 'center' },
  avatar: { width: 118, height: 118, borderRadius: 59, borderWidth: 4, borderColor: '#fff' },
  avatarBehind: { position: 'absolute', zIndex: -1 },
  avatarFallback: { backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { color: '#fff', fontWeight: '700', fontSize: 40 },
  headerAvatarFallback: { backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  editBadge: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: { fontSize: 25, fontWeight: '700', color: '#1F2933', marginTop: 14, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  campusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 5,
    backgroundColor: '#CFF3EC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 10,
  },
  campusText: { color: '#0F766E', fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 22, width: '100%' },
  statCard: { flex: 1, backgroundColor: '#F5F7F8', borderRadius: 14, padding: 14 },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabel: { fontSize: 11.5, fontWeight: '700', color: '#6B7280', letterSpacing: 0.6 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#1F2933', marginTop: 8 },
  statCaption: { fontSize: 12.5, color: '#6B7280', marginTop: 4 },
  sectionLabel: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    color: '#9A6B52',
    letterSpacing: 0.7,
    marginTop: 24,
    marginBottom: 8,
    paddingLeft: 4,
  },
  group: { width: '100%', backgroundColor: '#F5F7F8', borderRadius: 14, overflow: 'hidden' },
  rowPress: { width: '100%' },
  rowInner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 17,
  },
  rowPressed: { backgroundColor: '#ECEFF1' },
  rowLabel: { flexGrow: 1, flexShrink: 1, fontSize: 15.5, color: '#1F2933', marginHorizontal: 12 },
  themeToggle: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginBottom: 14,
    padding: 4,
    borderRadius: 12,
    gap: 4,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  themeOptionText: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#E4E8EA', marginLeft: 47 },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#1F3A5F',
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 26,
  },
  signOutText: { color: '#1F3A5F', fontWeight: '700', fontSize: 14.5, letterSpacing: 0.8 },
  deleteAccountButton: {
    borderColor: '#B42318',
    marginTop: 12,
  },
  deleteAccountText: { color: '#B42318' },
  inviteCard: { width: '100%', borderRadius: 14, padding: 14, marginTop: 22 },
  inviteTitle: { fontSize: 16, fontWeight: '800' },
  inviteCopy: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  inviteRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  inviteYes: {
    flex: 1,
    backgroundColor: '#8C3A12',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  inviteYesText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  inviteNo: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  inviteNoText: { fontWeight: '700', fontSize: 13 },
});
