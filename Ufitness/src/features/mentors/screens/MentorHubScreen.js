/**
 * MentorHubScreen — home for students who accepted a campus mentor role.
 * Loads pending requests + active mentees from mentorRequests (Supabase mentor_requests).
 * Students without mentor flag see EmptyState only; UI unchanged for everyone else.
 */
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, display, spacing, radius, type } from '../../../context/ThemeContext';
import { useApp } from '../../../context/AppContext';
import InspoBackground from '../../../components/InspoBackground';
import { PHOTO_GLASS } from '../../../components/PhotoShell';
import { PressScale } from '../../../components/motion';
import EmptyState from '../../../components/EmptyState';
import { listActiveMentees, listRequestsForMentor } from '../lib/mentorRequests';
import { hapticLight, hapticSelection } from '../../../lib/haptics';
import { useSyncTick } from '../../../lib/autoSync';

export default function MentorHubScreen({ navigation }) {
  const { colors } = useTheme();
  const { profile, currentStudent, isMentor } = useApp();
  const mentorId = profile.userId || currentStudent.id;
  const [pending, setPending] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [ready, setReady] = useState(false);

  // Refresh counts whenever the mentor opens this tab.
  const reload = useCallback(async () => {
    const [inbox, active] = await Promise.all([
      listRequestsForMentor(mentorId),
      listActiveMentees(mentorId),
    ]);
    setPending(inbox);
    setMentees(active);
    setReady(true);
  }, [mentorId]);

  const syncTick = useSyncTick(); // reload after reconnecting
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload, syncTick])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  if (!isMentor) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <InspoBackground plate="community" />
        <EmptyState
          title="Mentors only"
          copy="Accept a campus mentor invite from Profile to unlock this. Student tabs stay the same."
          style={{ flex: 1, justifyContent: 'center' }}
        />
      </SafeAreaView>
    );
  }

  const hero = mentees[0];
  const moreCount = Math.max(0, mentees.length - 1);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <InspoBackground plate="community" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.kicker}>Mentor</Text>
          <Text style={styles.title}>Hub</Text>
          <Text style={styles.copy}>Guide mentees. Keep your student app.</Text>
        </Animated.View>

        {ready && !hero && !pending.length ? (
          <EmptyState
            title="No mentees yet"
            copy="When students request you, they show up here."
            style={{ marginTop: 12 }}
          />
        ) : null}

        {hero ? (
          <Animated.View entering={FadeInDown.delay(80).duration(420)}>
            <PressScale
              style={styles.heroCard}
              onPress={() => {
                hapticSelection();
                navigation.navigate('MenteeProgress', { mentorship: hero });
              }}
            >
              <Text style={styles.heroLabel}>Focus mentee</Text>
              <Text style={styles.heroName}>{hero.studentName}</Text>
              <Text style={styles.heroMeta}>
                {[hero.studentCampus, hero.studentGoal].filter(Boolean).join(' · ') || 'Active mentee'}
              </Text>
              <View style={styles.heroActions}>
                <PressScale
                  style={[styles.heroBtn, { backgroundColor: colors.brand }]}
                  onPress={() => {
                    hapticLight();
                    navigation.navigate('MenteeProgress', { mentorship: hero });
                  }}
                >
                  <Text style={styles.heroBtnText}>Progress</Text>
                </PressScale>
                <PressScale
                  style={styles.heroBtnOutline}
                  onPress={() => {
                    hapticLight();
                    navigation.navigate('MentorGuidance', { mentorship: hero });
                  }}
                >
                  <Text style={[styles.heroBtnText, { color: colors.brand }]}>Guide</Text>
                </PressScale>
              </View>
            </PressScale>
            {mentees.length > 1 ? (
              <PressScale
                style={styles.seeAll}
                onPress={() => {
                  hapticSelection();
                  navigation.navigate('MentorMentees');
                }}
              >
                <Text style={[styles.seeAllText, { color: colors.brand }]}>
                  See all mentees{moreCount ? ` · ${mentees.length}` : ''}
                </Text>
              </PressScale>
            ) : null}
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(140).duration(420)} style={styles.linkGroup}>
          <QuietLink
            icon="mail-unread-outline"
            label="Requests"
            caption={pending.length ? `${pending.length} waiting` : 'Inbox clear'}
            accent={pending.length > 0}
            colors={colors}
            onPress={() => {
              hapticSelection();
              navigation.navigate('MentorInbox');
            }}
          />
          <View style={styles.rule} />
          <QuietLink
            icon="chatbubbles-outline"
            label="Guidance"
            caption="Short check-ins for the week"
            colors={colors}
            onPress={() => {
              hapticSelection();
              navigation.navigate('MentorGuidance');
            }}
          />
          {!hero ? (
            <>
              <View style={styles.rule} />
              <QuietLink
                icon="people-outline"
                label="My mentees"
                caption="Students you guide"
                colors={colors}
                onPress={() => {
                  hapticSelection();
                  navigation.navigate('MentorMentees');
                }}
              />
            </>
          ) : null}
        </Animated.View>

        <PressScale style={styles.secondary} onPress={() => navigation.navigate('MentorList')}>
          <Text style={[styles.secondaryText, { color: colors.brand }]}>Find mentors as a student</Text>
        </PressScale>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuietLink({ icon, label, caption, onPress, colors, accent }) {
  return (
    <PressScale style={styles.link} onPress={onPress}>
      <Ionicons name={icon} size={20} color={accent ? colors.brand : 'rgba(255,255,255,0.55)'} />
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <Text style={styles.linkLabel}>{label}</Text>
        <Text style={styles.linkCaption}>{caption}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.28)" />
    </PressScale>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.screen, paddingBottom: 100 },
  kicker: {
    fontSize: type.kicker,
    fontWeight: type.kickerWeight,
    letterSpacing: type.kickerTracking,
    textTransform: 'uppercase',
    color: '#FF8A1A',
    marginBottom: 4,
  },
  title: { ...display, fontSize: type.display, color: '#FFFFFF', marginBottom: 8 },
  copy: { fontSize: type.body, color: 'rgba(255,255,255,0.55)', lineHeight: 20, marginBottom: 22 },
  heroCard: {
    ...PHOTO_GLASS,
    borderRadius: radius.card,
    padding: spacing.card,
    marginBottom: 8,
  },
  heroLabel: {
    fontSize: type.kicker,
    fontWeight: type.kickerWeight,
    letterSpacing: type.kickerTracking,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)',
  },
  heroName: { ...display, fontSize: type.hero, color: '#FFFFFF', marginTop: 8 },
  heroMeta: { fontSize: type.body, color: 'rgba(255,255,255,0.5)', marginTop: 6, marginBottom: 16 },
  heroActions: { flexDirection: 'row', gap: 8 },
  heroBtn: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: 11,
    alignItems: 'center',
  },
  heroBtnOutline: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6A00',
  },
  heroBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  seeAll: { alignItems: 'center', paddingVertical: 12, marginBottom: 8 },
  seeAllText: { fontWeight: '700', fontSize: type.body },
  linkGroup: {
    ...PHOTO_GLASS,
    borderRadius: radius.card,
    overflow: 'hidden',
    marginTop: 8,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 15,
  },
  linkLabel: { fontSize: 15.5, fontWeight: '600', color: '#FFFFFF' },
  linkCaption: { fontSize: 12.5, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: 46,
  },
  secondary: { alignItems: 'center', paddingVertical: 20 },
  secondaryText: { fontWeight: '700', fontSize: type.body },
});
