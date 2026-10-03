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
import { useTheme } from '../../../context/ThemeContext';

const display = { fontFamily: 'Anton_400Regular', letterSpacing: 0.8 };

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
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
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

  const SettingsRow = ({ icon, label, onPress }) => (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress}>
      <Icon name={icon} size={21} color={colors.brand} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Icon name="chevron-forward" size={19} color={colors.muted} />
    </Pressable>
  );

  const Divider = () => <View style={styles.divider} />;

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
        <Icon name="notifications-outline" size={24} color={colors.text} />
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
          <Icon name="location-outline" size={13} color={isDark ? '#5EEAD4' : '#0F766E'} />
          <Text style={styles.campusText}>{currentStudent.campus} Campus</Text>
        </View>

        {/* Stat cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Icon name="radio-button-on" size={17} color={colors.brand} />
              <Text style={styles.statLabel}>GOAL</Text>
            </View>
            <Text style={styles.statValue}>{currentStudent.fitnessGoal}</Text>
            <Text style={styles.statCaption}>{weeklyTarget} days/week target</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Icon name="card-outline" size={17} color={colors.brand} />
              <Text style={styles.statLabel}>FOOD BUDGET</Text>
            </View>
            <Text style={styles.statValue}>R {currentStudent.foodBudgetRemaining ?? 0}</Text>
            <Text style={styles.statCaption}>Weekly remaining</Text>
          </View>
        </View>

        {/* Account & profile */}
        <Text style={styles.sectionLabel}>Account & Profile</Text>
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
        <Text style={styles.sectionLabel}>App Settings</Text>
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
            <ActivityIndicator color={colors.brand} />
          ) : (
            <>
              <Icon name="log-out-outline" size={19} color={colors.brand} />
              <Text style={styles.signOutText}>SIGN OUT</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function createStyles(colors, isDark) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.tabBar,
      gap: 10,
    },
    headerAvatar: { width: 34, height: 34, borderRadius: 17 },
    headerAvatarFallback: { backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
    headerAvatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
    brand: { ...display, fontSize: 20, color: colors.brand, textTransform: 'uppercase' },

    content: { padding: 16, paddingBottom: 32, alignItems: 'center' },

    avatarWrap: { marginTop: 12 },
    avatar: { width: 118, height: 118, borderRadius: 59, borderWidth: 4, borderColor: colors.brand },
    avatarFallback: { backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 40 },
    editBadge: {
      position: 'absolute',
      right: 2,
      bottom: 4,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.background,
    },

    name: { ...display, fontSize: 26, color: colors.text, marginTop: 14, textTransform: 'uppercase' },
    subtitle: { fontSize: 15, color: colors.muted, marginTop: 4 },

    campusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: isDark ? 'rgba(20,184,166,0.16)' : '#CFF3EC',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      marginTop: 10,
    },
    campusText: { color: isDark ? '#5EEAD4' : '#0F766E', fontSize: 13, fontWeight: '600' },

    statsRow: { flexDirection: 'row', gap: 12, marginTop: 22, width: '100%' },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    statHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statLabel: { fontSize: 11.5, fontWeight: '700', color: colors.muted, letterSpacing: 0.6 },
    statValue: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 8 },
    statCaption: { fontSize: 12.5, color: colors.muted, marginTop: 4 },

    sectionLabel: {
      alignSelf: 'flex-start',
      ...display,
      fontSize: 14,
      color: colors.brand,
      marginTop: 24,
      marginBottom: 8,
      paddingLeft: 4,
      textTransform: 'uppercase',
    },

    group: {
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: 14,
      overflow: 'hidden',
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 17 },
    rowPressed: { backgroundColor: isDark ? colors.overlay : '#ECEFF1' },
    rowIcon: { marginRight: 12 },
    rowLabel: { flex: 1, fontSize: 15.5, color: colors.text },
    divider: { height: 1, backgroundColor: colors.border, marginLeft: 14 },

    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      width: '100%',
      borderWidth: 1.5,
      borderColor: colors.brand,
      borderRadius: 999,
      paddingVertical: 15,
      marginTop: 26,
    },
    signOutText: { color: colors.brand, fontWeight: '700', fontSize: 14.5, letterSpacing: 0.8 },
  });
}
