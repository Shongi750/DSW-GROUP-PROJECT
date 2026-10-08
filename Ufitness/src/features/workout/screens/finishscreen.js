import React, { useEffect, useState } from 'react';
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassScreen } from '../components/glass';
import PrimaryButton from '../components/button';
import WeekPulse from '../components/weekpulse';
import { loadWeekPulse } from '../lib/weekPulse';
import { shareWorkoutToCommunity } from '../lib/shareWorkout';
import { useTheme } from '../../../context/ThemeContext';
import { useApp as useMainApp } from '../../../context/AppContext';
import { useApp as useWorkoutApp } from '../context/AppContext';
import { hapticSuccess } from '../../../lib/haptics';
import { planAdaptationMessage, applyPlanAdaptation } from '../data/planAdaptation';
import { syncAchievements } from '../../../lib/achievements';
import BadgeStrip from '../../../components/BadgeStrip';
import { askCoachTip } from '../lib/askTip';

// Small column for min / moves / streak
function Stat({ value, label, colors }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

export default function FinishScreen({ navigation, route }) {
  const { colors } = useTheme();
  const main = useMainApp();
  const workout = useWorkoutApp();

  // values the Player handed over when the session ended
  const author = (main && main.profile && main.profile.name) || 'You';
  const minutes = (route.params && route.params.minutes) || 1;
  const moves = (route.params && route.params.moves) || 0;
  const title = (route.params && route.params.title) || 'Workout complete';

  const [pulse, setPulse] = useState({ streak: 0, week: [] });
  const [posted, setPosted] = useState(false);
  const [adaptation, setAdaptation] = useState(null);
  const [badges, setBadges] = useState([]);
  const [freshBadge, setFreshBadge] = useState(null);
  const [coachTip, setCoachTip] = useState(null);

  // load streak + maybe bump the plan + badges
  useEffect(() => {
    hapticSuccess();

    loadWeekPulse().then(async function (next) {
      setPulse(next);

      const history = (workout && workout.profile && workout.profile.history) || [];
      const adapted = applyPlanAdaptation((workout && workout.profile) || {}, history);

      // save the real progression change (sets get harder next time)
      if (adapted.patch && Object.keys(adapted.patch).length > 0) {
        if (workout && workout.updateProfile) {
          workout.updateProfile(adapted.patch);
        }
      }

      if (adapted.message) {
        setAdaptation(adapted.message);
      } else {
        setAdaptation(planAdaptationMessage(history, workout && workout.profile));
      }

      // one-shot coach tip (rules, not a chat bot)
      setCoachTip(
        askCoachTip({
          profile: workout && workout.profile,
          history: history,
          minutes: minutes,
          moves: moves,
          streak: next.streak || 0,
        })
      );

      const result = await syncAchievements({
        history: history,
        weekDone: next.week ? next.week.filter(function (d) { return d.done; }).length : 0,
        weekTotal: (workout && workout.profile && workout.profile.daysPerWeek) || 4,
      });
      setBadges(result.badges);
      if (result.freshly && result.freshly[0]) {
        setFreshBadge(result.freshly[0]);
      }
    });
  }, []);

  function refreshAsk() {
    const history = (workout && workout.profile && workout.profile.history) || [];
    setCoachTip(
      askCoachTip({
        profile: workout && workout.profile,
        history: history,
        minutes: minutes,
        moves: moves,
        streak: pulse.streak || 0,
      })
    );
  }
  const shareText =
    'Crushed a ' +
    minutes +
    '-min session on UFitness — ' +
    moves +
    ' moves' +
    (pulse.streak > 0 ? ', ' + pulse.streak + '-day streak' : '') +
    '. #UFitness #UJ';

  async function onShare() {
    try {
      await Share.share({ message: shareText });
    } catch (e) {
      // they cancelled the share sheet — fine
    }
  }

  async function onPostCampus() {
    try {
      await shareWorkoutToCommunity({
        author: author,
        title: title,
        minutes: minutes,
        moves: moves,
        streak: pulse.streak,
      });
      setPosted(true);
      Alert.alert('Posted', 'Your session is on the Campus feed.');
    } catch (error) {
      Alert.alert('Could not post', (error && error.message) || 'Try again.');
    }
  }

  function goDone() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main');
    }
  }

  // GlassScreen scrolls by default — important so Share / Done aren't cut off
  return (
    <GlassScreen>
      <View style={styles.hero}>
        <View style={[styles.badge, { backgroundColor: colors.accent }]}>
          <Ionicons name="checkmark" size={32} color="#FFFFFF" />
        </View>
        <Text style={[styles.kicker, { color: colors.accent }]}>Session complete</Text>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>
          {pulse.streak > 0
            ? pulse.streak + '-day streak. Keep showing up.'
            : 'Session logged. Your week just got stronger.'}
        </Text>
        <Text style={[styles.tip, { color: colors.muted }]}>
          Next tip: protein within an hour — campus cafeteria or a shake works.
        </Text>

        {freshBadge ? (
          <Text style={[styles.freshBadge, { color: colors.accent }]}>
            Milestone unlocked · {freshBadge.title}
          </Text>
        ) : null}

        {adaptation ? (
          <View style={[styles.adaptCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.adaptKicker, { color: colors.accent }]}>
              {String(adaptation.kicker || '').toUpperCase()}
            </Text>
            <Text style={[styles.adaptTitle, { color: colors.text }]}>{adaptation.title}</Text>
            <Text style={[styles.adaptBody, { color: colors.muted }]}>{adaptation.body}</Text>
          </View>
        ) : null}

        {coachTip ? (
          <View style={[styles.adaptCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.adaptKicker, { color: colors.accent }]}>ASK COACH</Text>
            <Text style={[styles.adaptTitle, { color: colors.text }]}>{coachTip.title}</Text>
            <Text style={[styles.adaptBody, { color: colors.muted }]}>{coachTip.body}</Text>
            <TouchableOpacity onPress={refreshAsk} style={{ marginTop: 10 }}>
              <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 13 }}>Ask again</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardBrand, { color: colors.accent }]}>UFITNESS</Text>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.statsRow}>
          <Stat value={String(minutes)} label="min" colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Stat value={String(moves)} label="moves" colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Stat
            value={pulse.streak > 0 ? String(pulse.streak) : '—'}
            label="streak"
            colors={colors}
          />
        </View>
        <Text style={[styles.cardFoot, { color: colors.muted }]}>UJ CAMPUS EDITION</Text>
      </View>

      <View style={{ marginTop: 18 }}>
        <WeekPulse week={pulse.week} streak={pulse.streak} />
        <BadgeStrip badges={badges} title="Milestones" />
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="Share activity" icon="share-outline" onPress={onShare} />
        <TouchableOpacity
          onPress={onPostCampus}
          disabled={posted}
          style={[styles.campusBtn, { borderColor: colors.accent, opacity: posted ? 0.55 : 1 }]}
        >
          <Ionicons
            name={posted ? 'checkmark-circle' : 'people-outline'}
            size={18}
            color={colors.accent}
          />
          <Text style={[styles.campusText, { color: colors.accent }]}>
            {posted ? 'Posted to campus' : 'Post to campus'}
          </Text>
        </TouchableOpacity>
        <PrimaryButton
          title="More workouts"
          icon="barbell"
          onPress={function () {
            navigation.navigate('Main', { screen: 'Workouts' });
          }}
        />
        <TouchableOpacity onPress={goDone} style={styles.doneLink}>
          <Text style={[styles.doneText, { color: colors.muted }]}>Done</Text>
        </TouchableOpacity>
      </View>
    </GlassScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: 12,
    marginBottom: 8,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  title: {
    fontFamily: 'Anton_400Regular',
    fontSize: 34,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  sub: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  tip: {
    marginTop: 14,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 28,
    lineHeight: 18,
    fontStyle: 'italic',
    opacity: 0.85,
  },
  freshBadge: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '800',
  },
  adaptCard: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 6,
    padding: 14,
    width: '100%',
  },
  adaptKicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  adaptTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  adaptBody: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 16,
    marginTop: 12,
  },
  cardBrand: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  cardTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    height: 36,
  },
  cardFoot: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
  },
  actions: {
    marginTop: 20,
    gap: 10,
    paddingBottom: 24,
  },
  campusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 6,
    paddingVertical: 14,
  },
  campusText: {
    fontSize: 15,
    fontWeight: '800',
  },
  doneLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  doneText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
