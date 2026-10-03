import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, display, spacing, radius, type } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import InspoBackground from '../../components/InspoBackground';
import { PHOTO_GLASS } from '../../components/PhotoShell';
import { PressScale } from '../../components/motion';
import {
  biometricLabel,
  canUseBiometrics,
  disableUnlock,
  enableUnlockFlagOnly,
  hasUnlockSecret,
  isUnlockEnabled,
} from '../../lib/biometrics';
import { DEFAULT_PRIVACY, normalizePrivacy } from '../../lib/privacy';
import { hapticLight, hapticSelection } from '../../lib/haptics';

function ToggleRow({ label, caption, value, onValueChange, colors, disabled }) {
  return (
    <View style={[styles.toggleRow, disabled && { opacity: 0.45 }]}>
      <View style={styles.toggleCopy}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {caption ? <Text style={styles.toggleCaption}>{caption}</Text> : null}
      </View>
      <Switch
        value={Boolean(value)}
        onValueChange={(next) => {
          if (disabled) return;
          hapticSelection();
          onValueChange(next);
        }}
        disabled={disabled}
        trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(255,106,0,0.55)' }}
        thumbColor={value ? colors.brand : '#f4f3f4'}
      />
    </View>
  );
}

export default function PrivacySecurityScreen({ navigation }) {
  const { colors } = useTheme();
  const { profile, updateFields } = useApp();
  const privacy = useMemo(() => normalizePrivacy(profile.privacy), [profile.privacy]);

  const [canBio, setCanBio] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [hasSecret, setHasSecret] = useState(false);
  const [label, setLabel] = useState('biometrics');

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([
        canUseBiometrics(),
        isUnlockEnabled(),
        biometricLabel(),
        hasUnlockSecret(),
      ]).then(([can, on, name, secret]) => {
        if (!alive) return;
        setCanBio(can);
        setBioOn(on);
        setLabel(name);
        setHasSecret(secret);
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  const setPrivacy = (patch) => {
    updateFields({
      privacy: {
        ...DEFAULT_PRIVACY,
        ...normalizePrivacy(profile.privacy),
        ...patch,
      },
    });
  };

  const toggleBio = async (next) => {
    hapticLight();
    if (Platform.OS === 'web') {
      Alert.alert(
        'Biometrics',
        'Fingerprint / Face ID unlock is available in the iOS and Android app, not in the browser.'
      );
      return;
    }
    if (!canBio) {
      Alert.alert(
        'Not available',
        'This device has no biometrics enrolled. Add Face ID or a fingerprint in system settings first.'
      );
      return;
    }
    if (next) {
      const ok = await enableUnlockFlagOnly();
      if (!ok) {
        Alert.alert(
          `Enable ${label}`,
          'Sign out, sign in with your password once, then choose Enable when asked. After that you can turn this on here.'
        );
        return;
      }
      setBioOn(true);
      return;
    }
    await disableUnlock();
    setBioOn(false);
    setHasSecret(false);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <InspoBackground plate="profile" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>Settings</Text>
        <Text style={styles.title}>Privacy & security</Text>
        <Text style={styles.lead}>
          Control unlock on this device and what other UJ students can see about you.
        </Text>

        <Text style={styles.groupLabel}>Security</Text>
        <View style={styles.card}>
          <ToggleRow
            label={`Unlock with ${label}`}
            caption={
              Platform.OS === 'web'
                ? 'Use student number + password on web.'
                : bioOn
                  ? 'On — credentials stay in the device keystore.'
                  : hasSecret
                    ? 'Ready — turn on to require biometrics when reopening the app.'
                    : 'Sign in with password once, then enable here or when prompted.'
            }
            value={bioOn}
            onValueChange={toggleBio}
            colors={colors}
            disabled={Platform.OS === 'web' || !canBio}
          />
        </View>

        <Text style={styles.groupLabel}>Discovery</Text>
        <View style={styles.card}>
          <ToggleRow
            label="Show me in buddy finder"
            caption="When off, other students won’t see you in Connect matches."
            value={privacy.discoverable}
            onValueChange={(discoverable) => setPrivacy({ discoverable })}
            colors={colors}
          />
          <View style={styles.rule} />
          <ToggleRow
            label="Appear as a mentor"
            caption="When off, you won’t show on Find a Mentor even if mentoring is unlocked."
            value={privacy.appearAsMentor}
            onValueChange={(appearAsMentor) => setPrivacy({ appearAsMentor })}
            colors={colors}
          />
        </View>

        <Text style={styles.groupLabel}>What others can see</Text>
        <View style={styles.card}>
          <ToggleRow
            label="Show my campus"
            caption="APK, APB, DFC, or SWC on your public card."
            value={privacy.showCampus}
            onValueChange={(showCampus) => setPrivacy({ showCampus })}
            colors={colors}
          />
          <View style={styles.rule} />
          <ToggleRow
            label="Show my fitness goal"
            caption="Strength, endurance, weight management, etc."
            value={privacy.showGoal}
            onValueChange={(showGoal) => setPrivacy({ showGoal })}
            colors={colors}
          />
          <View style={styles.rule} />
          <ToggleRow
            label="Show my experience level"
            caption="Beginner, intermediate, or advanced."
            value={privacy.showExperience}
            onValueChange={(showExperience) => setPrivacy({ showExperience })}
            colors={colors}
          />
        </View>

        <Text style={styles.groupLabel}>Mentoring</Text>
        <View style={styles.card}>
          <ToggleRow
            label="Share progress with my mentor"
            caption="Lets your mentor open mentee progress / guidance context. Chats stay between you either way."
            value={privacy.shareProgressWithMentor}
            onValueChange={(shareProgressWithMentor) => setPrivacy({ shareProgressWithMentor })}
            colors={colors}
          />
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.brand} />
          <Text style={styles.note}>
            Email and student number are never shown to other students. Delete account on Profile removes your
            login and cloud data.
          </Text>
        </View>

        <PressScale
          style={styles.back}
          onPress={() => {
            hapticLight();
            navigation.goBack();
          }}
        >
          <Text style={[styles.backText, { color: colors.brand }]}>Done</Text>
        </PressScale>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.screen, paddingBottom: 48 },
  kicker: {
    fontSize: type.kicker,
    fontWeight: type.kickerWeight,
    letterSpacing: type.kickerTracking,
    textTransform: 'uppercase',
    color: '#FF8A1A',
  },
  title: { ...display, fontSize: 32, color: '#FFFFFF', marginTop: 4 },
  lead: {
    marginTop: 10,
    marginBottom: 18,
    fontSize: type.body,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.55)',
  },
  groupLabel: {
    marginTop: 14,
    marginBottom: 8,
    marginLeft: 2,
    fontSize: type.kicker,
    fontWeight: type.kickerWeight,
    letterSpacing: type.kickerTracking,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.38)',
  },
  card: {
    ...PHOTO_GLASS,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  toggleCopy: { flex: 1, paddingRight: 12 },
  toggleLabel: { fontSize: 15.5, fontWeight: '700', color: '#FFFFFF' },
  toggleCaption: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.5)',
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: 14,
  },
  noteCard: {
    ...PHOTO_GLASS,
    borderRadius: radius.card,
    padding: 14,
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  note: { flex: 1, fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.65)' },
  back: { alignItems: 'center', paddingVertical: 20 },
  backText: { fontWeight: '700', fontSize: 14 },
});
