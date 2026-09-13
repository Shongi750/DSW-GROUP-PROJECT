import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../../../config/firebase';
import { ALL_BADGES } from '../services/progressService';

export default function ProgressDashboardScreen({ navigation }) {
  const [userData, setUserData] = useState(null); // ✨ NEW: State for user profile data
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    activeTimeMinutes: 0,
  });
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to map campus codes to friendly names
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
        if (!currentUserId) return; 

        // ✨ 1. Fetch User Profile Data (Name, Campus, Goal)
        const userDocRef = doc(db, 'users', currentUserId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }

        // 2. Fetch workout logs
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

        // 3. Fetch unlocked badges
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

    // Refresh when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProgress();
    });

    fetchProgress();
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* ✨ NEW: Personalized Greeting */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>
            Hello, {userData?.name ? userData.name.split(' ')[0] : 'Student'}!
          </Text>
          <Text style={styles.headerSubtitle}>Keep up the momentum. You're doing great!</Text>
        </View>

        {/* ✨ NEW: Profile Summary Card */}
        {userData && (
          <View style={styles.profileSummaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Campus:</Text>
              <Text style={styles.summaryValue}>{getCampusLabel(userData.campus)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Goal:</Text>
              <Text style={styles.summaryValue}>{userData.goal || 'Not set'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Level:</Text>
              <Text style={styles.summaryValue}>{userData.level || 'Not set'}</Text>
            </View>
          </View>
        )}

        {/* 2x2 Stats Grid */}
        <View style={styles.grid}>
          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>Current Streak</Text>
            <Text style={styles.gridValue}>1 Day</Text>
          </View>
          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>Total Workouts</Text>
            <Text style={styles.gridValue}>{stats.totalWorkouts}</Text>
          </View>
          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>Calories Burned</Text>
            <Text style={styles.gridValue}>~{stats.totalWorkouts * 220} kcal</Text>
          </View>
          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>Active Time</Text>
            <Text style={styles.gridValue}>{stats.activeTimeMinutes} mins</Text>
          </View>
        </View>

        {/* Achievement Badges Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Achievement Badges</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementsList}>
            {ALL_BADGES.map((badge) => {
              const isUnlocked = unlockedBadges.includes(badge.id);
              return (
                <View 
                  key={badge.id} 
                  style={[styles.badgeCard, !isUnlocked && styles.badgeCardLocked]}
                >
                  <Text style={[styles.badgeIcon, !isUnlocked && styles.badgeIconLocked]}>
                    {isUnlocked ? badge.icon : '🔒'}
                  </Text>
                  <Text style={[styles.badgeTitle, !isUnlocked && styles.badgeTextLocked]}>
                    {badge.title}
                  </Text>
                  <Text style={styles.badgeDesc}>{badge.description}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => navigation.navigate('ProfileEdit')}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Log Out Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={() => signOut(auth)}
        >
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  headerContainer: { marginTop: 20, marginBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#666666' },

  // ✨ NEW: Profile Summary Styles
  profileSummaryCard: {
    backgroundColor: '#E8F5E9', // Light green background
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontSize: 14, color: '#388E3C', fontWeight: '600' },
  summaryValue: { fontSize: 14, color: '#1B5E20', fontWeight: 'bold' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  gridCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 2,
  },
  gridLabel: { fontSize: 13, color: '#888888', fontWeight: '600', marginBottom: 8 },
  gridValue: { fontSize: 22, fontWeight: '800', color: '#FF6F00' },

  sectionContainer: { marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  
  achievementsList: { paddingRight: 20, gap: 12 },
  badgeCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    width: 130,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    elevation: 2,
  },
  badgeCardLocked: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    elevation: 0,
    opacity: 0.65,
  },
  badgeIcon: { fontSize: 32, marginBottom: 6 },
  badgeIconLocked: { fontSize: 26 },
  badgeTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 4 },
  badgeTextLocked: { color: '#888888' },
  badgeDesc: { fontSize: 10, color: '#777777', textAlign: 'center', lineHeight: 14 },
  
  editButton: {
    backgroundColor: '#1A1A1A', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center',
    marginTop: 10,
  },
  editButtonText: {
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 16
  },
  logoutButton: {
    backgroundColor: '#D32F2F', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center',
    marginTop: 15,
  },
  logoutButtonText: {
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 16
  }
});