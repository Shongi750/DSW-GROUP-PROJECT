import React, { useState } from 'react';
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
};

type Group = {
  id: string;
  name: string;
  link: string;
  campus?: string;
  imageUri?: any;
  status: 'none' | 'requested';
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
  },
  {
    id: 'g2',
    name: 'APB Weightlifting Crew',
    campus: 'APB (Auckland Park Bunting Road)',
    link: 'myapp://group/g2',
    imageUri: { uri: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80' },
    status: 'none',
  },
  {
    id: 'g3',
    name: 'DFC Yoga & Stretch',
    campus: 'DFC (Doornfontein)',
    link: 'myapp://group/g3',
    imageUri: { uri: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80' },
    status: 'none',
  },
  {
    id: 'g4',
    name: 'SWC Soccer Club',
    campus: 'SWC (Soweto)',
    link: 'myapp://group/g4',
    imageUri: { uri: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80' },
    status: 'none',
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

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [screen, setScreen] = useState<
    'home' | 'profileCreation' | 'community' | 'groups' | 'challenges' | 'challengeDetail'
  >('home');
  const [profile, setProfile] = useState<Profile | null>(null);

  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('c1');

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {screen === 'home' ? (
        <HomeScreen onOpenCommunity={handleStartCommunity} />
      ) : screen === 'profileCreation' ? (
        <ProfileCreationScreen
          onSubmit={handleProfileSubmit}
          onBack={() => setScreen('home')}
        />
      ) : screen === 'community' ? (
        <CampusCommunityScreen
          profile={profile}
          onBack={() => setScreen('home')}
          onOpenGroups={() => setScreen('groups')}
          onOpenChallenges={() => setScreen('challenges')}
        />
      ) : screen === 'groups' ? (
        <GroupsScreen
          groups={groups}
          setGroups={setGroups}
          onBack={() => setScreen('community')}
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.heading}>Create Your Profile</Text>
      <Text style={styles.subHeading}>Set up your University of Johannesburg details</Text>

      <View style={styles.avatarSection}>
        <TouchableOpacity style={styles.avatarPlaceholder} onPress={handlePickAvatar}>
          {avatarUri ? (
            <Image source={typeof avatarUri === 'string' ? { uri: avatarUri } : avatarUri} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarPlaceholderText}>📷 Add Photo</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.fieldLabel}>Full Name</Text>
      <TextInput
        style={[styles.input, styles.profileInput]}
        placeholder="Enter your name..."
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
}: {
  profile: Profile | null;
  onBack: () => void;
  onOpenGroups: () => void;
  onOpenChallenges: () => void;
}) {
  const [gymStatuses, setGymStatuses] = useState<Record<string, GymBusyness>>(INITIAL_GYM_STATUSES);
  
  // Extract user campus codes (e.g. 'APK', 'APB')
  const resCode = profile?.residenceCampus ? profile.residenceCampus.split(' ')[0] : 'APK';
  const studyCode = profile?.studyCampus ? profile.studyCampus.split(' ')[0] : 'APB';
  
  // Primary campuses to show by default
  const myCampuses = Array.from(new Set([resCode, studyCode]));
  
  const [showOtherCampuses, setShowOtherCampuses] = useState(false);
  const [selectedCampusForMeter, setSelectedCampusForMeter] = useState(myCampuses[0] || 'APK');
  const [busynessNote, setBusynessNote] = useState('');

  // Workout Log Modal State
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutWeight, setWorkoutWeight] = useState('');
  const [workoutDistance, setWorkoutDistance] = useState('');
  const [workoutNote, setWorkoutNote] = useState('');
  const [workoutSelfieUri, setWorkoutSelfieUri] = useState<string | null>(null);

  const [posts, setPosts] = useState<Post[]>([
    {
      id: 'w1',
      author: 'Kagiso M.',
      text: 'Smashed a new PR on bench press today at APK Gym!',
      imageUri: { uri: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80' },
      likes: 8,
      comments: [{ id: 'c1', author: 'Sipho N.', text: 'Light weight baby! 🔥' }],
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
  ]);
  const [newPost, setNewPost] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);

  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const displayedCampuses = showOtherCampuses
    ? ['APK', 'APB', 'DFC', 'SWC']
    : myCampuses;

  const handlePickWorkoutSelfie = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('We need camera library access to attach a gym selfie.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      text: `📍 Checked in at ${selectedCampusForMeter} Gym: Reported as ${status.toUpperCase()}.${
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

    // Reset Modal Form
    setWorkoutTitle('');
    setWorkoutDuration('');
    setWorkoutWeight('');
    setWorkoutDistance('');
    setWorkoutNote('');
    setWorkoutSelfieUri(null);
    setIsWorkoutModalOpen(false);
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        ListHeaderComponent={
          <>
            <TouchableOpacity onPress={onBack}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.heading}>UJ Community Board</Text>

            {profile && (
              <View style={styles.profileBadgeBanner}>
                {profile.avatarUri && (
                  <Image source={typeof profile.avatarUri === 'string' ? { uri: profile.avatarUri } : profile.avatarUri} style={styles.bannerAvatar} />
                )}
                <View>
                  <Text style={styles.bannerWelcome}>Logged in as: {profile.name}</Text>
                  <Text style={styles.bannerCampusSub}>
                    🏠 Residence: {resCode} | 📚 Study: {studyCode}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.navButtonsRow}>
              <TouchableOpacity style={styles.navButton} onPress={onOpenGroups}>
                <Text style={styles.navButtonText}>👥 Groups</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButton} onPress={onOpenChallenges}>
                <Text style={styles.navButtonText}>🏆 Challenges</Text>
              </TouchableOpacity>
            </View>

            {/* Personalized Gym Busyness Section */}
            <View style={styles.meterContainer}>
              <Text style={styles.meterTitle}>🔥 Your Campus Gym Busyness</Text>

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
                  {showOtherCampuses ? '▲ Hide other campuses' : ' See other campuses'}
                </Text>
              </TouchableOpacity>

              {gymStatuses[selectedCampusForMeter]?.note && (
                <Text style={styles.meterNote}>
                  💬 "{gymStatuses[selectedCampusForMeter].note}" —{' '}
                  <Text style={{ fontWeight: 'bold' }}>
                    {gymStatuses[selectedCampusForMeter].reportedBy}
                  </Text>
                </Text>
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
                    <Text style={styles.statusBtnText}>🟢 Quiet</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statusBtn, styles.btnModerate]}
                    onPress={() => handleUpdateBusyness('Moderate')}
                  >
                    <Text style={styles.statusBtnText}>🟡 Moderate</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statusBtn, styles.btnPacked]}
                    onPress={() => handleUpdateBusyness('Packed')}
                  >
                    <Text style={styles.statusBtnText}>🔴 Packed</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Share Workout Log Action Trigger */}
            <TouchableOpacity
              style={styles.workoutTriggerButton}
              onPress={() => setIsWorkoutModalOpen(true)}
            >
              <Text style={styles.workoutTriggerText}>🏋️ Log Workout with Stats & Selfie</Text>
            </TouchableOpacity>

            {/* Post Creation Box */}
            {newPostImage && (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: newPostImage }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveImage}>
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            <TextInput
              style={[styles.input, styles.captionInput]}
              placeholder={newPostImage ? 'Write a caption...' : "What's on your mind?"}
              value={newPost}
              onChangeText={setNewPost}
              multiline
            />

            <View style={styles.postActionsRow}>
              <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
                <Text style={styles.photoButtonText}>
                  📷 {newPostImage ? 'Change Photo' : 'Add Photo'}
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
                    <Text style={styles.checkInTag}>📍 Gym Check-In • {item.campus}</Text>
                  )}
                </View>
              </View>

              {/* Workout Log Highlight Section */}
              {item.workoutStats && (
                <View style={styles.workoutCardBadge}>
                  <Text style={styles.workoutCardTitle}>
                    ⚡ {item.workoutStats.title}
                  </Text>
                  <View style={styles.workoutStatsRow}>
                    <View style={styles.statChip}>
                      <Text style={styles.statChipLabel}>⏱️ Duration</Text>
                      <Text style={styles.statChipVal}>
                        {item.workoutStats.durationMinutes} mins
                      </Text>
                    </View>
                    {item.workoutStats.totalWeightKg && (
                      <View style={styles.statChip}>
                        <Text style={styles.statChipLabel}>🏋️ Total Vol.</Text>
                        <Text style={styles.statChipVal}>
                          {item.workoutStats.totalWeightKg} kg
                        </Text>
                      </View>
                    )}
                    {item.workoutStats.distanceKm && (
                      <View style={styles.statChip}>
                        <Text style={styles.statChipLabel}>🏃 Distance</Text>
                        <Text style={styles.statChipVal}>
                          {item.workoutStats.distanceKm} km
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {item.imageUri && <Image source={typeof item.imageUri === 'string' ? { uri: item.imageUri } : item.imageUri} style={styles.postImage} />}
              {!!item.text && <Text style={styles.postText}>{item.text}</Text>}

              <View style={styles.postFooterRow}>
                <TouchableOpacity onPress={() => handleLike(item.id)}>
                  <Text style={styles.likeText}>👍 {item.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    setActiveCommentPostId(isCommenting ? null : item.id)
                  }
                >
                  <Text style={styles.commentBtnText}>
                    💬 Comments ({item.comments.length})
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
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.heading}>Share Workout Log</Text>
            <Text style={styles.subHeading}>Broadcast stats and a post-workout selfie</Text>

            {/* Selfie / Photo Attachment Area */}
            <Text style={styles.fieldLabel}>Post-Workout Selfie / Photo</Text>
            {workoutSelfieUri ? (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: workoutSelfieUri }} style={styles.modalImagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setWorkoutSelfieUri(null)}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.photoUploadButton} onPress={handlePickWorkoutSelfie}>
                <Text style={styles.photoUploadText}>📷 Add Gym Selfie or Photo</Text>
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
    </>
  );
}

function GroupsScreen({
  groups,
  setGroups,
  onBack,
}: {
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  onBack: () => void;
}) {
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedCampus, setSelectedCampus] = useState(UJ_CAMPUSES[0]);
  const [newGroupImage, setNewGroupImage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCampus, setFilterCampus] = useState<string>('All');

  const requestJoinGroup = (id: string) => {
    setGroups(groups.map((g) => (g.id === id ? { ...g, status: 'requested' } : g)));
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('We need photo library access to upload a group photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    setGroups([newGroup, ...groups]);
    setNewGroupName('');
    setNewGroupImage(null);
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
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backText}>← Back to Feed</Text>
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
                <Text style={styles.photoButtonText}>📷 Cover Photo</Text>
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
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTextBold}>{item.name}</Text>
                {item.campus && (
                  <Text style={styles.campusBadge}>📍 {item.campus.split(' ')[0]}</Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.smallButton, item.status === 'requested' && styles.joinedButton]}
                onPress={() => requestJoinGroup(item.id)}
                disabled={item.status === 'requested'}
              >
                <Text style={styles.smallButtonText}>
                  {item.status === 'requested' ? 'Access Requested' : 'Join Group'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.linkSubtext}>Invite link: {item.link}</Text>
          </View>
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
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backText}>← Back to Feed</Text>
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
                <Text style={styles.leaderboardBadgeText}>
                  🏆 Leading Campus: <Text style={{ fontWeight: 'bold' }}>{topCampus.campusCode}</Text> ({topCampus.completedCount} finished)
                </Text>
              </View>

              <View style={styles.rowCard}>
                <TouchableOpacity
                  style={styles.viewPlanBtn}
                  onPress={() => onOpenChallengeDetail(item.id)}
                >
                  <Text style={styles.viewPlanBtnText}>📊 Campus Leaderboard & Plan</Text>
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
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backText}>← Back to Challenges</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>{challenge.name}</Text>
          <Text style={styles.subHeading}>{challenge.description}</Text>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'tracker' && styles.tabActive]}
              onPress={() => setActiveTab('tracker')}
            >
              <Text style={[styles.tabText, activeTab === 'tracker' && styles.tabTextActive]}>
                📋 My Workout Plan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'leaderboard' && styles.tabActive]}
              onPress={() => setActiveTab('leaderboard')}
            >
              <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>
                🏆 Campus Leaderboard
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
            {!item.isRest && <Text style={styles.dayCheck}>{done ? '✅' : '⬜'}</Text>}
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20 },
  list: { flex: 1, backgroundColor: '#fff' },
  listContent: { padding: 16, flexGrow: 1 },
  homeContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 4, color: '#111827' },
  subHeading: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 12, marginBottom: 10, color: '#1f2937' },
  backText: { color: '#2563eb', marginBottom: 12, fontSize: 15 },
  navButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  navButtonText: { color: '#1d4ed8', fontWeight: '600', fontSize: 15 },
  mainButton: {
    backgroundColor: '#2563eb',
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
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  profileInput: {
    fontSize: 16,
    paddingVertical: 12,
    marginBottom: 20,
    marginRight: 0,
  },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
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
  avatarPlaceholderText: { color: '#4b5563', fontWeight: '500', fontSize: 14 },
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
    backgroundColor: '#f9fafb',
  },
  chipSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  chipText: { color: '#374151', fontSize: 13, fontWeight: '500' },
  chipTextSelected: { color: '#2563eb', fontWeight: '600' },
  profileBadgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bannerAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  bannerWelcome: { fontSize: 14, fontWeight: '600', color: '#111827' },
  bannerCampusSub: { fontSize: 12, color: '#4b5563', marginTop: 2 },

  // Gym Busyness Styles
  meterContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  meterTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  meterCampusRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  meterCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  meterCardSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff', borderWidth: 2 },
  meterCampusText: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  meterBadgeText: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  meterTimeText: { fontSize: 10, color: '#64748b', marginTop: 2 },
  toggleCampusesBtn: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  toggleCampusesText: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
  meterNote: { fontSize: 12, fontStyle: 'italic', color: '#334155', marginBottom: 12 },
  checkInBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  checkInLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 8 },
  busynessBtnRow: { flexDirection: 'row', gap: 6 },
  statusBtn: {
    flex: 1,
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
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutTriggerText: { color: '#f8fafc', fontWeight: '700', fontSize: 14 },
  workoutCardBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  workoutCardTitle: { fontSize: 15, fontWeight: '700', color: '#1e40af', marginBottom: 8 },
  workoutStatsRow: { flexDirection: 'row', gap: 8 },
  statChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  statChipLabel: { fontSize: 10, color: '#64748b' },
  statChipVal: { fontSize: 12, fontWeight: '700', color: '#1e293b' },

  // Challenge Styles
  challengeDesc: { fontSize: 13, color: '#4b5563', marginTop: 4, marginBottom: 8 },
  leaderboardBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 10,
  },
  leaderboardBadgeText: { fontSize: 12, color: '#92400e' },
  viewPlanBtn: { paddingVertical: 6 },
  viewPlanBtnText: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
  tabContainer: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  tabActive: { backgroundColor: '#2563eb' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#4b5563' },
  tabTextActive: { color: '#fff' },
  leaderboardBox: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, marginBottom: 12 },
  leaderboardRow: { marginBottom: 10 },
  leaderboardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  campusRankText: { fontWeight: '700', fontSize: 13, color: '#111827' },
  campusScoreText: { fontSize: 12, color: '#6b7280' },
  barBackground: { height: 10, backgroundColor: '#e5e7eb', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#2563eb' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  photoUploadButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f8fafc',
  },
  photoUploadText: { color: '#2563eb', fontWeight: '600', fontSize: 14 },
  modalImagePreview: { width: '100%', height: 160, borderRadius: 8 },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  modalCancelBtn: { paddingVertical: 12, paddingHorizontal: 16, justifyContent: 'center' },
  modalCancelText: { color: '#6b7280', fontWeight: '600' },

  postButton: {
    backgroundColor: '#2563eb',
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
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  photoButtonText: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
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
  removeImageText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  card: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, marginBottom: 12 },
  checkInPostCard: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  checkInTag: { fontSize: 11, color: '#166534', fontWeight: '600', marginTop: 1 },
  mediaCard: {
    backgroundColor: '#f9fafb',
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
  author: { fontWeight: '600' },
  postImage: { width: '100%', height: 220, borderRadius: 8, marginBottom: 8 },
  postText: { marginBottom: 8 },
  postFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  likeText: { color: '#2563eb', fontWeight: '500' },
  commentBtnText: { color: '#4b5563', fontWeight: '500' },
  commentsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  commentBubble: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  commentAuthor: { fontWeight: '600', fontSize: 12, color: '#374151' },
  commentText: { fontSize: 13, color: '#111827', marginTop: 2 },
  commentInputRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  rowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTextBold: { fontSize: 16, fontWeight: '600', flexShrink: 1, marginRight: 8 },
  campusBadge: { fontSize: 12, color: '#4b5563', marginTop: 2 },
  linkSubtext: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  linkText: { color: '#2563eb' },
  smallButton: {
    backgroundColor: '#2563eb',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  joinedButton: { backgroundColor: '#9ca3af' },
  smallButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  createBox: {
    backgroundColor: '#f3f4f6',
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
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginBottom: 6,
  },
  dayRowRest: { backgroundColor: '#e5e7eb', opacity: 0.7 },
  dayRowDone: { backgroundColor: '#dcfce7' },
  dayNumber: { fontWeight: '600', width: 60 },
  dayLabel: { flex: 1, color: '#111827' },
  dayLabelRest: { fontStyle: 'italic', color: '#6b7280' },
  dayCheck: { fontSize: 16 },
});