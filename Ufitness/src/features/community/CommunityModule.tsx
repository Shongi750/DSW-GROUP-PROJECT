import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import SafeImage from '../../components/SafeImage';
import CookVideo from '../meals/components/CookVideo';
import { getRecipe } from '../meals/data/recipes';
import { SA_MEALS } from '../meals/data/saFoods';
import { loadCommunityState, saveCommunityState } from './persist';
import { getGroupPage, mergeGroupMembership } from './groupPages';
import WorkoutClipCard from './WorkoutClipCard';

function useCommunityStyles() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  return { styles, colors, isDark };
}

const UJ_CAMPUSES = [
  'APK (Auckland Park Kingsway)',
  'APB (Auckland Park Bunting Road)',
  'DFC (Doornfontein)',
  'SWC (Soweto)',
];

type Profile = {
  name: string;
  avatarUri: string | null;
  residenceCampus: string;
  studyCampus: string;
};

type Comment = {
  id: string;
  author: string;
  avatarUri?: string | null;
  text: string;
};

type WorkoutStats = {
  title: string;
  durationMinutes: string;
  totalWeightKg?: string;
  distanceKm?: string;
};

type GymGoal = 'Pre-workout' | 'Post-workout' | 'High-protein' | 'Cut' | 'Bulk';

type GymRecipe = {
  title: string;
  goal: GymGoal;
  ingredients: string[];
  steps: string[];
  youtubeId?: string;
  youtubeTitle?: string;
};

type WorkoutClip = {
  title: string;
  videoUri: string;
  musicTitle: string;
  musicArtist?: string;
};

type Post = {
  id: string;
  author: string;
  avatarUri?: string | null;
  text: string;
  imageUri?: any;
  likes: number;
  comments: Comment[];
  isCheckIn?: boolean;
  busynessStatus?: 'Quiet' | 'Moderate' | 'Packed';
  campus?: string;
  workoutStats?: WorkoutStats;
  recipe?: GymRecipe;
  workoutClip?: WorkoutClip;
};

const GYM_GOALS: GymGoal[] = ['Pre-workout', 'Post-workout', 'High-protein', 'Cut', 'Bulk'];

const GYM_PLANNER_MEALS = [
  { id: 'pap-eggs', goal: 'Post-workout' as GymGoal },
  { id: 'eggs-toast', goal: 'Pre-workout' as GymGoal },
  { id: 'tuna-sandwich', goal: 'High-protein' as GymGoal },
  { id: 'chicken-rice', goal: 'Bulk' as GymGoal },
  { id: 'chicken-sandwich', goal: 'Post-workout' as GymGoal },
  { id: 'pasta-soya', goal: 'High-protein' as GymGoal },
];

function parseYouTubeId(input: string): string | null {
  const raw = (input || '').trim();
  if (!raw) return null;
  const match =
    raw.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/) ||
    raw.match(/^([A-Za-z0-9_-]{11})$/);
  return match ? match[1] : null;
}

type Group = {
  id: string;
  name: string;
  link: string;
  campus?: string;
  imageUri?: any;
  status: 'none' | 'joined';
  about?: string;
  nextSession?: string;
};

type CampusProgress = {
  campusCode: string;
  completedCount: number;
};

type Challenge = {
  id: string;
  name: string;
  description: string;
  imageUri?: any;
  joined: boolean;
  campusScores: CampusProgress[];
};

type GymBusyness = {
  campus: string;
  status: 'Quiet' | 'Moderate' | 'Packed';
  lastUpdated: string;
  reportedBy: string;
  note?: string;
};

type ChallengeDay = { day: number; label: string; isRest: boolean };

const PUSHUP_PLAN: ChallengeDay[] = [
  { day: 1, label: '3 x 12', isRest: false },
  { day: 2, label: '3 x 14', isRest: false },
  { day: 3, label: 'Rest', isRest: true },
  { day: 4, label: '4 x 12', isRest: false },
  { day: 5, label: '4 x 14', isRest: false },
  { day: 6, label: 'Rest', isRest: true },
  { day: 7, label: '4 x 15', isRest: false },
  { day: 8, label: '3 x 18', isRest: false },
  { day: 9, label: 'Rest', isRest: true },
  { day: 10, label: 'Max effort test', isRest: false },
  { day: 11, label: '4 x 16', isRest: false },
  { day: 12, label: '4 x 18', isRest: false },
  { day: 13, label: 'Rest', isRest: true },
  { day: 14, label: '5 x 15', isRest: false },
  { day: 15, label: '5 x 16', isRest: false },
  { day: 16, label: 'Rest', isRest: true },
  { day: 17, label: '4 x 20', isRest: false },
  { day: 18, label: '3 x 25', isRest: false },
  { day: 19, label: 'Rest', isRest: true },
  { day: 20, label: 'Max effort test', isRest: false },
  { day: 21, label: '5 x 18', isRest: false },
  { day: 22, label: '5 x 20', isRest: false },
  { day: 23, label: 'Rest', isRest: true },
  { day: 24, label: '4 x 25', isRest: false },
  { day: 25, label: '4 x 27', isRest: false },
  { day: 26, label: 'Rest', isRest: true },
  { day: 27, label: '3 x 30', isRest: false },
  { day: 28, label: '5 x 22', isRest: false },
  { day: 29, label: 'Rest', isRest: true },
  { day: 30, label: 'Final max effort test', isRest: false },
];

const INITIAL_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'APK Morning Runners',
    campus: 'APK (Auckland Park Kingsway)',
    link: 'myapp://group/g1',
    imageUri: { uri: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80' },
    status: 'none',
    about: 'Easy 5 km loops before lectures. New runners welcome — no pace gate.',
    nextSession: 'Tue 06:15 · APK Kingsway loop',
  },
  {
    id: 'g2',
    name: 'APB Weightlifting Crew',
    campus: 'APB (Auckland Park Bunting Road)',
    link: 'myapp://group/g2',
    imageUri: { uri: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80' },
    status: 'none',
    about: 'Compound lifts, form checks, and a shared squat rack booking at APB.',
    nextSession: 'Wed 17:30 · APB gym floor',
  },
  {
    id: 'g3',
    name: 'DFC Yoga & Stretch',
    campus: 'DFC (Doornfontein)',
    link: 'myapp://group/g3',
    imageUri: { uri: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80' },
    status: 'none',
    about: 'Mobility and recovery after labs. Mats on the DFC courtyard when the studio is full.',
    nextSession: 'Thu 16:00 · DFC courtyard',
  },
  {
    id: 'g4',
    name: 'SWC Soccer Club',
    campus: 'SWC (Soweto)',
    link: 'myapp://group/g4',
    imageUri: { uri: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80' },
    status: 'none',
    about: 'Five-a-side and weekend matches. Boots optional, shin guards if you have them.',
    nextSession: 'Sat 09:00 · SWC field',
  },
];

const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    name: '30-Day Push-Up Challenge',
    description: 'Build upper body endurance with daily set progressions.',
    imageUri: { uri: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=800&q=80' },
    joined: false,
    campusScores: [
      { campusCode: 'APK', completedCount: 42 },
      { campusCode: 'APB', completedCount: 28 },
      { campusCode: 'DFC', completedCount: 19 },
      { campusCode: 'SWC', completedCount: 31 },
    ],
  },
  {
    id: 'c2',
    name: 'Step Count Sprint',
    description: 'Hit 10,000 steps daily across campus grounds.',
    imageUri: { uri: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80' },
    joined: false,
    campusScores: [
      { campusCode: 'APK', completedCount: 88 },
      { campusCode: 'APB', completedCount: 64 },
      { campusCode: 'DFC', completedCount: 45 },
      { campusCode: 'SWC', completedCount: 52 },
    ],
  },
  {
    id: 'c3',
    name: '500-Squat Leg Blitz',
    description: 'Accumulate 500 squats over 7 days for lower-body power.',
    imageUri: { uri: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80' },
    joined: false,
    campusScores: [
      { campusCode: 'APK', completedCount: 35 },
      { campusCode: 'APB', completedCount: 41 },
      { campusCode: 'DFC', completedCount: 22 },
      { campusCode: 'SWC', completedCount: 18 },
    ],
  },
  {
    id: 'c4',
    name: '5K Campus Dash',
    description: 'Run or walk a total 5km timed attempt around campus.',
    imageUri: { uri: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80' },
    joined: false,
    campusScores: [
      { campusCode: 'APK', completedCount: 60 },
      { campusCode: 'APB', completedCount: 39 },
      { campusCode: 'DFC', completedCount: 51 },
      { campusCode: 'SWC', completedCount: 44 },
    ],
  },
  {
    id: 'c5',
    name: '100-Minute Plank Hold',
    description: 'Log cumulative plank holds until reaching 100 total minutes.',
    imageUri: { uri: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80' },
    joined: false,
    campusScores: [
      { campusCode: 'APK', completedCount: 24 },
      { campusCode: 'APB', completedCount: 19 },
      { campusCode: 'DFC', completedCount: 15 },
      { campusCode: 'SWC', completedCount: 29 },
    ],
  },
];

const INITIAL_GYM_STATUSES: Record<string, GymBusyness> = {
  APK: { campus: 'APK', status: 'Moderate', lastUpdated: '10 mins ago', reportedBy: 'Thabo M.', note: 'Benches free, cardio packed' },
  APB: { campus: 'APB', status: 'Quiet', lastUpdated: '25 mins ago', reportedBy: 'Lerato K.', note: 'Plenty of free weights' },
  DFC: { campus: 'DFC', status: 'Packed', lastUpdated: '5 mins ago', reportedBy: 'Sipho N.', note: 'Full queue for squat rack' },
  SWC: { campus: 'SWC', status: 'Quiet', lastUpdated: '1 hour ago', reportedBy: 'System', note: 'Normal traffic' },
};

const INITIAL_POSTS: Post[] = [
  {
    id: 'clip1',
    author: 'Thabo M.',
    text: 'Last three benches at APK. This track carried the set.',
    likes: 14,
    comments: [{ id: 'clipc1', author: 'Kagiso M.', text: 'Saving this song for Thursday legs.' }],
    workoutClip: {
      title: 'APK bench clip',
      videoUri: 'https://videos.pexels.com/video-files/5319066/5319066-sd_540_960_25fps.mp4',
      musicTitle: 'Power',
      musicArtist: 'Kanye West',
    },
  },
  {
    id: 'r1',
    author: 'Lerato K.',
    text: 'Post-gym plate on a student budget. Eggs for protein, pap to refill glycogen.',
    likes: 11,
    comments: [{ id: 'rc1', author: 'Thabo M.', text: 'This is what I eat after APK gym too.' }],
    recipe: {
      title: 'Pap & scrambled eggs',
      goal: 'Post-workout',
      ingredients: ['1 cup maize meal', '2 eggs', 'pinch of salt'],
      steps: [
        'Cook stiff pap in a small pot.',
        'Scramble two eggs in a pan.',
        'Plate pap with eggs on the side. Eat within an hour of training.',
      ],
      youtubeId: '0B8Yy45DLi4',
      youtubeTitle: 'Fully-Loaded Pap Cups 3-Ways',
    },
  },
  {
    id: 'w1',
    author: 'Kagiso M.',
    text: 'Smashed a new PR on bench press today at APK Gym!',
    imageUri: { uri: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80' },
    likes: 8,
    comments: [{ id: 'c1', author: 'Sipho N.', text: 'Light weight baby!' }],
    workoutStats: {
      title: 'Upper Body Power',
      durationMinutes: '65',
      totalWeightKg: '3,450',
    },
  },
  {
    id: '1',
    author: 'Thabo M.',
    text: 'Anyone up for a 6am run tomorrow?',
    imageUri: { uri: 'https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?auto=format&fit=crop&w=800&q=80' },
    likes: 2,
    comments: [
      { id: 'cm1', author: 'Sipho N.', text: 'Count me in! Meet at APK gym?' },
    ],
  },
  {
    id: 'r2',
    author: 'Sipho N.',
    text: 'Sunday batch-cook for bulk week. IQF chicken and rice lasts three gym days.',
    likes: 6,
    comments: [],
    recipe: {
      title: 'Chicken & rice stew',
      goal: 'Bulk',
      ingredients: ['IQF chicken pieces', '1 cup rice', 'tomato sauce', 'onion'],
      steps: [
        'Brown the chicken with onion.',
        'Add tomato sauce and simmer until cooked through.',
        'Serve on a cup of rice. Pack leftovers for campus.',
      ],
      youtubeId: 'pe_KDAKKdNE',
      youtubeTitle: '5-Ingredient One-Pot Chicken Rice',
    },
  },
];

export default function CommunityModule({
  profileFromApp,
  onOpenBuddies,
  onOpenMentors,
}: {
  profileFromApp?: Profile | null;
  onOpenBuddies?: () => void;
  onOpenMentors?: () => void;
}) {
  return (
    <SafeAreaProvider>
      <AppContent
        profileFromApp={profileFromApp}
        onOpenBuddies={onOpenBuddies}
        onOpenMentors={onOpenMentors}
      />
    </SafeAreaProvider>
  );
}

function AppContent({
  profileFromApp,
  onOpenBuddies,
  onOpenMentors,
}: {
  profileFromApp?: Profile | null;
  onOpenBuddies?: () => void;
  onOpenMentors?: () => void;
}) {
  const { styles, colors } = useCommunityStyles();
  const [screen, setScreen] = useState<
    'home' | 'profileCreation' | 'community' | 'groups' | 'groupDetail' | 'challenges' | 'challengeDetail'
  >(profileFromApp ? 'community' : 'profileCreation');
  const [profile, setProfile] = useState<Profile | null>(profileFromApp ?? null);

  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [groupsHydrated, setGroupsHydrated] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('c1');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('g1');

  useEffect(() => {
    let alive = true;
    loadCommunityState().then((saved) => {
      if (!alive) return;
      if (Array.isArray(saved?.groups)) setGroups(mergeGroupMembership(INITIAL_GROUPS, saved.groups));
      setGroupsHydrated(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!groupsHydrated) return undefined;
    const timer = setTimeout(() => {
      saveCommunityState({
        groups: groups.map((group) => ({
          id: group.id,
          name: group.name,
          campus: group.campus,
          link: group.link,
          imageUri: group.imageUri,
          status: group.status,
          about: group.about,
          nextSession: group.nextSession,
        })),
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [groups, groupsHydrated]);

  const openGroup = (id: string) => {
    setSelectedGroupId(id);
    setScreen('groupDetail');
  };

  const joinGroup = (id: string) => {
    setGroups((current) => current.map((group) => (group.id === id ? { ...group, status: 'joined' } : group)));
    openGroup(id);
  };

  const handleStartCommunity = () => {
    if (!profile) {
      setScreen('profileCreation');
    } else {
      setScreen('community');
    }
  };

  const handleProfileSubmit = (newProfile: Profile) => {
    setProfile(newProfile);
    setScreen('community');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {screen === 'home' ? (
        <HomeScreen onOpenCommunity={handleStartCommunity} />
      ) : screen === 'profileCreation' ? (
        <ProfileCreationScreen
          onSubmit={handleProfileSubmit}
          onBack={() => setScreen(profileFromApp ? 'community' : 'home')}
        />
      ) : screen === 'community' ? (
        <CampusCommunityScreen
          profile={profile}
          onBack={profileFromApp ? undefined : () => setScreen('home')}
          onOpenGroups={() => setScreen('groups')}
          onOpenChallenges={() => setScreen('challenges')}
          onOpenBuddies={onOpenBuddies}
          onOpenMentors={onOpenMentors}
        />
      ) : screen === 'groups' ? (
        <GroupsScreen
          groups={groups}
          setGroups={setGroups}
          onBack={() => setScreen('community')}
          onOpenGroup={openGroup}
          onJoinGroup={joinGroup}
        />
      ) : screen === 'groupDetail' ? (
        <GroupDetailScreen
          group={groups.find((item) => item.id === selectedGroupId) || groups[0]}
          onBack={() => setScreen('groups')}
          onJoin={() => joinGroup(selectedGroupId)}
          onLeave={() => {
            setGroups((current) =>
              current.map((group) => (group.id === selectedGroupId ? { ...group, status: 'none' } : group))
            );
            setScreen('groups');
          }}
        />
      ) : screen === 'challenges' ? (
        <ChallengesScreen
          challenges={challenges}
          setChallenges={setChallenges}
          onBack={() => setScreen('community')}
          onOpenChallengeDetail={(id) => {
            setSelectedChallengeId(id);
            setScreen('challengeDetail');
          }}
        />
      ) : (
        <ChallengeDetailScreen
          challenge={challenges.find((c) => c.id === selectedChallengeId) || challenges[0]}
          onBack={() => setScreen('challenges')}
        />
      )}
    </SafeAreaView>
  );
}

function HomeScreen({ onOpenCommunity }: { onOpenCommunity: () => void }) {
  const { styles } = useCommunityStyles();
  return (
    <View style={styles.homeContainer}>
      <Text style={styles.heading}>Welcome</Text>
      <TouchableOpacity style={styles.mainButton} onPress={onOpenCommunity}>
        <Text style={styles.mainButtonText}>Campus Community</Text>
      </TouchableOpacity>
    </View>
  );
}

function ProfileCreationScreen({
  onSubmit,
  onBack,
}: {
  onSubmit: (profile: Profile) => void;
  onBack: () => void;
}) {
  const { styles, colors } = useCommunityStyles();
  const [name, setName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [residenceCampus, setResidenceCampus] = useState('');
  const [studyCampus, setStudyCampus] = useState('');

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('We need photo library access to upload a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Please enter your name.');
      return;
    }
    if (!residenceCampus) {
      Alert.alert('Please select the campus you stay on.');
      return;
    }
    if (!studyCampus) {
      Alert.alert('Please select the campus you study on.');
      return;
    }
    onSubmit({ name, avatarUri, residenceCampus, studyCampus });
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity onPress={onBack} style={styles.backRow}>
        <Ionicons name="arrow-back" size={20} color="#C85A17" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.heading}>Create Your Profile</Text>
      <Text style={styles.subHeading}>Set up your University of Johannesburg details</Text>

      <View style={styles.avatarSection}>
        <TouchableOpacity style={styles.avatarPlaceholder} onPress={handlePickAvatar}>
          {avatarUri ? (
            <Image source={typeof avatarUri === 'string' ? { uri: avatarUri } : avatarUri} style={styles.avatarImage} />
          ) : (
            <View style={styles.iconPlaceholderWrap}>
              <Ionicons name="camera-outline" size={28} color="#4b5563" />
              <Text style={styles.avatarPlaceholderText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.fieldLabel}>Full Name</Text>
      <TextInput
        style={[styles.input, styles.profileInput]}
        placeholder="Enter your name..."
        placeholderTextColor={colors.muted}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.fieldLabel}>Which UJ campus do you stay on?</Text>
      <View style={styles.chipRow}>
        {UJ_CAMPUSES.map((campus) => {
          const isSelected = residenceCampus === campus;
          return (
            <TouchableOpacity
              key={`res-${campus}`}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => setResidenceCampus(campus)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {campus.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.fieldLabel}>Which UJ campus do you study on?</Text>
      <View style={styles.chipRow}>
        {UJ_CAMPUSES.map((campus) => {
          const isSelected = studyCampus === campus;
          return (
            <TouchableOpacity
              key={`study-${campus}`}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => setStudyCampus(campus)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {campus.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={[styles.mainButton, styles.submitButton]} onPress={handleSubmit}>
        <Text style={styles.mainButtonText}>Save Profile & Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function CampusCommunityScreen({
  profile,
  onBack,
  onOpenGroups,
  onOpenChallenges,
  onOpenBuddies,
  onOpenMentors,
}: {
  profile: Profile | null;
  onBack?: () => void;
  onOpenGroups: () => void;
  onOpenChallenges: () => void;
  onOpenBuddies?: () => void;
  onOpenMentors?: () => void;
}) {
  const { styles, colors } = useCommunityStyles();
  const [gymStatuses, setGymStatuses] = useState<Record<string, GymBusyness>>(INITIAL_GYM_STATUSES);
  const [communityHydrated, setCommunityHydrated] = useState(false);
  
  const resCode = profile?.residenceCampus ? profile.residenceCampus.split(' ')[0] : 'APK';
  const studyCode = profile?.studyCampus ? profile.studyCampus.split(' ')[0] : 'APB';
  
  const myCampuses = Array.from(new Set([resCode, studyCode]));
  
  const [showOtherCampuses, setShowOtherCampuses] = useState(false);
  const [selectedCampusForMeter, setSelectedCampusForMeter] = useState(myCampuses[0] || 'APK');
  const [busynessNote, setBusynessNote] = useState('');

  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutWeight, setWorkoutWeight] = useState('');
  const [workoutDistance, setWorkoutDistance] = useState('');
  const [workoutNote, setWorkoutNote] = useState('');
  const [workoutSelfieUri, setWorkoutSelfieUri] = useState<string | null>(null);

  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [recipeTitle, setRecipeTitle] = useState('');
  const [recipeGoal, setRecipeGoal] = useState<GymGoal | ''>('');
  const [recipeIngredients, setRecipeIngredients] = useState('');
  const [recipeSteps, setRecipeSteps] = useState('');
  const [recipeVideoUrl, setRecipeVideoUrl] = useState('');
  const [recipeCaption, setRecipeCaption] = useState('');

  const [isClipModalOpen, setIsClipModalOpen] = useState(false);
  const [clipTitle, setClipTitle] = useState('');
  const [clipVideoUri, setClipVideoUri] = useState<string | null>(null);
  const [clipMusicTitle, setClipMusicTitle] = useState('');
  const [clipMusicArtist, setClipMusicArtist] = useState('');
  const [clipCaption, setClipCaption] = useState('');

  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [newPost, setNewPost] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);

  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const displayedCampuses = showOtherCampuses
    ? ['APK', 'APB', 'DFC', 'SWC']
    : myCampuses;

  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await loadCommunityState();
      if (!alive) return;
      if (Array.isArray(saved?.posts) && saved.posts.length) setPosts(saved.posts);
      if (saved?.gymStatuses && typeof saved.gymStatuses === 'object') {
        setGymStatuses({ ...INITIAL_GYM_STATUSES, ...saved.gymStatuses });
      }
      setCommunityHydrated(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!communityHydrated) return undefined;
    const timer = setTimeout(() => {
      saveCommunityState({ posts, gymStatuses }, { replacePosts: true });
    }, 250);
    return () => clearTimeout(timer);
  }, [communityHydrated, posts, gymStatuses]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadCommunityState().then((saved) => {
        if (!alive) return;
        if (Array.isArray(saved?.posts) && saved.posts.length) setPosts(saved.posts);
        if (saved?.gymStatuses && typeof saved.gymStatuses === 'object') {
          setGymStatuses({ ...INITIAL_GYM_STATUSES, ...saved.gymStatuses });
        }
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  const handlePickWorkoutSelfie = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('We need camera library access to attach a gym selfie.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled) {
      setWorkoutSelfieUri(result.assets[0].uri);
    }
  };

  const handleUpdateBusyness = (status: 'Quiet' | 'Moderate' | 'Packed') => {
    const authorName = profile?.name || 'You';
    const updatedStatus: GymBusyness = {
      campus: selectedCampusForMeter,
      status,
      lastUpdated: 'Just now',
      reportedBy: authorName,
      note: busynessNote.trim() || undefined,
    };

    setGymStatuses((prev) => ({ ...prev, [selectedCampusForMeter]: updatedStatus }));

    const checkInPost: Post = {
      id: Date.now().toString(),
      author: authorName,
      avatarUri: profile?.avatarUri,
      text: `Checked in at ${selectedCampusForMeter} Gym: Reported as ${status.toUpperCase()}.${
        busynessNote.trim() ? ` "${busynessNote.trim()}"` : ''
      }`,
      likes: 0,
      comments: [],
      isCheckIn: true,
      busynessStatus: status,
      campus: selectedCampusForMeter,
    };

    setPosts([checkInPost, ...posts]);
    setBusynessNote('');
    Alert.alert('Updated!', `You reported ${selectedCampusForMeter} Gym as ${status}.`);
  };

  const handleShareWorkoutLog = () => {
    if (!workoutTitle.trim() || !workoutDuration.trim()) {
      Alert.alert('Missing Details', 'Please enter a workout title and duration.');
      return;
    }

    const newLogPost: Post = {
      id: Date.now().toString(),
      author: profile?.name || 'You',
      avatarUri: profile?.avatarUri,
      text: workoutNote.trim() || `Completed a ${workoutTitle} session!`,
      imageUri: workoutSelfieUri ? { uri: workoutSelfieUri } : undefined,
      likes: 0,
      comments: [],
      workoutStats: {
        title: workoutTitle.trim(),
        durationMinutes: workoutDuration.trim(),
        totalWeightKg: workoutWeight.trim() || undefined,
        distanceKm: workoutDistance.trim() || undefined,
      },
    };

    setPosts([newLogPost, ...posts]);

    setWorkoutTitle('');
    setWorkoutDuration('');
    setWorkoutWeight('');
    setWorkoutDistance('');
    setWorkoutNote('');
    setWorkoutSelfieUri(null);
    setIsWorkoutModalOpen(false);
  };

  const resetRecipeForm = () => {
    setRecipeTitle('');
    setRecipeGoal('');
    setRecipeIngredients('');
    setRecipeSteps('');
    setRecipeVideoUrl('');
    setRecipeCaption('');
  };

  const fillFromPlannerMeal = (mealId: string, goal: GymGoal) => {
    const meal = SA_MEALS.find((item: { id: string }) => item.id === mealId);
    const recipe = getRecipe(mealId);
    if (!meal || !recipe) return;
    setRecipeTitle(meal.title);
    setRecipeGoal(goal);
    setRecipeIngredients((recipe.portions || []).map((item: { label: string }) => item.label).join('\n'));
    setRecipeSteps((recipe.steps || []).join('\n'));
    setRecipeVideoUrl(recipe.video?.youtubeId ? `https://www.youtube.com/watch?v=${recipe.video.youtubeId}` : '');
    setRecipeCaption(`Gym fuel from the meal planner · ${goal}.`);
  };

  const handleShareRecipe = () => {
    if (!recipeTitle.trim()) {
      Alert.alert('Missing title', 'Name the gym meal you are sharing.');
      return;
    }
    if (!recipeGoal) {
      Alert.alert('Pick a gym goal', 'Recipes on this board have to be gym-related: pre-workout, post-workout, high-protein, cut, or bulk.');
      return;
    }
    const ingredients = recipeIngredients
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const steps = recipeSteps
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (!ingredients.length) {
      Alert.alert('Add the recipe', 'Include at least one ingredient.');
      return;
    }
    if (!steps.length) {
      Alert.alert('Add a cook step', 'Write at least one cook step. The video is extra help, not the recipe.');
      return;
    }
    const youtubeId = parseYouTubeId(recipeVideoUrl);
    if (!youtubeId) {
      Alert.alert('Add a cook video', 'Paste a YouTube watch, share, or shorts link so others can cook along.');
      return;
    }

    const recipePost: Post = {
      id: Date.now().toString(),
      author: profile?.name || 'You',
      avatarUri: profile?.avatarUri,
      text: recipeCaption.trim() || `${recipeGoal} gym meal: ${recipeTitle.trim()}`,
      likes: 0,
      comments: [],
      recipe: {
        title: recipeTitle.trim(),
        goal: recipeGoal,
        ingredients,
        steps,
        youtubeId,
        youtubeTitle: recipeTitle.trim(),
      },
    };

    setPosts([recipePost, ...posts]);
    resetRecipeForm();
    setIsRecipeModalOpen(false);
  };

  const resetClipForm = () => {
    setClipTitle('');
    setClipVideoUri(null);
    setClipMusicTitle('');
    setClipMusicArtist('');
    setClipCaption('');
  };

  const handlePickWorkoutClip = async (fromCamera = false) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', fromCamera ? 'Camera access is needed to record a clip.' : 'Photo library access is needed to pick a clip.');
      return;
    }
    const options = {
      mediaTypes: ['videos'] as ['videos'],
      quality: 0.7,
      videoMaxDuration: 45,
    };
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled) {
      setClipVideoUri(result.assets[0].uri);
    }
  };

  const handleShareWorkoutClip = () => {
    if (!clipVideoUri) {
      Alert.alert('Add your clip', 'Record or pick a video of you working out.');
      return;
    }
    if (!clipMusicTitle.trim()) {
      Alert.alert('Add the song', 'Name the track that plays on this clip, like Instagram.');
      return;
    }
    const title = clipTitle.trim() || 'Workout clip';
    const clipPost: Post = {
      id: Date.now().toString(),
      author: profile?.name || 'You',
      avatarUri: profile?.avatarUri,
      text: clipCaption.trim() || `Training to ${clipMusicTitle.trim()}`,
      likes: 0,
      comments: [],
      workoutClip: {
        title,
        videoUri: clipVideoUri,
        musicTitle: clipMusicTitle.trim(),
        musicArtist: clipMusicArtist.trim() || undefined,
      },
    };
    setPosts([clipPost, ...posts]);
    resetClipForm();
    setIsClipModalOpen(false);
  };

  const handleAddPost = () => {
    if (!newPost.trim() && !newPostImage) return;
    setPosts([
      {
        id: Date.now().toString(),
        author: profile?.name || 'You',
        avatarUri: profile?.avatarUri,
        text: newPost,
        imageUri: newPostImage ? { uri: newPostImage } : undefined,
        likes: 0,
        comments: [],
      },
      ...posts,
    ]);
    setNewPost('');
    setNewPostImage(null);
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('We need photo library access to attach an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled) {
      setNewPostImage(result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => setNewPostImage(null);

  const handleLike = (id: string) => {
    setPosts(posts.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p)));
  };

  const isOwnPost = (item: Post) => {
    const mine = profile?.name || 'You';
    return item.author === mine || item.author === 'You';
  };

  const handleDeletePost = (item: Post) => {
    if (!isOwnPost(item)) return;
    Alert.alert('Delete post', 'Remove this from the Community board?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setPosts((current) => current.filter((post) => post.id !== item.id)),
      },
    ]);
  };

  const handleAddComment = (postId: string) => {
    if (!commentText.trim()) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      author: profile?.name || 'You',
      avatarUri: profile?.avatarUri,
      text: commentText.trim(),
    };
    setPosts(
      posts.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
      )
    );
    setCommentText('');
  };

  return (
    <>
      <FlatList
        style={[styles.list, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        ListHeaderComponent={
          <>
            {onBack ? (
              <TouchableOpacity onPress={onBack} style={styles.backRow}>
                <Ionicons name="arrow-back" size={20} color="#C85A17" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            ) : null}

            <Text style={styles.heading}>UJ Community Board</Text>

            {profile && (
              <View style={styles.profileBadgeBanner}>
                {profile.avatarUri && (
                  <Image source={typeof profile.avatarUri === 'string' ? { uri: profile.avatarUri } : profile.avatarUri} style={styles.bannerAvatar} />
                )}
                <View>
                  <Text style={styles.bannerWelcome}>Logged in as: {profile.name}</Text>
                  <Text style={styles.bannerCampusSub}>
                    Residence: {resCode} | Study: {studyCode}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.navButtonsRow}>
              <TouchableOpacity style={styles.navButton} onPress={onOpenGroups}>
                <Ionicons name="people-outline" size={18} color="#9A3412" style={{ marginRight: 6 }} />
                <Text style={styles.navButtonText}>Groups</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButton} onPress={onOpenChallenges}>
                <Ionicons name="trophy-outline" size={18} color="#9A3412" style={{ marginRight: 6 }} />
                <Text style={styles.navButtonText}>Challenges</Text>
              </TouchableOpacity>
              {onOpenBuddies ? (
                <TouchableOpacity style={styles.navButton} onPress={onOpenBuddies}>
                  <Ionicons name="people-circle-outline" size={18} color="#9A3412" style={{ marginRight: 6 }} />
                  <Text style={styles.navButtonText}>Buddies</Text>
                </TouchableOpacity>
              ) : null}
              {onOpenMentors ? (
                <TouchableOpacity style={styles.navButton} onPress={onOpenMentors}>
                  <Ionicons name="school-outline" size={18} color="#9A3412" style={{ marginRight: 6 }} />
                  <Text style={styles.navButtonText}>Mentors</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Personalized Gym Busyness Section */}
            <View style={styles.meterContainer}>
              <View style={styles.meterTitleRow}>
                <Ionicons name="flame" size={20} color="#C85A17" style={{ marginRight: 6 }} />
                <Text style={styles.meterTitle}>Your Campus Gym Busyness</Text>
              </View>

              <View style={styles.meterCampusRow}>
                {displayedCampuses.map((code) => {
                  const info = gymStatuses[code];
                  const statusColor =
                    info?.status === 'Quiet'
                      ? '#16a34a'
                      : info?.status === 'Moderate'
                      ? '#d97706'
                      : '#dc2626';

                  return (
                    <TouchableOpacity
                      key={`meter-${code}`}
                      style={[
                        styles.meterCard,
                        selectedCampusForMeter === code && styles.meterCardSelected,
                      ]}
                      onPress={() => setSelectedCampusForMeter(code)}
                    >
                      <Text style={styles.meterCampusText}>{code}</Text>
                      <Text style={[styles.meterBadgeText, { color: statusColor }]}>
                        {info?.status || 'Unknown'}
                      </Text>
                      <Text style={styles.meterTimeText}>{info?.lastUpdated}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.toggleCampusesBtn}
                onPress={() => setShowOtherCampuses(!showOtherCampuses)}
              >
                <Text style={styles.toggleCampusesText}>
                  {showOtherCampuses ? 'Hide other campuses' : 'See other campuses'}
                </Text>
              </TouchableOpacity>

              {gymStatuses[selectedCampusForMeter]?.note && (
                <View style={styles.noteRow}>
                  <Ionicons name="chatbubble-ellipses-outline" size={14} color="#334155" style={{ marginRight: 4 }} />
                  <Text style={styles.meterNote}>
                    "{gymStatuses[selectedCampusForMeter].note}" —{' '}
                    <Text style={{ fontWeight: 'bold' }}>
                      {gymStatuses[selectedCampusForMeter].reportedBy}
                    </Text>
                  </Text>
                </View>
              )}

              <View style={styles.checkInBox}>
                <Text style={styles.checkInLabel}>
                  Are you currently at {selectedCampusForMeter} Gym? Update Status:
                </Text>

                <TextInput
                  style={[styles.input, { marginRight: 0, marginBottom: 8 }]}
                  placeholder="Optional note (e.g. Squat rack available)..."
                  value={busynessNote}
                  onChangeText={setBusynessNote}
                />

                <View style={styles.busynessBtnRow}>
                  <TouchableOpacity
                    style={[styles.statusBtn, styles.btnQuiet]}
                    onPress={() => handleUpdateBusyness('Quiet')}
                  >
                    <Ionicons name="radio-button-on" size={12} color="#16a34a" style={{ marginRight: 4 }} />
                    <Text style={styles.statusBtnText}>Quiet</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statusBtn, styles.btnModerate]}
                    onPress={() => handleUpdateBusyness('Moderate')}
                  >
                    <Ionicons name="radio-button-on" size={12} color="#d97706" style={{ marginRight: 4 }} />
                    <Text style={styles.statusBtnText}>Moderate</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statusBtn, styles.btnPacked]}
                    onPress={() => handleUpdateBusyness('Packed')}
                  >
                    <Ionicons name="radio-button-on" size={12} color="#dc2626" style={{ marginRight: 4 }} />
                    <Text style={styles.statusBtnText}>Packed</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Share Workout Log Action Trigger */}
            <TouchableOpacity
              style={styles.workoutTriggerButton}
              onPress={() => setIsWorkoutModalOpen(true)}
            >
              <Ionicons name="barbell-outline" size={18} color="#f8fafc" style={{ marginRight: 8 }} />
              <Text style={styles.workoutTriggerText}>Log Workout with Stats & Selfie</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recipeTriggerButton}
              onPress={() => setIsRecipeModalOpen(true)}
            >
              <Ionicons name="restaurant-outline" size={18} color="#9A3412" style={{ marginRight: 8 }} />
              <Text style={styles.recipeTriggerText}>Share gym recipe & cook video</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recipeTriggerButton}
              onPress={() => setIsClipModalOpen(true)}
            >
              <Ionicons name="musical-notes-outline" size={18} color="#9A3412" style={{ marginRight: 8 }} />
              <Text style={styles.recipeTriggerText}>Share workout clip & music</Text>
            </TouchableOpacity>

            {/* Post Creation Box */}
            {newPostImage && (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: newPostImage }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveImage}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            <TextInput
              style={[styles.input, styles.captionInput]}
              placeholder={newPostImage ? 'Write a caption...' : "What's on your mind?"}
              placeholderTextColor={colors.muted}
              value={newPost}
              onChangeText={setNewPost}
              multiline
            />

            <View style={styles.postActionsRow}>
              <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
                <Ionicons name="camera-outline" size={16} color="#C85A17" style={{ marginRight: 4 }} />
                <Text style={styles.photoButtonText}>
                  {newPostImage ? 'Change Photo' : 'Add Photo'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.postButton} onPress={handleAddPost}>
                <Text style={styles.postButtonText}>Post</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Community Posts Feed</Text>
          </>
        }
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isCommenting = activeCommentPostId === item.id;
          return (
            <View style={[styles.card, item.isCheckIn && styles.checkInPostCard]}>
              <View style={styles.postHeaderRow}>
                {item.avatarUri ? (
                  <Image source={typeof item.avatarUri === 'string' ? { uri: item.avatarUri } : item.avatarUri} style={styles.postAvatar} />
                ) : (
                  <View style={[styles.postAvatar, styles.postAvatarFallback]}>
                    <Text style={styles.fallbackAvatarText}>{item.author.charAt(0)}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.author}>{item.author}</Text>
                  {item.isCheckIn && (
                    <View style={styles.tagRow}>
                      <Ionicons name="location-outline" size={12} color="#166534" style={{ marginRight: 2 }} />
                      <Text style={styles.checkInTag}>Gym Check-In • {item.campus}</Text>
                    </View>
                  )}
                  {item.recipe && (
                    <View style={styles.tagRow}>
                      <Ionicons name="restaurant-outline" size={12} color="#9A3412" style={{ marginRight: 2 }} />
                      <Text style={styles.recipeTag}>Gym recipe • {item.recipe.goal}</Text>
                    </View>
                  )}
                  {item.workoutClip && (
                    <View style={styles.tagRow}>
                      <Ionicons name="musical-notes-outline" size={12} color="#9A3412" style={{ marginRight: 2 }} />
                      <Text style={styles.recipeTag}>
                        Workout clip • {item.workoutClip.musicTitle}
                      </Text>
                    </View>
                  )}
                </View>
                {isOwnPost(item) ? (
                  <TouchableOpacity onPress={() => handleDeletePost(item)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Workout Log Highlight Section */}
              {item.workoutStats && (
                <View style={styles.workoutCardBadge}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="flash-outline" size={16} color="#9A3412" style={{ marginRight: 4 }} />
                    <Text style={styles.workoutCardTitle}>
                      {item.workoutStats.title}
                    </Text>
                  </View>
                  <View style={styles.workoutStatsRow}>
                    <View style={styles.statChip}>
                      <Ionicons name="time-outline" size={12} color="#64748b" style={{ marginRight: 4 }} />
                      <Text style={styles.statChipLabel}>Duration: </Text>
                      <Text style={styles.statChipVal}>
                        {item.workoutStats.durationMinutes} mins
                      </Text>
                    </View>
                    {item.workoutStats.totalWeightKg && (
                      <View style={styles.statChip}>
                        <Ionicons name="barbell-outline" size={12} color="#64748b" style={{ marginRight: 4 }} />
                        <Text style={styles.statChipLabel}>Vol: </Text>
                        <Text style={styles.statChipVal}>
                          {item.workoutStats.totalWeightKg} kg
                        </Text>
                      </View>
                    )}
                    {item.workoutStats.distanceKm && (
                      <View style={styles.statChip}>
                        <Ionicons name="walk-outline" size={12} color="#64748b" style={{ marginRight: 4 }} />
                        <Text style={styles.statChipLabel}>Dist: </Text>
                        <Text style={styles.statChipVal}>
                          {item.workoutStats.distanceKm} km
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {item.recipe && (
                <View style={styles.recipeCardBadge}>
                  <Text style={styles.recipeCardTitle}>{item.recipe.title}</Text>
                  <Text style={styles.recipeCardGoal}>{item.recipe.goal} fuel</Text>
                  <Text style={styles.recipeSubHead}>Ingredients</Text>
                  {item.recipe.ingredients.map((line) => (
                    <Text key={line} style={styles.recipeLine}>• {line}</Text>
                  ))}
                  <Text style={styles.recipeSubHead}>How to cook</Text>
                  {item.recipe.steps.map((step, index) => (
                    <Text key={`${index}-${step}`} style={styles.recipeLine}>
                      {index + 1}. {step}
                    </Text>
                  ))}
                  {item.recipe.youtubeId ? (
                    <CookVideo
                      video={{
                        youtubeId: item.recipe.youtubeId,
                        title: item.recipe.youtubeTitle || item.recipe.title,
                        channel: 'Campus cook-along',
                        query: `${item.recipe.title} ${item.recipe.goal} gym meal`,
                      }}
                      mealTitle={item.recipe.title}
                    />
                  ) : null}
                </View>
              )}
              {item.workoutClip?.videoUri ? <WorkoutClipCard clip={item.workoutClip} /> : null}
              {item.imageUri && (
                <SafeImage
                  uri={typeof item.imageUri === 'string' ? item.imageUri : item.imageUri?.uri}
                  style={styles.postImage}
                />
              )}
              {!!item.text && <Text style={styles.postText}>{item.text}</Text>}

              <View style={styles.postFooterRow}>
                <TouchableOpacity onPress={() => handleLike(item.id)} style={styles.footerActionRow}>
                  <Ionicons name="thumbs-up-outline" size={16} color="#C85A17" style={{ marginRight: 4 }} />
                  <Text style={styles.likeText}>{item.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.footerActionRow}
                  onPress={() =>
                    setActiveCommentPostId(isCommenting ? null : item.id)
                  }
                >
                  <Ionicons name="chatbox-outline" size={16} color="#4b5563" style={{ marginRight: 4 }} />
                  <Text style={styles.commentBtnText}>
                    Comments ({item.comments.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Comments List & Input */}
              {isCommenting && (
                <View style={styles.commentsContainer}>
                  {item.comments.map((cm) => (
                    <View key={cm.id} style={styles.commentBubble}>
                      <Text style={styles.commentAuthor}>{cm.author}</Text>
                      <Text style={styles.commentText}>{cm.text}</Text>
                    </View>
                  ))}

                  <View style={styles.commentInputRow}>
                    <TextInput
                      style={[styles.input, { marginRight: 8 }]}
                      placeholder="Write a comment..."
                      value={commentText}
                      onChangeText={setCommentText}
                    />
                    <TouchableOpacity
                      style={styles.postButton}
                      onPress={() => handleAddComment(item.id)}
                    >
                      <Text style={styles.postButtonText}>Reply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* Workout Log Modal */}
      <Modal
        visible={isWorkoutModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsWorkoutModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={{ flex: 1, minHeight: 0 }} contentContainerStyle={styles.modalContent}>
            <Text style={styles.heading}>Share Workout Log</Text>
            <Text style={styles.subHeading}>Broadcast stats and a post-workout selfie</Text>

            <Text style={styles.fieldLabel}>Post-Workout Selfie / Photo</Text>
            {workoutSelfieUri ? (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: workoutSelfieUri }} style={styles.modalImagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setWorkoutSelfieUri(null)}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.photoUploadButton} onPress={handlePickWorkoutSelfie}>
                <Ionicons name="camera-outline" size={20} color="#C85A17" style={{ marginRight: 6 }} />
                <Text style={styles.photoUploadText}>Add Gym Selfie or Photo</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.fieldLabel}>Workout Type / Name</Text>
            <TextInput
              style={[styles.input, { marginRight: 0, marginBottom: 12 }]}
              placeholder="e.g. Leg Day, Push Workout, 5K Run"
              value={workoutTitle}
              onChangeText={setWorkoutTitle}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Duration (mins)</Text>
                <TextInput
                  style={[styles.input, { marginRight: 0 }]}
                  placeholder="e.g. 45"
                  keyboardType="numeric"
                  value={workoutDuration}
                  onChangeText={setWorkoutDuration}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Vol. Lifted (kg)</Text>
                <TextInput
                  style={[styles.input, { marginRight: 0 }]}
                  placeholder="e.g. 2400 (opt)"
                  keyboardType="numeric"
                  value={workoutWeight}
                  onChangeText={setWorkoutWeight}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Distance Covered (km, optional)</Text>
            <TextInput
              style={[styles.input, { marginRight: 0, marginBottom: 12 }]}
              placeholder="e.g. 5.2"
              keyboardType="numeric"
              value={workoutDistance}
              onChangeText={setWorkoutDistance}
            />

            <Text style={styles.fieldLabel}>Workout Reflection / Caption</Text>
            <TextInput
              style={[styles.input, styles.captionInput, { marginRight: 0, marginBottom: 16 }]}
              placeholder="How did it feel? (Optional)"
              value={workoutNote}
              onChangeText={setWorkoutNote}
              multiline
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsWorkoutModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mainButton}
                onPress={handleShareWorkoutLog}
              >
                <Text style={styles.mainButtonText}>Post Workout</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={isRecipeModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsRecipeModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={{ flex: 1, minHeight: 0 }} contentContainerStyle={styles.modalContent}>
            <Text style={styles.heading}>Share a gym recipe</Text>
            <Text style={styles.subHeading}>
              Pre-workout fuel, post-gym recovery, or high-protein student plates only.
            </Text>

            <Text style={styles.fieldLabel}>Or pick a planner gym meal</Text>
            <View style={styles.chipRow}>
              {GYM_PLANNER_MEALS.map((item) => {
                const meal = SA_MEALS.find((row: { id: string }) => row.id === item.id);
                if (!meal) return null;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.chip}
                    onPress={() => fillFromPlannerMeal(item.id, item.goal)}
                  >
                    <Text style={styles.chipText}>{meal.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Meal name</Text>
            <TextInput
              style={[styles.input, { marginRight: 0, marginBottom: 12 }]}
              placeholder="e.g. Pap & eggs after gym"
              value={recipeTitle}
              onChangeText={setRecipeTitle}
            />

            <Text style={styles.fieldLabel}>Gym goal (required)</Text>
            <View style={styles.chipRow}>
              {GYM_GOALS.map((goal) => {
                const selected = recipeGoal === goal;
                return (
                  <TouchableOpacity
                    key={goal}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setRecipeGoal(goal)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{goal}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Ingredients (one per line)</Text>
            <TextInput
              style={[styles.input, styles.captionInput, { marginRight: 0, marginBottom: 12, minHeight: 80 }]}
              placeholder={'2 eggs\nbrown bread'}
              value={recipeIngredients}
              onChangeText={setRecipeIngredients}
              multiline
            />

            <Text style={styles.fieldLabel}>Cook steps (one per line)</Text>
            <TextInput
              style={[styles.input, styles.captionInput, { marginRight: 0, marginBottom: 12, minHeight: 90 }]}
              placeholder={'Toast the bread\nFry the eggs'}
              value={recipeSteps}
              onChangeText={setRecipeSteps}
              multiline
            />

            <Text style={styles.fieldLabel}>YouTube cook-along (optional)</Text>
            <TextInput
              style={[styles.input, { marginRight: 0, marginBottom: 12 }]}
              placeholder="https://youtube.com/watch?v=..."
              value={recipeVideoUrl}
              onChangeText={setRecipeVideoUrl}
              autoCapitalize="none"
            />

            <Text style={styles.fieldLabel}>Caption</Text>
            <TextInput
              style={[styles.input, styles.captionInput, { marginRight: 0, marginBottom: 16 }]}
              placeholder="Why this meal works around gym..."
              value={recipeCaption}
              onChangeText={setRecipeCaption}
              multiline
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setIsRecipeModalOpen(false);
                  resetRecipeForm();
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mainButton} onPress={handleShareRecipe}>
                <Text style={styles.mainButtonText}>Post recipe</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={isClipModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsClipModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={{ flex: 1, minHeight: 0 }} contentContainerStyle={styles.modalContent}>
            <Text style={styles.heading}>Share a workout clip</Text>
            <Text style={styles.subHeading}>
              Like Instagram: your video plays, and the song sticker sits on the clip.
            </Text>

            <Text style={styles.fieldLabel}>Your clip</Text>
            {clipVideoUri ? (
              <WorkoutClipCard
                compact
                clip={{
                  videoUri: clipVideoUri,
                  musicTitle: clipMusicTitle || 'Add the song below',
                  musicArtist: clipMusicArtist,
                }}
              />
            ) : (
              <View style={styles.postActionsRow}>
                <TouchableOpacity style={styles.photoButton} onPress={() => handlePickWorkoutClip(true)}>
                  <Ionicons name="videocam-outline" size={16} color="#C85A17" style={{ marginRight: 4 }} />
                  <Text style={styles.photoButtonText}>Record</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={() => handlePickWorkoutClip(false)}>
                  <Ionicons name="images-outline" size={16} color="#C85A17" style={{ marginRight: 4 }} />
                  <Text style={styles.photoButtonText}>Pick from library</Text>
                </TouchableOpacity>
              </View>
            )}
            {clipVideoUri ? (
              <TouchableOpacity style={[styles.photoButton, { marginBottom: 12 }]} onPress={() => setClipVideoUri(null)}>
                <Text style={styles.photoButtonText}>Replace clip</Text>
              </TouchableOpacity>
            ) : null}

            <Text style={styles.fieldLabel}>Clip title</Text>
            <TextInput
              style={[styles.input, { marginRight: 0, marginBottom: 12 }]}
              placeholder="e.g. APK bench PR"
              value={clipTitle}
              onChangeText={setClipTitle}
            />

            <Text style={styles.fieldLabel}>Song on the clip</Text>
            <TextInput
              style={[styles.input, { marginRight: 0, marginBottom: 12 }]}
              placeholder="e.g. Power"
              value={clipMusicTitle}
              onChangeText={setClipMusicTitle}
            />

            <Text style={styles.fieldLabel}>Artist (optional)</Text>
            <TextInput
              style={[styles.input, { marginRight: 0, marginBottom: 12 }]}
              placeholder="e.g. Kanye West"
              value={clipMusicArtist}
              onChangeText={setClipMusicArtist}
            />

            <Text style={styles.fieldLabel}>Caption</Text>
            <TextInput
              style={[styles.input, styles.captionInput, { marginRight: 0, marginBottom: 16 }]}
              placeholder="What this set felt like..."
              value={clipCaption}
              onChangeText={setClipCaption}
              multiline
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setIsClipModalOpen(false);
                  resetClipForm();
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mainButton} onPress={handleShareWorkoutClip}>
                <Text style={styles.mainButtonText}>Post clip</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

function GroupsScreen({
  groups,
  setGroups,
  onBack,
  onOpenGroup,
  onJoinGroup,
}: {
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  onBack: () => void;
  onOpenGroup: (id: string) => void;
  onJoinGroup: (id: string) => void;
}) {
  const { styles, colors } = useCommunityStyles();
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedCampus, setSelectedCampus] = useState(UJ_CAMPUSES[0]);
  const [newGroupImage, setNewGroupImage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCampus, setFilterCampus] = useState<string>('All');

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('We need photo library access to upload a group photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled) {
      setNewGroupImage(result.assets[0].uri);
    }
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    const id = 'g' + Date.now().toString();
    const newGroup: Group = {
      id,
      name: newGroupName,
      campus: selectedCampus,
      link: `myapp://group/${id}`,
      imageUri: newGroupImage 
        ? { uri: newGroupImage } 
        : { uri: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80' },
      status: 'none',
    };
    setGroups((current) => [{ ...newGroup, status: 'joined' as const }, ...current]);
    setNewGroupName('');
    setNewGroupImage(null);
    onOpenGroup(id);
  };

  const filteredGroups = groups.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCampus =
      filterCampus === 'All' || (g.campus && g.campus.startsWith(filterCampus));
    return matchesSearch && matchesCampus;
  });

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <>
          <TouchableOpacity onPress={onBack} style={styles.backRow}>
            <Ionicons name="arrow-back" size={20} color="#C85A17" />
            <Text style={styles.backText}>Back to Feed</Text>
          </TouchableOpacity>

          <Text style={styles.heading}>Workout Groups</Text>

          <View style={styles.createBox}>
            <Text style={styles.fieldLabel}>Create a New Group</Text>
            <TextInput
              style={[styles.input, { marginRight: 0, marginBottom: 8 }]}
              placeholder="Group name..."
              value={newGroupName}
              onChangeText={setNewGroupName}
            />

            <Text style={styles.fieldLabel}>Campus Location</Text>
            <View style={styles.chipRow}>
              {UJ_CAMPUSES.map((c) => {
                const code = c.split(' ')[0];
                const selected = selectedCampus === c;
                return (
                  <TouchableOpacity
                    key={`c-${code}`}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setSelectedCampus(c)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {newGroupImage && (
              <Image source={{ uri: newGroupImage }} style={styles.smallPreviewImage} />
            )}
            <View style={styles.postActionsRow}>
              <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
                <Ionicons name="image-outline" size={16} color="#C85A17" style={{ marginRight: 4 }} />
                <Text style={styles.photoButtonText}>Cover Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.postButton} onPress={handleCreateGroup}>
                <Text style={styles.postButtonText}>Create Group</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Find Groups</Text>
          <TextInput
            style={[styles.input, { marginRight: 0, marginBottom: 12 }]}
            placeholder="Search groups by name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <View style={styles.chipRow}>
            {['All', 'APK', 'APB', 'DFC', 'SWC'].map((code) => {
              const isSelected = filterCampus === code;
              return (
                <TouchableOpacity
                  key={`filter-${code}`}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setFilterCampus(code)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {code}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      }
      data={filteredGroups}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.mediaCard}>
          {item.imageUri && <Image source={typeof item.imageUri === 'string' ? { uri: item.imageUri } : item.imageUri} style={styles.cardImage} />}
          <View style={styles.cardBody}>
            <View style={styles.rowCard}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => onOpenGroup(item.id)}>
                <Text style={[styles.rowTextBold, styles.linkText]}>{item.name}</Text>
                {item.campus && (
                  <View style={styles.tagRow}>
                    <Ionicons name="location-outline" size={12} color="#4b5563" style={{ marginRight: 2 }} />
                    <Text style={styles.campusBadge}>{item.campus.split(' ')[0]}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallButton, item.status === 'joined' && styles.joinedButton]}
                onPress={() => (item.status === 'joined' ? onOpenGroup(item.id) : onJoinGroup(item.id))}
              >
                <Text style={styles.smallButtonText}>
                  {item.status === 'joined' ? 'Open' : 'Join Group'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.linkSubtext}>
              {item.nextSession || `Invite link: ${item.link}`}
            </Text>
          </View>
        </View>
      )}
    />
  );
}

function GroupDetailScreen({
  group,
  onBack,
  onJoin,
  onLeave,
}: {
  group: Group;
  onBack: () => void;
  onJoin: () => void;
  onLeave: () => void;
}) {
  const { styles } = useCommunityStyles();
  const page = getGroupPage(group);
  const joined = group?.status === 'joined';
  const members = joined
    ? [{ name: 'You', role: 'Member' }, ...page.members.filter((member) => member.name !== 'You')]
    : page.members;

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <>
          <TouchableOpacity onPress={onBack} style={styles.backRow}>
            <Ionicons name="arrow-back" size={20} color="#C85A17" />
            <Text style={styles.backText}>Back to Groups</Text>
          </TouchableOpacity>
          {group?.imageUri ? (
            <Image
              source={typeof group.imageUri === 'string' ? { uri: group.imageUri } : group.imageUri}
              style={styles.cardImage}
            />
          ) : null}
          <Text style={styles.heading}>{group?.name || 'Group'}</Text>
          <Text style={styles.subHeading}>{page.about}</Text>
          {group?.campus ? (
            <View style={[styles.tagRow, { marginBottom: 8 }]}>
              <Ionicons name="location-outline" size={14} color="#4b5563" style={{ marginRight: 4 }} />
              <Text style={styles.campusBadge}>{group.campus.split(' ')[0]}</Text>
            </View>
          ) : null}

          <View style={styles.createBox}>
            <Text style={styles.fieldLabel}>Next session</Text>
            <Text style={styles.challengeDesc}>{page.nextSession}</Text>
            <Text style={styles.linkSubtext}>
              {joined
                ? 'You are in. When live groups land, this is where members see the same board.'
                : 'Join when you are ready. The board stays mock until more people show up.'}
            </Text>
          </View>

          <View style={styles.rowCard}>
            {joined ? (
              <TouchableOpacity style={[styles.smallButton, styles.joinedButton]} onPress={onLeave}>
                <Text style={styles.smallButtonText}>Leave</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.smallButton} onPress={onJoin}>
                <Text style={styles.smallButtonText}>Join Group</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.sectionTitle}>Members · {members.length}</Text>
          {members.map((member) => (
            <View key={`${member.name}-${member.role}`} style={styles.commentBubble}>
              <Text style={styles.commentAuthor}>{member.name}</Text>
              <Text style={styles.commentText}>{member.role}</Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Group board</Text>
          {!joined ? (
            <Text style={styles.subHeading}>Join to read the board and post when this group goes live.</Text>
          ) : null}
        </>
      }
      data={joined ? page.posts : []}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        joined ? <Text style={styles.subHeading}>No posts yet. This board is ready when people join.</Text> : null
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.author}>{item.author}</Text>
          <Text style={styles.linkSubtext}>{item.time}</Text>
          <Text style={styles.postText}>{item.text}</Text>
        </View>
      )}
    />
  );
}

function ChallengesScreen({
  challenges,
  setChallenges,
  onBack,
  onOpenChallengeDetail,
}: {
  challenges: Challenge[];
  setChallenges: React.Dispatch<React.SetStateAction<Challenge[]>>;
  onBack: () => void;
  onOpenChallengeDetail: (id: string) => void;
}) {
  const { styles } = useCommunityStyles();
  const toggleChallenge = (id: string) => {
    setChallenges(
      challenges.map((c) => (c.id === id ? { ...c, joined: !c.joined } : c))
    );
  };

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <>
          <TouchableOpacity onPress={onBack} style={styles.backRow}>
            <Ionicons name="arrow-back" size={20} color="#C85A17" />
            <Text style={styles.backText}>Back to Feed</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>Fitness Challenges</Text>
          <Text style={styles.subHeading}>
            Compete for your campus and log daily progress
          </Text>
        </>
      }
      data={challenges}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const topCampus = [...item.campusScores].sort(
          (a, b) => b.completedCount - a.completedCount
        )[0];

        return (
          <View style={styles.mediaCard}>
            {item.imageUri && (
              <Image source={typeof item.imageUri === 'string' ? { uri: item.imageUri } : item.imageUri} style={styles.cardImage} />
            )}
            <View style={styles.cardBody}>
              <TouchableOpacity onPress={() => onOpenChallengeDetail(item.id)}>
                <Text style={[styles.rowTextBold, styles.linkText]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
              <Text style={styles.challengeDesc}>{item.description}</Text>

              {/* Campus Performance Preview */}
              <View style={styles.leaderboardBadge}>
                <Ionicons name="trophy-outline" size={14} color="#92400e" style={{ marginRight: 4 }} />
                <Text style={styles.leaderboardBadgeText}>
                  Leading Campus: <Text style={{ fontWeight: 'bold' }}>{topCampus.campusCode}</Text> ({topCampus.completedCount} finished)
                </Text>
              </View>

              <View style={styles.rowCard}>
                <TouchableOpacity
                  style={styles.viewPlanBtn}
                  onPress={() => onOpenChallengeDetail(item.id)}
                >
                  <Ionicons name="stats-chart-outline" size={14} color="#C85A17" style={{ marginRight: 4 }} />
                  <Text style={styles.viewPlanBtnText}>Campus Leaderboard & Plan</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.smallButton,
                    item.joined && styles.joinedButton,
                  ]}
                  onPress={() => toggleChallenge(item.id)}
                >
                  <Text style={styles.smallButtonText}>
                    {item.joined ? 'Joined' : 'Join'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      }}
    />
  );
}

function ChallengeDetailScreen({
  challenge,
  onBack,
}: {
  challenge: Challenge;
  onBack: () => void;
}) {
  const { styles } = useCommunityStyles();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'tracker'>('tracker');
  const [completedDays, setCompletedDays] = useState<number[]>([]);

  const toggleDay = (day: number) => {
    setCompletedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const workoutDaysTotal = PUSHUP_PLAN.filter((d) => !d.isRest).length;
  const workoutDaysDone = PUSHUP_PLAN.filter(
    (d) => !d.isRest && completedDays.includes(d.day)
  ).length;

  const maxScore = Math.max(...challenge.campusScores.map((c) => c.completedCount));

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={true}
      ListHeaderComponent={
        <>
          <TouchableOpacity onPress={onBack} style={styles.backRow}>
            <Ionicons name="arrow-back" size={20} color="#C85A17" />
            <Text style={styles.backText}>Back to Challenges</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>{challenge.name}</Text>
          <Text style={styles.subHeading}>{challenge.description}</Text>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'tracker' && styles.tabActive]}
              onPress={() => setActiveTab('tracker')}
            >
              <Ionicons name="clipboard-outline" size={16} color={activeTab === 'tracker' ? '#fff' : '#4b5563'} style={{ marginRight: 6 }} />
              <Text style={[styles.tabText, activeTab === 'tracker' && styles.tabTextActive]}>
                My Workout Plan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'leaderboard' && styles.tabActive]}
              onPress={() => setActiveTab('leaderboard')}
            >
              <Ionicons name="podium-outline" size={16} color={activeTab === 'leaderboard' ? '#fff' : '#4b5563'} style={{ marginRight: 6 }} />
              <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>
                Campus Leaderboard
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'tracker' ? (
            <Text style={styles.progressText}>
              {workoutDaysDone} / {workoutDaysTotal} workout days completed
            </Text>
          ) : (
            <View style={styles.leaderboardBox}>
              <Text style={styles.sectionTitle}>Campus Performance Standings</Text>
              {challenge.campusScores
                .sort((a, b) => b.completedCount - a.completedCount)
                .map((item, idx) => {
                  const percentage = Math.round((item.completedCount / maxScore) * 100);
                  return (
                    <View key={item.campusCode} style={styles.leaderboardRow}>
                      <View style={styles.leaderboardHeader}>
                        <Text style={styles.campusRankText}>
                          #{idx + 1} Campus {item.campusCode}
                        </Text>
                        <Text style={styles.campusScoreText}>
                          {item.completedCount} Members Finished
                        </Text>
                      </View>
                      <View style={styles.barBackground}>
                        <View style={[styles.barFill, { width: `${percentage}%` }]} />
                      </View>
                    </View>
                  );
                })}
            </View>
          )}
        </>
      }
      data={activeTab === 'tracker' ? PUSHUP_PLAN : []}
      keyExtractor={(item) => item.day.toString()}
      renderItem={({ item }) => {
        const done = completedDays.includes(item.day);
        return (
          <TouchableOpacity
            style={[styles.dayRow, item.isRest && styles.dayRowRest, done && styles.dayRowDone]}
            onPress={() => !item.isRest && toggleDay(item.day)}
            disabled={item.isRest}
          >
            <Text style={styles.dayNumber}>Day {item.day}</Text>
            <Text style={[styles.dayLabel, item.isRest && styles.dayLabelRest]}>
              {item.label}
            </Text>
            {!item.isRest && (
              <Ionicons
                name={done ? "checkbox" : "square-outline"}
                size={20}
                color={done ? "#16a34a" : "#9ca3af"}
              />
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}

function createStyles(colors: { background: string; card: string; text: string; muted: string; overlay: string; input: string; border: string }, isDark: boolean) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20 },
  list: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: 16, flexGrow: 1 },
  homeContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 4, color: colors.text },
  subHeading: { fontSize: 14, color: colors.muted, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 12, marginBottom: 10, color: colors.text },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backText: { color: '#C85A17', fontSize: 15, fontWeight: '600', marginLeft: 4 },
  tagRow: { flexDirection: 'row', alignItems: 'center' },
  footerActionRow: { flexDirection: 'row', alignItems: 'center' },
  navButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  navButton: {
    flexGrow: 1,
    flexBasis: '46%',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: isDark ? colors.overlay : '#FFF7ED',
    borderColor: '#FED7AA',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  navButtonText: { color: '#9A3412', fontWeight: '600', fontSize: 15 },
  mainButton: {
    backgroundColor: '#C85A17',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  submitButton: { marginTop: 24, marginBottom: 40 },
  mainButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: colors.input,
    color: colors.text,
  },
  profileInput: {
    fontSize: 16,
    paddingVertical: 12,
    marginBottom: 20,
    marginRight: 0,
  },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    overflow: 'hidden',
  },
  iconPlaceholderWrap: { alignItems: 'center', justifyContent: 'center' },
  avatarPlaceholderText: { color: '#4b5563', fontWeight: '500', fontSize: 12, marginTop: 4 },
  avatarImage: { width: '100%', height: '100%' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: colors.overlay,
  },
  chipSelected: {
    borderColor: '#C85A17',
    backgroundColor: isDark ? colors.overlay : '#FFF7ED',
  },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '500' },
  chipTextSelected: { color: '#C85A17', fontWeight: '600' },
  profileBadgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.overlay,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bannerAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  bannerWelcome: { fontSize: 14, fontWeight: '600', color: colors.text },
  bannerCampusSub: { fontSize: 12, color: colors.muted, marginTop: 2 },

  // Gym Busyness Styles
  meterContainer: {
    backgroundColor: colors.overlay,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  meterTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  meterTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  meterCampusRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  meterCard: {
    flex: 1,
    backgroundColor: colors.input,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  meterCardSelected: { borderColor: '#C85A17', backgroundColor: isDark ? colors.overlay : '#FFF7ED', borderWidth: 2 },
  meterCampusText: { fontSize: 13, fontWeight: '700', color: colors.text },
  meterBadgeText: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  meterTimeText: { fontSize: 10, color: colors.muted, marginTop: 2 },
  toggleCampusesBtn: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  toggleCampusesText: { color: '#C85A17', fontWeight: '600', fontSize: 13 },
  noteRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  meterNote: { fontSize: 12, fontStyle: 'italic', color: '#334155' },
  checkInBox: {
    backgroundColor: colors.input,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  checkInLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 8 },
  busynessBtnRow: { flexDirection: 'row', gap: 6 },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnQuiet: { backgroundColor: '#dcfce7' },
  btnModerate: { backgroundColor: '#fef3c7' },
  btnPacked: { backgroundColor: '#fee2e2' },
  statusBtnText: { fontSize: 12, fontWeight: '700', color: '#1f2937' },

  // Shared Workout Log Styles
  workoutTriggerButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutTriggerText: { color: '#f8fafc', fontWeight: '700', fontSize: 14 },
  recipeTriggerButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: isDark ? colors.overlay : '#FFF7ED',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  recipeTriggerText: { color: '#9A3412', fontWeight: '700', fontSize: 14 },
  recipeTag: { fontSize: 11, color: '#9A3412', fontWeight: '600' },
  recipeCardBadge: {
    backgroundColor: isDark ? colors.overlay : '#FFF7ED',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  recipeCardTitle: { fontSize: 16, fontWeight: '800', color: '#9A3412' },
  recipeCardGoal: { fontSize: 12, fontWeight: '700', color: '#C85A17', marginBottom: 8 },
  recipeSubHead: { marginTop: 8, marginBottom: 4, fontSize: 12, fontWeight: '800', color: colors.text },
  recipeLine: { fontSize: 13, lineHeight: 19, color: colors.text, marginBottom: 2 },
  workoutCardBadge: {
    backgroundColor: isDark ? colors.overlay : '#FFF7ED',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  workoutCardTitle: { fontSize: 15, fontWeight: '700', color: '#9A3412' },
  workoutStatsRow: { flexDirection: 'row', gap: 8 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  statChipLabel: { fontSize: 10, color: '#64748b' },
  statChipVal: { fontSize: 12, fontWeight: '700', color: '#1e293b' },

  // Challenge Styles
  challengeDesc: { fontSize: 13, color: '#4b5563', marginTop: 4, marginBottom: 8 },
  leaderboardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 10,
  },
  leaderboardBadgeText: { fontSize: 12, color: '#92400e' },
  viewPlanBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  viewPlanBtnText: { color: '#C85A17', fontWeight: '600', fontSize: 13 },
  tabContainer: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.overlay,
  },
  tabActive: { backgroundColor: '#C85A17' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#4b5563' },
  tabTextActive: { color: '#fff' },
  leaderboardBox: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, marginBottom: 12 },
  leaderboardRow: { marginBottom: 10 },
  leaderboardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  campusRankText: { fontWeight: '700', fontSize: 13, color: '#111827' },
  campusScoreText: { fontSize: 12, color: '#6b7280' },
  barBackground: { height: 10, backgroundColor: '#e5e7eb', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#C85A17' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    minHeight: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.input,
    borderRadius: 12,
    padding: 20,
    flexGrow: 1,
  },
  photoUploadButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: colors.overlay,
  },
  photoUploadText: { color: '#C85A17', fontWeight: '600', fontSize: 14 },
  modalImagePreview: { width: '100%', height: 160, borderRadius: 8 },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  modalCancelBtn: { paddingVertical: 12, paddingHorizontal: 16, justifyContent: 'center' },
  modalCancelText: { color: '#6b7280', fontWeight: '600' },

  postButton: {
    backgroundColor: '#C85A17',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  postButtonText: { color: '#fff', fontWeight: '600' },
  captionInput: { marginBottom: 8, minHeight: 44, textAlignVertical: 'top' },
  postActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C85A17',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  photoButtonText: { color: '#C85A17', fontWeight: '600', fontSize: 13 },
  imagePreviewWrap: { marginBottom: 8, position: 'relative', alignSelf: 'flex-start' },
  imagePreview: { width: 120, height: 120, borderRadius: 8 },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#111827',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, marginBottom: 12 },
  checkInPostCard: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  checkInTag: { fontSize: 11, color: '#166534', fontWeight: '600' },
  mediaCard: {
    backgroundColor: colors.overlay,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  cardImage: { width: '100%', height: 140 },
  cardBody: { padding: 12 },
  postHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  postAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  postAvatarFallback: { backgroundColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  fallbackAvatarText: { fontWeight: 'bold', color: '#4b5563', fontSize: 14 },
  author: { fontWeight: '600', color: colors.text },
  postImage: { width: '100%', height: 220, borderRadius: 8, marginBottom: 8 },
  postText: { marginBottom: 8, color: colors.text },
  postFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  likeText: { color: '#C85A17', fontWeight: '500' },
  commentBtnText: { color: colors.muted, fontWeight: '500' },
  commentsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  commentBubble: {
    backgroundColor: colors.input,
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  commentAuthor: { fontWeight: '600', fontSize: 12, color: colors.muted },
  commentText: { fontSize: 13, color: colors.text, marginTop: 2 },
  commentInputRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  rowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTextBold: { fontSize: 16, fontWeight: '600', flexShrink: 1, marginRight: 8, color: colors.text },
  campusBadge: { fontSize: 12, color: '#4b5563' },
  linkSubtext: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  linkText: { color: '#C85A17' },
  smallButton: {
    backgroundColor: '#C85A17',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  joinedButton: { backgroundColor: '#9ca3af' },
  smallButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  createBox: {
    backgroundColor: colors.overlay,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  smallPreviewImage: { width: 80, height: 80, borderRadius: 6, marginBottom: 8 },
  progressText: { color: '#6b7280', marginBottom: 12, fontSize: 14 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.overlay,
    borderRadius: 8,
    marginBottom: 6,
  },
  dayRowRest: { backgroundColor: '#e5e7eb', opacity: 0.7 },
  dayRowDone: { backgroundColor: '#dcfce7' },
  dayNumber: { fontWeight: '600', width: 60 },
  dayLabel: { flex: 1, color: colors.text },
  dayLabelRest: { fontStyle: 'italic', color: colors.muted },
});
}