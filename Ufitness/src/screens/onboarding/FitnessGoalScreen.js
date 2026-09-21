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
import { weeklyForFunding } from '../../features/meals/lib/budget';
import { loadSavedPlan, saveSavedPlan } from '../../features/meals/lib/persist';

const BRAND = '#8C3A12';
const ACCENT = '#E8722C';
const TEXT = '#1F2933';
const MUTED = '#6B7280';
const LINE = '#E8D5C8';

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
  if (Number(data?.foodBudgetAmount) > 0) return Number(data.foodBudgetAmount);
  const match = String(data?.foodBudget || '').match(/(\d[\d,]*)/g);
  if (match?.length) return Number(match[match.length - 1].replace(',', ''));
  return 1500;
}

function photoModeFromUri(uri) {
  if (!uri) return '';
  return PROFILE_AVATARS.some((item) => item.uri === uri) ? 'avatar' : 'upload';
}

function formatBudget(amount) {
  return `R${amount}`;
}

export default function FitnessGoalScreen({
  navigation,
  data,
  updateFields,
  completeOnboarding,
  editing = false,
}) {
  const { colors } = useTheme();
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

  const isEditing = Boolean(editing || data?.onboardingComplete);

  const payload = () => {
    const weekly = weeklyForFunding(budget);
    return {
      fitnessGoal: GOALS.find((item) => item.id === goal)?.label || 'General fitness',
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
  };

  const finish = async (requireGoal) => {
    if (requireGoal && !goal) {
      Alert.alert('Please select a fitness goal before continuing.');
      return;
    }
    if (requireGoal && !course) {
      Alert.alert('Please select your UJ course of study.');
      return;
    }
    if (requireGoal && !yearOfStudy) {
      Alert.alert('Please select your year of study.');
      return;
    }
    if (requireGoal && !avatarUrl) {
      Alert.alert('Choose your own photo or an avatar for your profile.');
      return;
    }
    const patch = payload();
    const saved = await loadSavedPlan();
    await saveSavedPlan({ ...(saved || {}), budget: patch.weeklyFoodBudget });
    if (isEditing) {
      updateFields?.(patch);
      if (navigation.canGoBack()) navigation.goBack();
      return;
    }
    await completeOnboarding?.(patch);
  };

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
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
          <View style={[styles.progressDot, styles.progressDotOn]} />
          <View style={[styles.progressDot, styles.progressDotMid]} />
          <View style={[styles.progressDot, styles.progressDotEnd]} />
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
                  selected && styles.goalTileOn,
                ]}
              >
                <Ionicons name={item.icon} size={28} color={selected ? BRAND : ACCENT} />
                <Text style={[styles.goalLabel, { color: colors.text }, selected && styles.goalLabelOn]}>{item.label}</Text>
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
                  selected && styles.campusChipOn,
                ]}
              >
                <Text style={[styles.campusText, selected && styles.campusTextOn]}>{item.label}</Text>
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
                  selected && styles.campusChipOn,
                ]}
              >
                <Ionicons name={item.icon} size={16} color={selected ? '#fff' : BRAND} />
                <Text style={[styles.genderChipText, selected && styles.campusTextOn]} numberOfLines={2}>
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

        <Pressable style={styles.continueBtn} onPress={() => finish(true)}>
          <Text style={styles.continueText}>{isEditing ? 'Save' : 'Continue'}</Text>
          <Ionicons name={isEditing ? 'checkmark' : 'arrow-forward'} size={18} color="#fff" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SelectField({ label, placeholder, value, options, onSelect }) {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();
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
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            {options.map((option) => (
              <Pressable
                key={option}
                style={styles.sheetRow}
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
  const { colors } = useTheme();
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
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={[styles.courseSheet, { backgroundColor: colors.card }]} onPress={() => {}}>
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
                  style={styles.sheetRow}
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

  const pickOwnPhoto = async () => {
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
    if (!result.canceled && result.assets?.[0]?.uri) {
      onPickUri(result.assets[0].uri);
    }
  };

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
            photoMode === 'upload' && styles.photoChoiceOn,
          ]}
        >
          <Ionicons name="camera-outline" size={22} color={photoMode === 'upload' ? BRAND : ACCENT} />
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
            photoMode === 'avatar' && styles.photoChoiceOn,
          ]}
        >
          <Ionicons name="happy-outline" size={22} color={photoMode === 'avatar' ? BRAND : ACCENT} />
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
  const min = 500;
  const max = 10000;
  const trackRef = useRef(null);
  const widthRef = useRef(1);
  const leftRef = useRef(0);
  const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)));

  const applyPageX = (pageX) => {
    const width = Math.max(widthRef.current, 1);
    const x = Math.min(width, Math.max(0, pageX - leftRef.current));
    const next = Math.round((min + (x / width) * (max - min)) / 50) * 50;
    onChange(Math.min(max, Math.max(min, next)));
  };

  const measure = () => {
    trackRef.current?.measureInWindow?.((x, _y, width) => {
      if (typeof x === 'number') leftRef.current = x;
      if (width) widthRef.current = width;
    });
  };

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
      <View style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: `${ratio * 100}%` }]} />
        <View style={[styles.sliderThumb, { left: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
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
    backgroundColor: '#F0E4DC',
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
    backgroundColor: '#F0E4DC',
    top: -2,
  },
  progressDotOn: { left: '32%', backgroundColor: ACCENT },
  progressDotMid: { left: '64%' },
  progressDotEnd: { right: 0 },
  skip: { color: ACCENT, fontWeight: '800', fontSize: 13, letterSpacing: 0.6 },
  content: { paddingHorizontal: 20, paddingBottom: 36 },
  title: { fontSize: 28, fontWeight: '800', color: TEXT, marginTop: 8 },
  subtitle: { fontSize: 14, color: MUTED, lineHeight: 20, marginTop: 8, marginBottom: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 22 },
  goalTile: {
    width: '47.5%',
    minHeight: 108,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#F0D9CC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  goalTileOn: { backgroundColor: '#F6E4D8', borderColor: '#E8C8B4' },
  goalLabel: { fontSize: 14, fontWeight: '700', color: TEXT, textAlign: 'center' },
  goalLabelOn: { color: BRAND },
  fieldBlock: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: LINE,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  selectValue: { flex: 1, fontSize: 15, color: TEXT, fontWeight: '600' },
  selectPlaceholder: { color: '#A3A3A3', fontWeight: '500' },
  campusRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  campusChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: LINE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  campusChipOn: { backgroundColor: BRAND, borderColor: BRAND },
  campusText: { fontSize: 13, fontWeight: '800', color: BRAND },
  campusTextOn: { color: '#fff' },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  genderChip: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: LINE,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  genderChipText: { fontSize: 12, fontWeight: '800', color: BRAND, textAlign: 'center', flexShrink: 1 },
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
    backgroundColor: '#F0E4DC',
    justifyContent: 'center',
  },
  sliderFill: { height: 8, borderRadius: 99, backgroundColor: BRAND },
  sliderThumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BRAND,
    top: -7,
    marginLeft: -11,
  },
  budgetEnds: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 16 },
  budgetHint: { fontSize: 12, color: MUTED, fontWeight: '600' },
  continueBtn: {
    marginTop: 8,
    backgroundColor: BRAND,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 28,
  },
  sheet: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  sheetRow: { paddingVertical: 16, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  sheetText: { fontSize: 16, color: TEXT, fontWeight: '600' },
  courseSheet: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '80%',
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
    borderColor: '#F0D9CC',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
  },
  photoChoiceOn: { backgroundColor: '#F6E4D8', borderColor: '#E8C8B4' },
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
