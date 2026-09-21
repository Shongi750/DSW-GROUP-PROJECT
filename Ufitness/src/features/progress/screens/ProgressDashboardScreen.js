import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../../../config/firebase';
import { ALL_BADGES } from '../services/progressService';

// ✨ Figma Colors matching your app's theme
const COLORS = {
  primary: '#BA4A0C', 
  background: '#FFFFFF',
  surface: '#F8F9FA',
  textDark: '#1A1A1A',
  textLight: '#888888',
  border: '#EEEEEE',
  success: '#2E7D32'
};

export default function ProgressDashboardScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    activeTimeMinutes: 0,
  });
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  const getCampusLabel = (value) => {
    const map = {
      APK: "Auckland Park Kingsway",
      APB: "Auckland Park Bunting",
      DFC: "Doornfontein Campus",
      SWC: "Soweto Campus",
    };
    return map[value] || value;
  };

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const currentUserId = auth.currentUser?.uid;
        if (!currentUserId) {
          setLoading(false);
          return;
        } 

        const userDocRef = doc(db, 'users', currentUserId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) setUserData(userSnap.data());

        const logsRef = collection(db, 'workout_logs');
        const q = query(logsRef, where("userId", "==", currentUserId));
        const querySnapshot = await getDocs(q);
        
        let workoutsCount = 0;
        let totalSeconds = 0;
        querySnapshot.forEach((d) => {
          workoutsCount++;
          totalSeconds += d.data().durationSeconds || 0;
        });

        setStats({
          totalWorkouts: workoutsCount,
          activeTimeMinutes: Math.round(totalSeconds / 60),
        });

        const progressDocRef = doc(db, 'user_progress', currentUserId);
        const progressSnap = await getDoc(progressDocRef);
        if (progressSnap.exists()) {
          setUnlockedBadges(progressSnap.data().unlockedBadgeIds || []);
        }
      } catch (error) {
        console.error("Error fetching progress: ", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = navigation.addListener('focus', () => {
      fetchProgress();
    });

    fetchProgress();
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Calculate percentage for the new sleek progress bar (cap at 100%)
  const weeklyGoal = 5;
  const progressPercentage = Math.min((stats.totalWorkouts / weeklyGoal) * 100, 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>
            Hello, {userData?.name ? userData.name.split(' ')[0] : 'Student'}!
          </Text>
          <Text style={styles.headerSubtitle}>Keep up the momentum. You're doing great!</Text>
        </View>

        {/* Structured Profile Card */}
        {userData && (
          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Campus</Text>
              <Text style={styles.profileValue}>{getCampusLabel(userData.campus)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Goal</Text>
              <Text style={styles.profileValue}>{userData.goal || 'Not set'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Level</Text>
              <Text style={styles.profileValue}>{userData.level || 'Not set'}</Text>
            </View>
          </View>
        )}

        {/* Clean Weekly Progress Bar (Replaces the weird dots) */}
        <View style={styles.weeklyGoalCard}>
          <View style={styles.weeklyGoalHeader}>
            <Text style={styles.sectionTitle}>Weekly Goal</Text>
            <Text style={styles.weeklyGoalText}>{stats.totalWorkouts} / {weeklyGoal} Workouts</Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
          </View>
        </View>

        {/* 2x2 Stats Grid in neatly boxed cards */}
        <View style={styles.gridContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Workouts</Text>
            <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Time</Text>
            <Text style={styles.statValue}>{stats.activeTimeMinutes} <Text style={styles.statUnit}>mins</Text></Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Calories Burned</Text>
            <Text style={styles.statValue}>~{stats.activeTimeMinutes * 8} <Text style={styles.statUnit}>kcal</Text></Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Current Streak</Text>
            <Text style={styles.statValue}>{stats.totalWorkouts > 0 ? '🔥 Active' : 'None'}</Text>
          </View>
        </View>

        {/* Achievement Badges in a Horizontal Scroll */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Achievement Badges</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesScroll}>
            {ALL_BADGES.map((badge) => {
              const isUnlocked = unlockedBadges.includes(badge.id);
              return (
                <View key={badge.id} style={[styles.badgeCard, !isUnlocked && styles.badgeCardLocked]}>
                  <Text style={[styles.badgeIcon, !isUnlocked && styles.badgeIconLocked]}>
                    {isUnlocked ? badge.icon : '🔒'}
                  </Text>
                  <Text style={[styles.badgeTitle, !isUnlocked && styles.badgeTextLocked]} numberOfLines={1}>
                    {badge.title}
                  </Text>
                  <Text style={styles.badgeDesc} numberOfLines={2}>{badge.description}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('ProfileEdit')}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={() => signOut(auth)}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  headerContainer: { marginTop: 10, marginBottom: 24 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: COLORS.textDark, marginBottom: 6 },
  headerSubtitle: { fontSize: 15, color: COLORS.textLight, fontWeight: '500' },

  // Profile Card Styles
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  profileLabel: { fontSize: 14, color: COLORS.textLight, fontWeight: '600' },
  profileValue: { fontSize: 14, color: COLORS.textDark, fontWeight: '700' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },

  // Sleek Progress Bar Styles
  weeklyGoalCard: { marginBottom: 32 },
  weeklyGoalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textDark },
  weeklyGoalText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  progressBarBackground: { height: 10, backgroundColor: COLORS.surface, borderRadius: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 10 },

  // 2x2 Stats Grid Styles
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 32 },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: { fontSize: 12, color: COLORS.textLight, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.textDark },
  statUnit: { fontSize: 14, fontWeight: '600', color: COLORS.textLight },

  // Achievement Badges Styles
  achievementsSection: { marginBottom: 40 },
  badgesScroll: { gap: 16, paddingRight: 20, marginTop: 16 },
  badgeCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    width: 140,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeCardLocked: { backgroundColor: '#F9F9F9', borderColor: '#F0F0F0', opacity: 0.7 },
  badgeIcon: { fontSize: 36, marginBottom: 10 },
  badgeIconLocked: { fontSize: 28, color: '#CCCCCC' },
  badgeTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textDark, textAlign: 'center', marginBottom: 4 },
  badgeTextLocked: { color: COLORS.textLight },
  badgeDesc: { fontSize: 11, color: COLORS.textLight, textAlign: 'center', lineHeight: 16 },
  
  // Action Buttons
  editButton: { backgroundColor: COLORS.textDark, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  editButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  logoutButton: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutButtonText: { color: '#D32F2F', fontWeight: '700', fontSize: 16 }
});