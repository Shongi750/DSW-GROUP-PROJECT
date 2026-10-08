import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Pressable,
  Modal,
  Platform,
  PanResponder,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  EXPERIENCE_LEVELS,
  WORKOUT_PREFERENCES,
  FUNDING_TYPES,
} from '../../data/onboardingOptions';
import { YEARS_OF_STUDY, facultyForCourse, searchUjCourses } from '../../data/ujCourses';
import { GENDER_OPTIONS } from '../../data/genderOptions';
import { PROFILE_AVATARS } from '../../data/profileAvatars';
import { useTheme } from '../../context/ThemeContext';
import { personName } from '../../lib/ujEmail';
import { weeklyForFunding } from '../../features/meals/lib/budget';
import { loadSavedPlan, saveSavedPlan } from '../../features/meals/lib/persist';

/*
  Combined onboarding + profile edit screen.
  Collects goal, campus, course, photo, and food budget in one scroll form,
  then calls completeOnboarding (first time) or updateFields (edit from profile).
  Smaller pickers live at the bottom: SelectField, CourseSearchField, PhotoPicker, BudgetSlider.
*/

const BRAND = '#FF6A00';
const ACCENT = '#FF6A00';
const TEXT = '#FFFFFF';
const MUTED = '#A3A3A3';
const LINE = '#262626';

const GOALS = [
  { id: 'weight', label: 'Weight mgmt', icon: 'body-outline' },
  { id: 'muscle', label: 'Muscle building', icon: 'barbell-outline' },
  { id: 'general', label: 'General fitness', icon: 'heart-outline' },
  { id: 'endurance', label: 'Endurance', icon: 'walk-outline' },
];

const GOAL_BY_VALUE = {
  weight: 'weight',
  'Weight mgmt': 'weight',
  'Weight Management': 'weight',
  muscle: 'muscle',
  'Muscle building': 'muscle',
  'Build Muscle': 'muscle',
  'Build strength': 'muscle',
  general: 'general',
  'General fitness': 'general',
  'Improve general fitness': 'general',
  endurance: 'endurance',
  Endurance: 'endurance',
  'Improve endurance': 'endurance',
};

const CAMPUSES = [
  { label: 'APK', value: 'APK' },
  { label: 'APB', value: 'APB' },
  { label: 'DFC', value: 'DFC' },
  { label: 'SW', value: 'SWC' },
];

function parseBudget(data) {
  if (data && Number(data.foodBudgetAmount) > 0) {
    return Number(data.foodBudgetAmount);
  }
  const budgetText = (data && data.foodBudget) || '';
  const match = String(budgetText).match(/(\d[\d,]*)/g);
  if (match && match.length) {
    const last = match[match.length - 1].replace(',', '');
    return Number(last);
  }
  return 1500;
}

function photoModeFromUri(uri) {
  if (!uri) {
    return '';
  }
  const isAvatar = PROFILE_AVATARS.some(function (item) {
    return item.uri === uri;
  });
  if (isAvatar) {
    return 'avatar';
  }
  return 'upload';
}

function formatBudget(amount) {
  return 'R' + amount;
}

function goalLabelForId(goalId) {
  const found = GOALS.find(function (item) {
    return item.id === goalId;
  });
  if (found) {
    return found.label;
  }
  return 'General fitness';
}

function formatMissingList(missing) {
  if (missing.length === 1) {
    return missing[0];
  }
  const head = missing.slice(0, -1).join(', ');
  const tail = missing[missing.length - 1];
  return head + ' and ' + tail;
}

export default function FitnessGoalScreen({
  navigation,
  data,
  updateFields,
  completeOnboarding,
  editing = false,
}) {
  const { colors, isDark } = useTheme();
  const [goal, setGoal] = useState(GOAL_BY_VALUE[data?.fitnessGoal] || 'weight');
  const [experience, setExperience] = useState(data?.experienceLevel || '');
  const [location, setLocation] = useState(data?.workoutPreference || '');
  const [campus, setCampus] = useState(data?.campus || 'APK');
  const [course, setCourse] = useState(data?.course || '');
  const [yearOfStudy, setYearOfStudy] = useState(data?.yearOfStudy || '');
  const [gender, setGender] = useState(data?.gender || '');
  const [avatarUrl, setAvatarUrl] = useState(data?.avatarUrl || '');
  const [photoMode, setPhotoMode] = useState(() => photoModeFromUri(data?.avatarUrl));
  const [budget, setBudget] = useState(parseBudget(data));
  const [funding, setFunding] = useState(data?.fundingType || '');
  const [name, setName] = useState(personName(data?.name) || '');
  const [notice, setNotice] = useState('');

  const isEditing = Boolean(editing || data?.onboardingComplete);

  function buildPayload() {
    const weekly = weeklyForFunding(budget);
    return {
      name: personName(name),
      fitnessGoal: goalLabelForId(goal),
      experienceLevel: experience,
      workoutPreference: location,
      campus,
      course,
      courseFaculty: facultyForCourse(course),
      yearOfStudy,
      gender,
      avatarUrl,
      foodBudget: formatBudget(budget),
      foodBudgetAmount: budget,
      weeklyFoodBudget: weekly,
      foodBudgetRemaining: weekly,
      fundingType: funding,
      daysPerWeek: 4,
    };
  }

  function missingFields() {
    const missing = [];
    if (!personName(name)) {
      missing.push('your name');
    }
    if (!goal) {
      missing.push('a fitness goal');
    }
    if (!experience) {
      missing.push('your experience level');
    }
    if (!location) {
      missing.push('a preferred location');
    }
    if (!course) {
      missing.push('your UJ course');
    }
    if (!yearOfStudy) {
      missing.push('your year of study');
    }
    if (!avatarUrl) {
      missing.push('a profile picture');
    }
    if (!funding) {
      missing.push('a funding source');
    }
    return missing;
  }

  async function finish(requireGoal) {
    if (requireGoal) {
      const missing = missingFields();
      if (missing.length) {
        const list = formatMissingList(missing);
        setNotice('Choose ' + list + ' before continuing.');
        return;
      }
    }
    setNotice('');
    try {
      const patch = buildPayload();
      const saved = await loadSavedPlan();
      const planBase = saved || {};
      await saveSavedPlan({ ...planBase, budget: patch.weeklyFoodBudget });
      if (isEditing) {
        if (updateFields) {
          updateFields(patch);
        }
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
        return;
      }
      if (completeOnboarding) {
        await completeOnboarding(patch);
      }
    } catch (error) {
      const message = (error && error.message) || 'Could not save setup. Try again.';
      setNotice(message);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : finish(false))}
          hitSlop={10}
          style={styles.iconBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View style={styles.progressFill} />
          <View style={[styles.progressDot, styles.progressDotOn, { backgroundColor: colors.accent }]} />
          <View style={[styles.progressDot, styles.progressDotMid, { backgroundColor: colors.border }]} />
          <View style={[styles.progressDot, styles.progressDotEnd, { backgroundColor: colors.border }]} />
        </View>
        {isEditing ? (
          <View style={styles.iconBtn} />
        ) : (
          <Pressable onPress={() => finish(false)} hitSlop={10}>
            <Text style={styles.skip}>SKIP</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.text }]}>What is your fitness goal?</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Select your primary objective to help us tailor your experience at UJ.
        </Text>
        <Text style={[styles.fieldLabel, { color: colors.muted }]}>YOUR NAME</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Name you want on Home"
          placeholderTextColor={colors.muted}
          autoCapitalize="words"
          style={[styles.nameInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
        />

        <View style={styles.grid}>
          {GOALS.map((item) => {
            const selected = goal === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setGoal(item.id)}
                style={[
                  styles.goalTile,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  selected && { backgroundColor: 'rgba(255,106,0,0.14)', borderColor: colors.accent },
                ]}
              >
                <Ionicons name={item.icon} size={28} color={selected ? colors.accent : colors.muted} />
                <Text
                  style={[
                    styles.goalLabel,
                    { color: colors.text },
                    selected && { color: isDark ? '#FF8A1A' : '#B33E0A' },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <SelectField
          label="EXPERIENCE LEVEL"
          placeholder="Select your level"
          value={experience}
          options={EXPERIENCE_LEVELS}
          onSelect={setExperience}
        />
        <SelectField
          label="PREFERRED LOCATION"
          placeholder="Select location type"
          value={location}
          options={WORKOUT_PREFERENCES}
          onSelect={setLocation}
        />

        <Text style={[styles.fieldLabel, { color: colors.muted }]}>PRIMARY CAMPUS</Text>
        <View style={styles.campusRow}>
          {CAMPUSES.map((item) => {
            const selected = campus === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => setCampus(item.value)}
                style={[
                  styles.campusChip,
                  { borderColor: colors.border, backgroundColor: colors.card },
                  selected && { backgroundColor: colors.accent, borderColor: colors.accent },
                ]}
              >
                <Text
                  style={[
                    styles.campusText,
                    { color: selected ? '#FFFFFF' : colors.muted },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <CourseSearchField
          label="WHICH COURSE ARE YOU DOING?"
          placeholder="Search your qualification"
          value={course}
          onSelect={setCourse}
        />
        <SelectField
          label="YEAR OF STUDY"
          placeholder="Select year"
          value={yearOfStudy}
          options={YEARS_OF_STUDY}
          onSelect={setYearOfStudy}
        />
        <Text style={[styles.fieldLabel, { color: colors.muted }]}>HOW DO YOU DESCRIBE YOURSELF? (OPTIONAL)</Text>
        <View style={styles.genderRow}>
          {GENDER_OPTIONS.map((item) => {
            const selected = gender === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setGender(selected ? '' : item.id)}
                style={[
                  styles.genderChip,
                  { borderColor: colors.border, backgroundColor: colors.card },
                  selected && { backgroundColor: colors.accent, borderColor: colors.accent },
                ]}
              >
                <Ionicons name={item.icon} size={16} color={selected ? '#fff' : colors.muted} />
                <Text
                  style={[styles.genderChipText, { color: selected ? '#FFFFFF' : colors.muted }]}
                  numberOfLines={2}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <PhotoPicker
          avatarUrl={avatarUrl}
          photoMode={photoMode}
          onMode={setPhotoMode}
          onPickUri={(uri) => {
            setAvatarUrl(uri);
            setPhotoMode(uri ? photoModeFromUri(uri) || 'upload' : '');
          }}
        />

        <View style={styles.budgetHeader}>
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>MONTHLY FOOD BUDGET</Text>
          <Text style={styles.budgetValue}>R {budget}</Text>
        </View>
        <BudgetSlider value={budget} onChange={setBudget} />
        <View style={styles.budgetEnds}>
          <Text style={[styles.budgetHint, { color: colors.muted }]}>R 500</Text>
          <Text style={[styles.budgetHint, { color: colors.muted }]}>R 10000</Text>
        </View>

        <SelectField
          label="FUNDING SOURCE (MEAL PLANNING)"
          placeholder="Select funding type"
          value={funding}
          options={FUNDING_TYPES}
          onSelect={setFunding}
        />

        {notice ? (
          <View
            style={[
              styles.notice,
              {
                backgroundColor: isDark ? 'rgba(255,106,0,0.14)' : '#FDECEC',
                borderColor: isDark ? 'rgba(255,106,0,0.45)' : '#E7B4B4',
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[styles.noticeText, { color: isDark ? '#FFB27A' : '#8C2F2F' }]}>
              {notice}
            </Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.continueBtn, { backgroundColor: colors.accent, shadowColor: colors.accent }]}
          onPress={() => finish(true)}
        >
          <Text style={styles.continueText}>{isEditing ? 'Save' : 'Continue'}</Text>
          <Ionicons name={isEditing ? 'checkmark' : 'arrow-forward'} size={18} color="#fff" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SelectField({ label, placeholder, value, options, onSelect }) {
  const [open, setOpen] = useState(false);
  const { colors, isDark } = useTheme();
  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
      <Pressable
        style={[styles.select, { backgroundColor: colors.input, borderColor: colors.border }]}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.selectValue, { color: value ? colors.text : colors.muted }, !value && styles.selectPlaceholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.35)' }]}
          onPress={() => setOpen(false)}
        >
          <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {options.map((option) => (
              <Pressable
                key={option}
                style={[styles.sheetRow, { borderBottomColor: colors.border }]}
                onPress={() => {
                  onSelect(option);
                  setOpen(false);
                }}
              >
                <Text style={[styles.sheetText, { color: colors.text }]}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function CourseSearchField({ label, placeholder, value, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { colors, isDark } = useTheme();
  const matches = searchUjCourses(query);
  const faculty = facultyForCourse(value);

  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
      <Pressable
        style={[styles.select, { backgroundColor: colors.input, borderColor: colors.border }]}
        onPress={() => {
          setQuery('');
          setOpen(true);
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.selectValue, { color: value ? colors.text : colors.muted }, !value && styles.selectPlaceholder]}
            numberOfLines={2}
          >
            {value || placeholder}
          </Text>
          {faculty ? (
            <Text style={[styles.courseFaculty, { color: colors.muted }]} numberOfLines={1}>
              {faculty}
            </Text>
          ) : null}
        </View>
        <Ionicons name="search" size={18} color={colors.muted} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.35)' }]}
          onPress={() => setOpen(false)}
        >
          <Pressable
            style={[styles.courseSheet, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {}}
          >
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Type Informatics, Nursing, Civil…"
              placeholderTextColor={colors.muted}
              autoFocus
              style={[
                styles.courseSearch,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.input },
              ]}
            />
            <ScrollView style={styles.courseList} keyboardShouldPersistTaps="handled">
              {matches.map((item) => (
                <Pressable
                  key={`${item.faculty}:${item.name}`}
                  style={[styles.sheetRow, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    onSelect(item.name);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.sheetText, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.courseFaculty, { color: colors.muted }]}>{item.faculty}</Text>
                </Pressable>
              ))}
              {!matches.length ? (
                <Text style={[styles.courseEmpty, { color: colors.muted }]}>
                  No match in the 2026 undergraduate prospectus list.
                </Text>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function PhotoPicker({ avatarUrl, photoMode, onMode, onPickUri }) {
  const { colors } = useTheme();

  async function pickOwnPhoto() {
    onMode('upload');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photos so you can upload your own picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) {
      return;
    }
    const assets = result.assets;
    if (assets && assets[0] && assets[0].uri) {
      onPickUri(assets[0].uri);
    }
  }

  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.fieldLabel, { color: colors.muted }]}>PROFILE PICTURE</Text>
      <Text style={[styles.photoHint, { color: colors.muted }]}>
        Use your own photo, or pick an avatar.
      </Text>
      <View style={styles.photoChoices}>
        <Pressable
          onPress={pickOwnPhoto}
          style={[
            styles.photoChoice,
            { backgroundColor: colors.card, borderColor: colors.border },
            photoMode === 'upload' && { backgroundColor: 'rgba(255,106,0,0.14)', borderColor: colors.accent },
          ]}
        >
          <Ionicons name="camera-outline" size={22} color={photoMode === 'upload' ? colors.accent : colors.muted} />
          <Text style={[styles.photoChoiceText, { color: colors.text }]}>Upload my photo</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            onMode('avatar');
            if (!PROFILE_AVATARS.some((item) => item.uri === avatarUrl)) {
              onPickUri(PROFILE_AVATARS[0].uri);
            }
          }}
          style={[
            styles.photoChoice,
            { backgroundColor: colors.card, borderColor: colors.border },
            photoMode === 'avatar' && { backgroundColor: 'rgba(255,106,0,0.14)', borderColor: colors.accent },
          ]}
        >
          <Ionicons name="happy-outline" size={22} color={photoMode === 'avatar' ? colors.accent : colors.muted} />
          <Text style={[styles.photoChoiceText, { color: colors.text }]}>Use an avatar</Text>
        </Pressable>
      </View>
      {photoMode === 'upload' && avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.photoPreview} />
      ) : null}
      {photoMode === 'avatar' ? (
        <View style={styles.avatarRow}>
          {PROFILE_AVATARS.map((item) => {
            const selected = item.uri === avatarUrl;
            return (
              <Pressable key={item.id} onPress={() => onPickUri(item.uri)} style={styles.avatarHit}>
                <Image
                  source={{ uri: item.uri }}
                  style={[styles.avatarOption, selected && styles.avatarOptionOn]}
                />
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function BudgetSlider({ value, onChange }) {
  const { colors } = useTheme();
  const min = 500;
  const max = 10000;
  const trackRef = useRef(null);
  const widthRef = useRef(1);
  const leftRef = useRef(0);
  const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)));

  function applyPageX(pageX) {
    const width = Math.max(widthRef.current, 1);
    const x = Math.min(width, Math.max(0, pageX - leftRef.current));
    const next = Math.round((min + (x / width) * (max - min)) / 50) * 50;
    onChange(Math.min(max, Math.max(min, next)));
  }

  function measure() {
    const track = trackRef.current;
    if (track && track.measureInWindow) {
      track.measureInWindow(function (x, _y, width) {
        if (typeof x === 'number') {
          leftRef.current = x;
        }
        if (width) {
          widthRef.current = width;
        }
      });
    }
  }

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          measure();
          applyPageX(event.nativeEvent.pageX);
        },
        onPanResponderMove: (event) => applyPageX(event.nativeEvent.pageX),
      }),
    [onChange]
  );

  if (Platform.OS === 'web') {
    return React.createElement('input', {
      type: 'range',
      min,
      max,
      step: 50,
      value,
      'aria-label': 'Monthly food budget',
      onChange: (event) => onChange(Number(event.target.value)),
      onInput: (event) => onChange(Number(event.target.value)),
      style: {
        width: '100%',
        height: 28,
        margin: 0,
        cursor: 'pointer',
        accentColor: BRAND,
      },
    });
  }

  return (
    <View
      ref={trackRef}
      onLayout={(event) => {
        widthRef.current = event.nativeEvent.layout.width || 1;
        measure();
      }}
      style={styles.sliderHit}
      {...pan.panHandlers}
    >
      <View style={[styles.sliderTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.sliderFill, { width: `${ratio * 100}%`, backgroundColor: colors.accent }]} />
        <View
          style={[
            styles.sliderThumb,
            { left: `${ratio * 100}%`, backgroundColor: colors.accent },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: {
    flex: 1,
    minHeight: 0,
    ...(Platform.OS === 'web' ? { overflow: 'scroll' } : null),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 10,
  },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 99,
    justifyContent: 'center',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    width: '34%',
    height: 4,
    backgroundColor: ACCENT,
    borderRadius: 99,
  },
  progressDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: -2,
  },
  progressDotOn: { left: '32%' },
  progressDotMid: { left: '64%' },
  progressDotEnd: { right: 0 },
  skip: { color: ACCENT, fontWeight: '800', fontSize: 13, letterSpacing: 0.6 },
  content: { paddingHorizontal: 20, paddingBottom: 36 },
  title: {
    fontFamily: 'Anton_400Regular',
    fontSize: 30,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: TEXT,
    marginTop: 8,
  },
  subtitle: { fontSize: 14, color: MUTED, lineHeight: 20, marginTop: 8, marginBottom: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 22 },
  goalTile: {
    width: '47.5%',
    minHeight: 108,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  goalLabel: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  fieldBlock: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 8,
  },
  nameInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectValue: { flex: 1, fontSize: 15, fontWeight: '600' },
  selectPlaceholder: { fontWeight: '500' },
  campusRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  campusChip: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  campusText: { fontSize: 13, fontWeight: '800' },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  genderChip: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  genderChipText: { fontSize: 12, fontWeight: '800', textAlign: 'center', flexShrink: 1 },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  budgetValue: { fontSize: 15, fontWeight: '800', color: BRAND },
  sliderHit: {
    height: 36,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 8,
    borderRadius: 99,
    justifyContent: 'center',
  },
  sliderFill: { height: 8, borderRadius: 99 },
  sliderThumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    top: -7,
    marginLeft: -11,
  },
  budgetEnds: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 16 },
  budgetHint: { fontSize: 12, color: MUTED, fontWeight: '600' },
  notice: { borderRadius: 12, padding: 12, marginTop: 8 },
  noticeText: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  continueBtn: {
    marginTop: 8,
    borderRadius: 999,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  continueText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  sheet: { borderRadius: 6, overflow: 'hidden', borderWidth: 1 },
  sheetRow: { paddingVertical: 16, paddingHorizontal: 18, borderBottomWidth: 1 },
  sheetText: { fontSize: 16, fontWeight: '600' },
  courseSheet: {
    borderRadius: 6,
    overflow: 'hidden',
    maxHeight: '80%',
    borderWidth: 1,
  },
  courseSearch: {
    margin: 12,
    marginBottom: 4,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  courseList: { maxHeight: 360 },
  courseFaculty: { marginTop: 3, fontSize: 12, fontWeight: '600' },
  courseEmpty: { padding: 18, fontSize: 14, textAlign: 'center' },
  photoHint: { fontSize: 13, marginTop: -4, marginBottom: 10 },
  photoChoices: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  photoChoice: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
  },
  photoChoiceText: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  photoPreview: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignSelf: 'center',
    marginBottom: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  avatarHit: { width: '31%', alignItems: 'center' },
  avatarOption: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionOn: { borderColor: BRAND },
});
