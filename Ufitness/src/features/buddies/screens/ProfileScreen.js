// screens/ProfileScreen.js
//
// Profile tab styled to match the UFitness Figma mockup:
// app header, avatar with edit badge, goal / food budget stat cards,
// grouped settings rows, and an outlined sign out button.

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { logOut } from '../services/authService';

const BRAND = '#8C3A12';
const ACCENT = '#E8722C';
const BG = '#FFFFFF';
const CARD = '#F5F7F8';
const TEXT = '#1F2933';
const MUTED = '#6B7280';

// Props:
// currentStudent: { name, campus, fitnessGoal, experienceLevel,
//                   preferredSchedule, workoutLocation, avatarUrl?,
//                   course?, yearOfStudy?, weeklyTarget?, foodBudgetRemaining? }
// onEditProfile?, onCampusSelection?, onFitnessGoals?,
// onNotifications?, onPrivacySecurity? - row handlers (optional)
export default function ProfileScreen({
  currentStudent,
  onEditProfile,
  onCampusSelection,
  onFitnessGoals,
  onNotifications,
  onPrivacySecurity,
}) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogOut = async () => {
    setLoggingOut(true);
    try {
      await logOut();
      // RootNavigator's auth listener switches back to the Auth flow.
    } catch (error) {
      Alert.alert('Log out failed', error.message);
      setLoggingOut(false);
    }
  };

  // Subtitle under the name, e.g. "BCom Informatics, 3rd Year".
  // Falls back to experience level if course/year aren't on the profile yet.
  const subtitle =
    currentStudent.course && currentStudent.yearOfStudy
      ? `${currentStudent.course}, ${currentStudent.yearOfStudy}`
      : currentStudent.experienceLevel;

  const weeklyTarget =
    currentStudent.weeklyTarget || (currentStudent.preferredSchedule || []).length;

  return (
    <View style={styles.screen}>
      {/* App header */}
      <View style={styles.header}>
        {currentStudent.avatarUrl ? (
          <Image source={{ uri: currentStudent.avatarUrl }} style={styles.headerAvatar} />
        ) : (
          <View style={[styles.headerAvatar, styles.headerAvatarFallback]}>
            <Text style={styles.headerAvatarText}>{currentStudent.name.charAt(0)}</Text>
          </View>
        )}
        <Text style={styles.brand}>UFitness</Text>
        <View style={{ flex: 1 }} />
        <Icon name="notifications-outline" size={24} color={TEXT} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar + identity */}
        <View style={styles.avatarWrap}>
          {currentStudent.avatarUrl ? (
            <Image source={{ uri: currentStudent.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{currentStudent.name.charAt(0)}</Text>
            </View>
          )}
          <Pressable style={styles.editBadge} onPress={onEditProfile}>
            <Icon name="pencil" size={15} color="#fff" />
          </Pressable>
        </View>

        <Text style={styles.name}>{currentStudent.name}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.campusPill}>
          <Icon name="location-outline" size={13} color="#0F766E" />
          <Text style={styles.campusText}>{currentStudent.campus} Campus</Text>
        </View>

        {/* Stat cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Icon name="radio-button-on" size={17} color="#0F766E" />
              <Text style={styles.statLabel}>GOAL</Text>
            </View>
            <Text style={styles.statValue}>{currentStudent.fitnessGoal}</Text>
            <Text style={styles.statCaption}>{weeklyTarget} days/week target</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Icon name="card-outline" size={17} color={ACCENT} />
              <Text style={styles.statLabel}>FOOD BUDGET</Text>
            </View>
            <Text style={styles.statValue}>R {currentStudent.foodBudgetRemaining ?? 0}</Text>
            <Text style={styles.statCaption}>Weekly remaining</Text>
          </View>
        </View>

        {/* Account & profile */}
        <Text style={styles.sectionLabel}>ACCOUNT & PROFILE</Text>
        <View style={styles.group}>
          <SettingsRow icon="person-outline" label="Edit Profile Details" onPress={onEditProfile} />
          <Divider />
          <SettingsRow
            icon="school-outline"
            label="Campus Selection (APK/APB/DFC)"
            onPress={onCampusSelection}
          />
          <Divider />
          <SettingsRow
            icon="barbell-outline"
            label="Fitness Goals & Assessments"
            onPress={onFitnessGoals}
          />
        </View>

        {/* App settings */}
        <Text style={styles.sectionLabel}>APP SETTINGS</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="notifications-outline"
            label="Notifications"
            onPress={onNotifications}
          />
          <Divider />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Privacy & Security"
            onPress={onPrivacySecurity}
          />
        </View>

        {/* Sign out */}
        <Pressable style={styles.signOutButton} onPress={handleLogOut} disabled={loggingOut}>
          {loggingOut ? (
            <ActivityIndicator color="#1F3A5F" />
          ) : (
            <>
              <Icon name="log-out-outline" size={19} color="#1F3A5F" />
              <Text style={styles.signOutText}>SIGN OUT</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SettingsRow({ icon, label, onPress }) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress}>
      <Icon name={icon} size={21} color={BRAND} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Icon name="chevron-forward" size={19} color="#9CA3AF" />
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

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
  headerAvatarFallback: { backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  brand: { fontSize: 21, fontWeight: '800', color: BRAND, letterSpacing: 0.2 },

  content: { padding: 16, paddingBottom: 32, alignItems: 'center' },

  avatarWrap: { marginTop: 12 },
  avatar: { width: 118, height: 118, borderRadius: 59, borderWidth: 4, borderColor: '#fff' },
  avatarFallback: { backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 40 },
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

  name: { fontSize: 25, fontWeight: '700', color: TEXT, marginTop: 14 },
  subtitle: { fontSize: 15, color: MUTED, marginTop: 4 },

  campusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#CFF3EC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 10,
  },
  campusText: { color: '#0F766E', fontSize: 13, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 12, marginTop: 22, width: '100%' },
  statCard: { flex: 1, backgroundColor: CARD, borderRadius: 14, padding: 14 },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabel: { fontSize: 11.5, fontWeight: '700', color: MUTED, letterSpacing: 0.6 },
  statValue: { fontSize: 20, fontWeight: '700', color: TEXT, marginTop: 8 },
  statCaption: { fontSize: 12.5, color: MUTED, marginTop: 4 },

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

  group: { width: '100%', backgroundColor: CARD, borderRadius: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 17 },
  rowPressed: { backgroundColor: '#ECEFF1' },
  rowIcon: { marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 15.5, color: TEXT },
  divider: { height: 1, backgroundColor: '#E4E8EA', marginLeft: 14 },

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
});
