import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  background: '#FFFFFF',
  surface: '#F8F9FA',
  surfaceLight: '#EEEEEE',
  primary: '#BA4A0C',          // Signature vibrant orange
  primaryLight: '#FCEFE9',
  textDark: '#1A1A1A',
  textLight: '#666666',
  border: '#EAEAEA',
  teal: '#006B63',
  tealLight: '#E6F0EF'
};

export default function ProgressDashboardScreen({ navigation }) {
  const [stats] = useState({
    totalWorkouts: 12,
    totalMinutes: 360,
    currentStreak: 4,
  });

  // Weekly breakdown matching Figma design (Mon - Sun)
  const [weeklyData] = useState([
    { day: 'M', active: true, label: 'Mon' },
    { day: 'T', active: true, label: 'Tue' },
    { day: 'W', active: false, label: 'Wed' },
    { day: 'T', active: true, label: 'Thu' },
    { day: 'F', active: true, label: 'Fri' },
    { day: 'S', active: false, label: 'Sat' },
    { day: 'S', active: false, label: 'Sun' },
  ]);

  const [recentLogs] = useState([
    { id: '1', title: 'Full Body Ignition', duration: '30 Min', date: 'Yesterday, 5:30 PM', category: 'Strength' },
    { id: '2', title: 'Core & Mobility Flow', duration: '25 Min', date: '3 days ago', category: 'Mobility' },
    { id: '3', title: 'Campus Energy Routine', duration: '35 Min', date: '5 days ago', category: 'Cardio' }
  ]);

  const renderLogItem = ({ item }) => (
    <View style={styles.logCard}>
      <View style={styles.logIconBox}>
        <Ionicons name="fitness" size={20} color={COLORS.primary} />
      </View>
      <View style={styles.logInfo}>
        <Text style={styles.logTitle}>{item.title}</Text>
        <Text style={styles.logSubText}>{item.date} • {item.duration}</Text>
      </View>
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryBadgeText}>{item.category}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Progress</Text>
          <Text style={styles.headerSubtitle}>Consistency is your ultimate competitive advantage.</Text>
        </View>

        {/* High-Impact Stat Cards Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="flame" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: COLORS.tealLight }]}>
              <Ionicons name="time" size={22} color={COLORS.teal} />
            </View>
            <Text style={styles.statValue}>{stats.totalMinutes}</Text>
            <Text style={styles.statLabel}>Total Mins</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FFF9E6' }]}>
              <Ionicons name="trophy" size={22} color="#D4AF37" />
            </View>
            <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
        </View>

        {/* Weekly Activity Chart Card (Figma Style) */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <Text style={styles.chartTitle}>Weekly Activity</Text>
            <Text style={styles.chartSubtitle}>4 sessions this week</Text>
          </View>
          
          <View style={styles.barsContainer}>
            {weeklyData.map((item, index) => (
              <View key={index} style={styles.barColumn}>
                <View style={[styles.barTrack, item.active && styles.barTrackActive]}>
                  <View style={[styles.barFill, item.active && styles.barFillActive]} />
                </View>
                <Text style={[styles.barLabel, item.active && styles.barLabelActive]}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Weekly Achievement Card */}
        <View style={styles.achievementCard}>
          <Text style={styles.achievementTag}>WEEKLY GOAL</Text>
          <Text style={styles.achievementTitle}>4 of 5 Sessions Completed</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: '80%' }]} />
          </View>
        </View>

        {/* Recent History Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Workout History</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={recentLogs}
          keyExtractor={(item) => item.id}
          renderItem={renderLogItem}
          scrollEnabled={false}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  header: { paddingTop: 16, marginBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: COLORS.textDark, marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, lineHeight: 18 },

  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  statIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  statValue: { fontSize: 20, fontWeight: '800', color: COLORS.textDark, marginBottom: 2 },
  statLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textLight, letterSpacing: 0.5 },

  // Weekly Chart Styles
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  chartTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textDark },
  chartSubtitle: { fontSize: 12, fontWeight: '600', color: COLORS.textLight },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 90,
    paddingTop: 10
  },
  barColumn: {
    alignItems: 'center',
    flex: 1
  },
  barTrack: {
    width: 14,
    height: 60,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8
  },
  barTrackActive: {
    backgroundColor: COLORS.primaryLight
  },
  barFill: {
    width: '100%',
    height: '0%',
    backgroundColor: 'transparent',
    borderRadius: 7
  },
  barFillActive: {
    height: '100%',
    backgroundColor: COLORS.primary
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textLight
  },
  barLabelActive: {
    color: COLORS.textDark
  },

  achievementCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  achievementTag: { fontSize: 10, fontWeight: '800', color: COLORS.primary, letterSpacing: 1.5, marginBottom: 4 },
  achievementTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textDark, marginBottom: 12 },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3
  },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textDark },
  seeAllText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  logCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  logIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  logInfo: { flex: 1 },
  logTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginBottom: 3 },
  logSubText: { fontSize: 12, color: COLORS.textLight, fontWeight: '500' },
  categoryBadge: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.textDark, textTransform: 'uppercase' }
});