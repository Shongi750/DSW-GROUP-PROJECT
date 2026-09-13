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

type StudentProfile = {
  name: string;
  campus: string;
  fitnessLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  workoutLocation: 'Home' | 'Gym' | 'Outdoor';
  goal: 'Strength' | 'Cardio' | 'Flexibility';
  mentorName: string;
  buddyName: string;
};

type ContentRecommendation = {
  title: string;
  duration: string;
  level: string;
  location: string;
  focus: string;
  tag: string;
};

export default function App() {
  const [profile] = useState<StudentProfile>({
    name: 'Kagiso',
    campus: 'APK (Auckland Park Kingsway)',
    fitnessLevel: 'Beginner',
    workoutLocation: 'Home',
    goal: 'Strength',
    mentorName: 'Sipho N.',
    buddyName: 'Thabo M.',
  });

  const getRecommendation = (p: StudentProfile): ContentRecommendation => {
    if (p.fitnessLevel === 'Beginner' && p.workoutLocation === 'Home' && p.goal === 'Strength') {
      return {
        title: 'Beginner Home Strength Routine',
        duration: '25 mins',
        level: 'Beginner',
        location: 'Home (Bodyweight)',
        focus: 'Strength',
        tag: 'Recommended for You',
      };
    }
    return {
      title: 'Full Body Fitness Starter',
      duration: '30 mins',
      level: p.fitnessLevel,
      location: p.workoutLocation,
      focus: p.goal,
      tag: 'Custom Pick',
    };
  };

  const recommendedWorkout = getRecommendation(profile);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>Hello, {profile.name} 👋</Text>
            <View style={styles.campusBadgeContainer}>
              <Ionicons name="location-sharp" size={14} color="#64748b" />
              <Text style={styles.campusBadge}>{profile.campus.split(' ')[0]} Campus</Text>
            </View>
          </View>
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitial}>{profile.name.charAt(0)}</Text>
          </View>
        </View>

        {/* FR-11: Recommendation Engine */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="compass" size={18} color="#2563eb" />
          <Text style={styles.sectionTitle}>Recommended For You (FR-11)</Text>
        </View>
        
        <View style={styles.recommendationCard}>
          <View style={styles.tagBadge}>
            <Text style={styles.tagBadgeText}>{recommendedWorkout.tag}</Text>
          </View>
          <Text style={styles.recommendationTitle}>{recommendedWorkout.title}</Text>
          
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color="#3b82f6" />
            <Text style={styles.recommendationMeta}>{recommendedWorkout.duration}</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <FontAwesome5 name="dumbbell" size={12} color="#3b82f6" />
            <Text style={styles.recommendationMeta}>{recommendedWorkout.level}</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Ionicons name="home-outline" size={14} color="#3b82f6" />
            <Text style={styles.recommendationMeta}>{recommendedWorkout.location}</Text>
          </View>

          <View style={styles.criteriaRow}>
            <Text style={styles.criteriaChip}>{profile.fitnessLevel}</Text>
            <Text style={styles.criteriaChip}>{profile.workoutLocation}</Text>
            <Text style={styles.criteriaChip}>{profile.goal}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} style={styles.startWorkoutBtn}>
            <Text style={styles.startWorkoutText}>Start Workout</Text>
          </TouchableOpacity>
        </View>

        {/* FR-10: Personalized Dashboard */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="stats-chart" size={18} color="#2563eb" />
          <Text style={styles.sectionTitle}>Student Dashboard (FR-10)</Text>
        </View>

        {/* 1. Today's Workout Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.cardHeadingRow}>
            <MaterialCommunityIcons name="dumbbell" size={20} color="#2563eb" />
            <Text style={styles.cardHeadingTitle}>Today's Workout</Text>
          </View>

          <TouchableOpacity activeOpacity={0.8} style={styles.cardContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=60' }}
              style={styles.cardImage}
            />
            <View style={styles.cardBody}>
              <View style={styles.captionHeader}>
                <Text style={styles.cardContentTitle}>Beginner Home Strength Routine</Text>
                <Text style={styles.statusBadgeGreen}>30 MINS</Text>
              </View>
              <Text style={styles.cardContentSubText}>4 exercises • Bodyweight • Core & Legs Focus</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 2. Today's Meal Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.cardHeadingRow}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={20} color="#2563eb" />
            <Text style={styles.cardHeadingTitle}>Today's Meal</Text>
          </View>

          <TouchableOpacity activeOpacity={0.8} style={styles.cardContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=60' }}
              style={styles.cardImage}
            />
            <View style={styles.cardBody}>
              <View style={styles.captionHeader}>
                <Text style={styles.cardContentTitle}>High-Protein Student Power Bowl</Text>
                <Text style={styles.statusBadgeOrange}>1,850 kcal Goal</Text>
              </View>
              <Text style={styles.cardContentSubText}>Grilled Chicken, Brown Rice & Steamed Veggies</Text>
              
              <View style={styles.macroRow}>
                <View style={styles.macroBadge}><Text style={styles.macroValue}>45g Pro</Text></View>
                <View style={styles.macroBadge}><Text style={styles.macroValue}>60g Carb</Text></View>
                <View style={styles.macroBadge}><Text style={styles.macroValue}>14g Fat</Text></View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 3. Weekly Progress Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.cardHeadingRow}>
            <Ionicons name="trending-up" size={20} color="#2563eb" />
            <Text style={styles.cardHeadingTitle}>Weekly Progress</Text>
          </View>

          <TouchableOpacity activeOpacity={0.8} style={styles.cardContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&auto=format&fit=crop&q=60' }}
              style={styles.cardImage}
            />
            <View style={styles.cardBody}>
              <View style={styles.captionHeader}>
                <Text style={styles.cardContentTitle}>4 of 5 Workouts Complete (80%)</Text>
                <View style={styles.streakBadge}>
                  <Ionicons name="flame" size={14} color="#ea580c" />
                  <Text style={styles.streakText}>5 Days</Text>
                </View>
              </View>
              
              <View style={styles.barBackground}>
                <View style={[styles.barFill, { width: '80%' }]} />
              </View>

              <View style={styles.dayTracker}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dayPill,
                      idx < 4 ? styles.dayPillDone : idx === 4 ? styles.dayPillActive : styles.dayPillPending,
                    ]}
                  >
                    <Text style={[styles.dayText, idx < 5 && styles.dayTextActive]}>{day}</Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 4. Upcoming Activities & Events Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.cardHeadingRow}>
            <Ionicons name="calendar-outline" size={20} color="#2563eb" />
            <Text style={styles.cardHeadingTitle}>Upcoming Events</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsScroll}>
            <TouchableOpacity activeOpacity={0.8} style={styles.eventCardContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=500&auto=format&fit=crop&q=60' }}
                style={styles.eventCardImage}
              />
              <View style={styles.cardBody}>
                <Text style={styles.eventCategoryTag}>RUNNING</Text>
                <Text style={styles.eventTitle}>APK Campus 5K Sprint</Text>
                <Text style={styles.cardContentSubText}>Meet @ Gym Gates • Tomorrow 06:30 AM</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} style={styles.eventCardContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=60' }}
                style={styles.eventCardImage}
              />
              <View style={styles.cardBody}>
                <Text style={styles.eventCategoryTag}>WORKSHOP</Text>
                <Text style={styles.eventTitle}>Nutrition & Meal Prep</Text>
                <Text style={styles.cardContentSubText}>SWC Student Centre • Wed 02:00 PM</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 5. Buddy / Mentor Activity Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.cardHeadingRow}>
            <Ionicons name="people-outline" size={20} color="#2563eb" />
            <Text style={styles.cardHeadingTitle}>Buddy & Mentor Activity</Text>
          </View>

          <TouchableOpacity activeOpacity={0.8} style={styles.cardContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1517637382994-f02da38c6946?w=600&auto=format&fit=crop&q=60' }}
              style={styles.cardImage}
            />
            <View style={styles.cardBody}>
              <Text style={styles.cardContentTitle}>{profile.mentorName} (Mentor) completed Leg Day</Text>
              <Text style={styles.cardContentSubText}>{profile.buddyName} (Buddy) finished Push-Up Challenge</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 6. Community Activity Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.cardHeadingRow}>
            <Ionicons name="globe-outline" size={20} color="#2563eb" />
            <Text style={styles.cardHeadingTitle}>UJ Community Activity</Text>
          </View>

          <TouchableOpacity activeOpacity={0.8} style={styles.cardContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&auto=format&fit=crop&q=60' }}
              style={styles.cardImage}
            />
            <View style={styles.cardBody}>
              <Text style={styles.cardContentTitle}>APK Gym Status: MODERATE</Text>
              <Text style={styles.cardContentSubText}>14 students currently checked in on campus</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingText: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  campusBadgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  campusBadge: { fontSize: 13, color: '#64748b' },
  profileCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: { color: '#fff', fontSize: 18, fontWeight: '700' },
  
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },

  sectionContainer: { marginBottom: 16 },
  cardHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardHeadingTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  
  recommendationCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 10,
  },
  tagBadge: {
    backgroundColor: '#2563eb',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  tagBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  recommendationTitle: { fontSize: 17, fontWeight: '700', color: '#1e40af' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 10 },
  recommendationMeta: { fontSize: 12, color: '#3b82f6', fontWeight: '500' },
  dotSeparator: { color: '#93c5fd', fontSize: 12 },
  criteriaRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  criteriaChip: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  startWorkoutBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  startWorkoutText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  cardContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardImage: { 
    width: '100%', 
    height: 120, 
  },
  cardBody: {
    padding: 12,
  },
  captionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 4 
  },
  cardContentTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  cardContentSubText: { fontSize: 12, color: '#64748b', marginTop: 2 },

  statusBadgeGreen: { backgroundColor: '#dcfce7', color: '#15803d', fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusBadgeOrange: { backgroundColor: '#ffedd5', color: '#c2410c', fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#ffedd5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  streakText: { fontSize: 10, fontWeight: '700', color: '#ea580c' },
  macroRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  macroBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  macroValue: { fontSize: 10, fontWeight: '700', color: '#334155' },

  barBackground: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#16a34a' },
  dayTracker: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  dayPill: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayPillDone: { backgroundColor: '#2563eb' },
  dayPillActive: { backgroundColor: '#dbeafe', borderWidth: 1.5, borderColor: '#2563eb' },
  dayPillPending: { backgroundColor: '#f1f5f9' },
  dayText: { fontSize: 10, fontWeight: '600', color: '#94a3b8' },
  dayTextActive: { color: '#ffffff' },

  eventsScroll: { gap: 12 },
  eventCardContainer: {
    width: 220,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  eventCardImage: { width: '100%', height: 100 },
  eventCategoryTag: { fontSize: 9, fontWeight: '800', color: '#2563eb', letterSpacing: 0.5, marginBottom: 2 },
  eventTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
});