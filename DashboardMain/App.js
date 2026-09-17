import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');

  const navItems = [
    { name: 'Home', iconType: 'ionicons', iconName: 'home-outline', activeIcon: 'home' },
    { name: 'Workouts', iconType: 'ionicons', iconName: 'barbell-outline', activeIcon: 'barbell' },
    { name: 'Meals', iconType: 'material', iconName: 'silverware-fork-knife', activeIcon: 'silverware-fork-knife' },
    { name: 'Community', iconType: 'ionicons', iconName: 'people-outline', activeIcon: 'people' },
    { name: 'Profile', iconType: 'ionicons', iconName: 'person-outline', activeIcon: 'person' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FB" />
      
      {/* Scrollable Content View */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Bar Navigation */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' }}
              style={styles.avatarImage}
            />
            <Text style={styles.brandName}>UFitness</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* Hero Banner Header */}
        <View style={styles.heroHeader}>
          <Text style={styles.dateText}>THURSDAY, OCT 26</Text>
          <Text style={styles.headlineText}>Ready to crush it?</Text>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsContainer}>
          {/* Calories Stat Card */}
          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <Ionicons name="flame-outline" size={16} color="#00A8A8" />
              <Text style={styles.statLabelText}>CALORIES</Text>
            </View>
            <View style={styles.statValueRow}>
              <Text style={styles.statValueText}>450</Text>
              <Text style={styles.statUnitText}>kcal</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '65%', backgroundColor: '#00A8A8' }]} />
            </View>
          </View>

          {/* Active Time Stat Card */}
          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <Ionicons name="time-outline" size={16} color="#D96B27" />
              <Text style={styles.statLabelText}>ACTIVE</Text>
            </View>
            <View style={styles.statValueRow}>
              <Text style={styles.statValueText}>45</Text>
              <Text style={styles.statUnitText}>min</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '45%', backgroundColor: '#D96B27' }]} />
            </View>
          </View>
        </View>

        {/* Today's Workout Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Today's Workout</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.seeAllText}>SEE ALL</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.workoutCard}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80' }}
              style={styles.workoutImage}
            />
            <View style={styles.workoutBadge}>
              <View style={styles.orangeDot} />
              <Text style={styles.workoutBadgeText}>STRENGTH</Text>
            </View>
          </View>

          <View style={styles.workoutDetails}>
            <Text style={styles.workoutTitle}>Full Body Power</Text>
            <Text style={styles.workoutDescription}>
              A high-intensity session focusing on core strength and explosive movements designed for busy...
            </Text>

            <View style={styles.workoutFooterRow}>
              <View style={styles.durationMetaRow}>
                <Ionicons name="time-outline" size={14} color="#7A7A7A" />
                <Text style={styles.workoutMetaText}>45 Min • Int/Adv</Text>
              </View>

              <TouchableOpacity activeOpacity={0.85} style={styles.startBtn}>
                <Text style={styles.startBtnText}>START</Text>
                <Ionicons name="caret-forward" size={12} color="#FFFFFF" style={{ marginLeft: 3 }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Fuel Your Day Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Fuel Your Day</Text>
        </View>

        <TouchableOpacity activeOpacity={0.85} style={styles.mealCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80' }}
            style={styles.mealImage}
          />
          <View style={styles.mealDetails}>
            <Text style={styles.mealCategoryTag}>POST-WORKOUT</Text>
            <Text style={styles.mealTitle}>Grilled Power Bowl</Text>
            <View style={styles.mealStatsRow}>
              <View style={styles.mealStatItem}>
                <Ionicons name="flame-outline" size={12} color="#8C7870" />
                <Text style={styles.mealStatText}>520 kcal</Text>
              </View>
              <View style={styles.mealStatItem}>
                <FontAwesome5 name="dumbbell" size={10} color="#8C7870" />
                <Text style={styles.mealStatText}>42g Protein</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Campus Connect Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Campus Connect</Text>
        </View>

        <View style={styles.campusGrid}>
          <TouchableOpacity activeOpacity={0.8} style={styles.campusCard}>
            <View style={[styles.campusIconCircle, { backgroundColor: '#EBF3FB' }]}>
              <Ionicons name="school-outline" size={20} color="#4A709C" />
            </View>
            <Text style={styles.campusLabel}>Mentors</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} style={styles.campusCard}>
            <View style={[styles.campusIconCircle, { backgroundColor: '#FDF0E6' }]}>
              <Ionicons name="people-outline" size={20} color="#D96B27" />
            </View>
            <Text style={styles.campusLabel}>Buddies</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} style={styles.campusCard}>
            <View style={[styles.campusIconCircle, { backgroundColor: '#E6F7F5' }]}>
              <MaterialCommunityIcons name="forum-outline" size={20} color="#00A8A8" />
            </View>
            <Text style={styles.campusLabel}>Community</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.navBarContainer}>
        {navItems.map((item) => {
          const isActive = activeTab === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              activeOpacity={0.7}
              onPress={() => setActiveTab(item.name)}
              style={styles.navItemWrapper}
            >
              <View style={[styles.navIconContainer, isActive && styles.activePill]}>
                {item.iconType === 'ionicons' ? (
                  <Ionicons
                    name={isActive ? item.activeIcon : item.iconName}
                    size={20}
                    color={isActive ? '#FFFFFF' : '#4A4A4A'}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name={item.iconName}
                    size={20}
                    color={isActive ? '#FFFFFF' : '#4A4A4A'}
                  />
                )}
              </View>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100,
  },

  /* Top Bar */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#BD4800',
    letterSpacing: -0.5,
  },
  notificationBtn: {
    padding: 4,
  },

  /* Hero Header */
  heroHeader: {
    marginBottom: 18,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A8A8E',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  headlineText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C1C1E',
  },

  /* Quick Stats */
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F3',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  statLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6C6C70',
    letterSpacing: 0.5,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 12,
  },
  statValueText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  statUnitText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8A8A8E',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#EFEFF4',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D96B27',
    letterSpacing: 0.5,
  },

  /* Workout Card */
  workoutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F3',
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  imageWrapper: {
    position: 'relative',
    height: 180,
    width: '100%',
  },
  workoutImage: {
    width: '100%',
    height: '100%',
  },
  workoutBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orangeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D96B27',
  },
  workoutBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: 0.5,
  },
  workoutDetails: {
    padding: 16,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  workoutDescription: {
    fontSize: 12,
    color: '#6C6C70',
    lineHeight: 18,
    marginBottom: 16,
  },
  workoutFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutMetaText: {
    fontSize: 12,
    color: '#6C6C70',
    fontWeight: '500',
  },
  startBtn: {
    backgroundColor: '#BD4800',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* Fuel Your Day */
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#F0F0F3',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  mealImage: {
    width: 76,
    height: 76,
    borderRadius: 12,
  },
  mealDetails: {
    flex: 1,
  },
  mealCategoryTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00A8A8',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  mealTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  mealStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mealStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mealStatText: {
    fontSize: 11,
    color: '#8A8A8E',
    fontWeight: '500',
  },

  /* Campus Connect */
  campusGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  campusCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F3',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  campusIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  campusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },

  /* Bottom Navigation */
  navBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EFEFF4',
    paddingHorizontal: 10,
  },
  navItemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navIconContainer: {
    width: 42,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    backgroundColor: '#D96B27',
    width: 58,
    height: 30,
    borderRadius: 15,
  },
  navLabel: {
    fontSize: 10,
    color: '#6C6C70',
    marginTop: 2,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#D96B27',
    fontWeight: '700',
  },
});