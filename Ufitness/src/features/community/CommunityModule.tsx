/**
 * CommunityModule.tsx — in-app campus social hub (single file, many screens).
 *
 * Section map (scroll to function name):
 * - CommunityModule / AppContent — router + persist joined groups (AsyncStorage)
 * - HomeScreen / ProfileCreationScreen — entry when no community profile yet
 * - CampusCommunityScreen — main feed: posts, gym busyness, meal/workout clips, shortcuts to Buddies/Mentors
 * - GroupsScreen / GroupDetailScreen — browse groups + live group chat (groupLive)
 * - ChallengesScreen / ChallengeDetailScreen — campus challenges and progress
 *
 * Data: ./model seed data, ./persist for local state, groupLive for realtime chat when configured.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  Alert,
  Modal,
  Share,
  Pressable,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import SafeImage from '../../components/SafeImage';
import CookVideo from '../meals/components/CookVideo';
import { getRecipe } from '../meals/data/recipes';
import { SA_MEALS } from '../meals/data/saFoods';
import { loadCommunityState, saveCommunityState } from './persist';
import { getGroupPage, mergeGroupMembership } from './groupPages';
import { joinGroupLive, leaveGroupLive, loadGroupMembers, loadGroupMessages, sendGroupMessage, subscribeGroupChat } from './groupLive';
import { useApp } from '../../context/AppContext';
import WorkoutClipCard from './WorkoutClipCard';
import { useCommunityStyles } from './styles';
import InspoBackground from '../../components/InspoBackground';
import { SkeletonCard } from '../../components/Skeleton';
import MessageActionSheet from '../../components/MessageActionSheet';
import { filterBlocked, isBlocked, nameKey } from '../../lib/blockFilter';
import { useBlockedKeys } from '../../lib/moderation';
import { useSyncTick } from '../../lib/autoSync';
import {
  UJ_CAMPUSES,
  GYM_GOALS,
  GYM_PLANNER_MEALS,
  PUSHUP_PLAN,
  INITIAL_GROUPS,
  INITIAL_CHALLENGES,
  INITIAL_GYM_STATUSES,
  INITIAL_POSTS,
  parseYouTubeId,
} from './model';
import type {
  Profile,
  Comment,
  GymGoal,
  GymRecipe,
  Post,
  Group,
  Challenge,
  GymBusyness,
} from './model';

export default function CommunityModule({
  profileFromApp,
  onOpenBuddies,
  onOpenMentors,
  onOpenMentorHub,
}: {
  profileFromApp?: Profile | null;
  onOpenBuddies?: () => void;
  onOpenMentors?: () => void;
  onOpenMentorHub?: () => void;
}) {
  return (
    <SafeAreaProvider>
      <AppContent
        profileFromApp={profileFromApp}
        onOpenBuddies={onOpenBuddies}
        onOpenMentors={onOpenMentors}
        onOpenMentorHub={onOpenMentorHub}
      />
    </SafeAreaProvider>
  );
}

/** Picks which community screen to show and keeps group membership in sync with storage. */
function AppContent({
  profileFromApp,
  onOpenBuddies,
  onOpenMentors,
  onOpenMentorHub,
}: {
  profileFromApp?: Profile | null;
  onOpenBuddies?: () => void;
  onOpenMentors?: () => void;
  onOpenMentorHub?: () => void;
}) {
  const { styles, colors } = useCommunityStyles();
  const { user, profile: appProfile } = useApp();
  const actor = {
    uid: user?.id || appProfile?.userId || '',
    name: appProfile?.name || profileFromApp?.name || 'Student',
    campus: appProfile?.campus || '',
  };
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
    const group = groups.find((item) => item.id === id);
    setGroups((current) => current.map((item) => (item.id === id ? { ...item, status: 'joined' } : item)));
    joinGroupLive(id, actor, group || { id, name: id });
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
    <View style={{ flex: 1 }}>
      <InspoBackground plate="community" />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
            onOpenMentorHub={onOpenMentorHub}
          />
        ) : screen === 'groups' ? (
          <GroupsScreen
            loading={!groupsHydrated}
            groups={groups}
            setGroups={setGroups}
            actor={actor}
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
              leaveGroupLive(selectedGroupId, actor.uid);
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
    </View>
  );
}

/** Landing before the student creates a community display name. */
function HomeScreen({ onOpenCommunity }: { onOpenCommunity: () => void }) {
  const { styles, colors } = useCommunityStyles();
  return (
    <View style={styles.homeContainer}>
      <Text style={styles.heading}>Welcome</Text>
      <TouchableOpacity style={styles.mainButton} onPress={onOpenCommunity}>
        <Text style={styles.mainButtonText}>Campus Community</Text>
      </TouchableOpacity>
    </View>
  );
}

/** One-time community profile (name, campus, goals) before the feed. */
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
        <Ionicons name="arrow-back" size={20} color={colors.brand} />
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
              <Ionicons name="camera-outline" size={28} color={colors.muted} />
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

/** Small helper: hashtag-style labels shown on feed cards. */
function postTags(item: Post) {
  if (item.tags?.length) return item.tags.slice(0, 2);
  const tags: string[] = [];
  if (item.recipe) tags.push(item.recipe.goal);
  if (item.workoutStats) tags.push('Workout');
  if (item.isCheckIn && item.campus) tags.push(item.campus);
  if (item.workoutClip) tags.push('Clip');
  return tags.slice(0, 2);
}

/** Main feed: posts, likes, gym status, links to buddies/mentors. */
function CampusCommunityScreen({
  profile,
  onBack,
  onOpenGroups,
  onOpenChallenges,
  onOpenBuddies,
  onOpenMentors,
  onOpenMentorHub,
}: {
  profile: Profile | null;
  onBack?: () => void;
  onOpenGroups: () => void;
  onOpenChallenges: () => void;
  onOpenBuddies?: () => void;
  onOpenMentors?: () => void;
  onOpenMentorHub?: () => void;
}) {
  const { styles, colors } = useCommunityStyles();
  // Report / hide menu on other students' posts (feed posts have no account id, so hide is by name).
  const blocked = useBlockedKeys();
  const [actionTarget, setActionTarget] = useState<any>(null);
  const [gymStatuses, setGymStatuses] = useState<Record<string, GymBusyness>>(INITIAL_GYM_STATUSES);
  const [communityHydrated, setCommunityHydrated] = useState(false);
  
  const resCode = profile?.residenceCampus ? profile.residenceCampus.split(' ')[0] : 'APK';
  const studyCode = profile?.studyCampus ? profile.studyCampus.split(' ')[0] : 'APB';
  
  const myCampuses = Array.from(new Set([resCode, studyCode]));
  
  const [showOtherCampuses, setShowOtherCampuses] = useState(false);
  const [selectedCampusForMeter, setSelectedCampusForMeter] = useState(myCampuses[0] || 'APK');
  const [busynessNote, setBusynessNote] = useState('');
  const [showGymStatus, setShowGymStatus] = useState(false);
  const [showMoreCompose, setShowMoreCompose] = useState(false);
  const [hubSegment, setHubSegment] = useState<'feed' | 'groups' | 'challenges' | 'connect'>('feed');

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
  const [feedQuery, setFeedQuery] = useState('');

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

  const visiblePosts = posts.filter((item) => {
    if (!isOwnPost(item) && isBlocked(blocked, nameKey(item.author))) return false;
    const query = feedQuery.trim().toLowerCase();
    if (!query) return true;
    return `${item.author} ${item.text} ${(item.tags || []).join(' ')}`.toLowerCase().includes(query);
  });

  const busynessPanel = (
    <View style={styles.meterContainer}>
      <View style={styles.meterTitleRow}>
        <Ionicons name="flame" size={20} color={colors.brand} style={{ marginRight: 6 }} />
        <Text style={styles.meterTitle}>Campus gym status</Text>
      </View>

      <View style={styles.meterCampusRow}>
        {displayedCampuses.map((code) => {
          const info = gymStatuses[code];
          // Orange intensity only — Quiet soft, Moderate brand, Packed deep.
          const statusColor =
            info?.status === 'Quiet'
              ? '#FFB27A'
              : info?.status === 'Moderate'
                ? colors.brand
                : info?.status === 'Packed'
                  ? '#C2410C'
                  : colors.muted;

          return (
            <TouchableOpacity
              key={`meter-${code}`}
              style={[styles.meterCard, selectedCampusForMeter === code && styles.meterCardSelected]}
              onPress={() => setSelectedCampusForMeter(code)}
            >
              <Text style={styles.meterCampusText}>{code}</Text>
              <Text style={[styles.meterBadgeText, { color: statusColor }]}>{info?.status || 'Unknown'}</Text>
              <Text style={styles.meterTimeText}>{info?.lastUpdated}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.toggleCampusesBtn} onPress={() => setShowOtherCampuses(!showOtherCampuses)}>
        <Text style={styles.toggleCampusesText}>
          {showOtherCampuses ? 'Hide other campuses' : 'See other campuses'}
        </Text>
      </TouchableOpacity>

      {gymStatuses[selectedCampusForMeter]?.note ? (
        <View style={styles.noteRow}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={14}
            color={colors.text}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.meterNote}>
            “{gymStatuses[selectedCampusForMeter].note}” —{' '}
            <Text style={{ fontWeight: 'bold' }}>{gymStatuses[selectedCampusForMeter].reportedBy}</Text>
          </Text>
        </View>
      ) : null}

      <View style={styles.checkInBox}>
        <Text style={styles.checkInLabel}>At {selectedCampusForMeter} gym? Update how full it is.</Text>
        <TextInput
          style={[styles.input, { marginRight: 0, marginBottom: 8 }]}
          placeholder="Optional note (e.g. squat rack taken)..."
          placeholderTextColor={colors.muted}
          value={busynessNote}
          onChangeText={setBusynessNote}
        />
        <View style={styles.busynessBtnRow}>
          <TouchableOpacity style={[styles.statusBtn, styles.btnQuiet]} onPress={() => handleUpdateBusyness('Quiet')}>
            <Ionicons name="radio-button-on" size={12} color="#FFB27A" style={{ marginRight: 4 }} />
            <Text style={styles.statusBtnText}>Quiet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusBtn, styles.btnModerate]}
            onPress={() => handleUpdateBusyness('Moderate')}
          >
            <Ionicons name="radio-button-on" size={12} color="#FF6A00" style={{ marginRight: 4 }} />
            <Text style={styles.statusBtnText}>Moderate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statusBtn, styles.btnPacked]} onPress={() => handleUpdateBusyness('Packed')}>
            <Ionicons name="radio-button-on" size={12} color="#C2410C" style={{ marginRight: 4 }} />
            <Text style={styles.statusBtnText}>Packed</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        ListHeaderComponent={
          <>
            {onBack ? (
              <TouchableOpacity onPress={onBack} style={styles.backRow}>
                <Ionicons name="arrow-back" size={20} color={colors.brand} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            ) : null}

            <Text style={styles.heading}>Campus</Text>
            <Text style={[styles.subHeading, { marginBottom: 14 }]}>
              {profile?.name ? `${profile.name.split(' ')[0]}, today at ${resCode}.` : 'Today at UJ.'}
            </Text>

            <View style={styles.segmentBar}>
              {(
                [
                  { id: 'feed' as const, label: 'Feed' },
                  { id: 'groups' as const, label: 'Groups' },
                  { id: 'challenges' as const, label: 'Challenges' },
                  { id: 'connect' as const, label: 'Connect' },
                ] as const
              ).map((item) => {
                const on = hubSegment === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.segmentBtn, on && styles.segmentBtnOn]}
                    onPress={() => {
                      setHubSegment(item.id);
                      if (item.id === 'groups') onOpenGroups();
                      else if (item.id === 'challenges') onOpenChallenges();
                      else if (item.id === 'connect') {
                        if (onOpenBuddies) onOpenBuddies();
                        else if (onOpenMentors) onOpenMentors();
                      }
                    }}
                  >
                    <Text style={[styles.segmentBtnText, on && styles.segmentBtnTextOn]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {onOpenMentorHub ? (
              <TouchableOpacity
                style={[
                  styles.gymPill,
                  styles.gymPillOn,
                  {
                    flex: 0,
                    flexDirection: 'row',
                    alignSelf: 'flex-start',
                    marginBottom: 12,
                    paddingHorizontal: 14,
                    alignItems: 'center',
                  },
                ]}
                onPress={onOpenMentorHub}
                activeOpacity={0.88}
              >
                <Ionicons name="ribbon-outline" size={14} color={colors.brand} style={{ marginRight: 8 }} />
                <Text style={styles.gymPillCode}>Mentor Hub · mentees & guidance</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[
                styles.gymPill,
                styles.gymPillOn,
                {
                  flex: 0,
                  flexDirection: 'row',
                  alignSelf: 'flex-start',
                  marginBottom: 12,
                  paddingHorizontal: 14,
                },
              ]}
              onPress={() => {
                setSelectedCampusForMeter(resCode);
                setShowGymStatus((v) => !v);
                setShowOtherCampuses(false);
              }}
            >
              <Text style={styles.gymPillCode}>
                {resCode} gym · {gymStatuses[resCode]?.status || 'Check in'}
              </Text>
              <Ionicons
                name={showGymStatus ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.brand}
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>

            {showGymStatus ? (
              <>
                <View style={styles.gymPillRow}>
                  {['APK', 'APB', 'DFC', 'SWC'].map((code) => {
                    const info = gymStatuses[code];
                    const statusColor =
                      info?.status === 'Quiet'
                        ? '#FFB27A'
                        : info?.status === 'Moderate'
                          ? colors.brand
                          : info?.status === 'Packed'
                            ? '#C2410C'
                            : colors.muted;
                    const on = selectedCampusForMeter === code;
                    return (
                      <TouchableOpacity
                        key={`pill-${code}`}
                        style={[styles.gymPill, on && styles.gymPillOn]}
                        onPress={() => {
                          setSelectedCampusForMeter(code);
                          setShowOtherCampuses(true);
                        }}
                      >
                        <Text style={styles.gymPillCode}>{code}</Text>
                        <Text style={[styles.gymPillStatus, { color: statusColor }]}>
                          {info?.status || '—'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {busynessPanel}
              </>
            ) : null}

            {!showMoreCompose ? (
              <TouchableOpacity
                style={styles.workoutTriggerButton}
                onPress={() => setShowMoreCompose(true)}
              >
                <Ionicons name="create-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.workoutTriggerText}>Share with campus</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.composeGlass}>
                {newPostImage ? (
                  <View style={styles.imagePreviewWrap}>
                    <Image source={{ uri: newPostImage }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveImage}>
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : null}

                <TextInput
                  style={[styles.input, styles.captionInput]}
                  placeholder={newPostImage ? 'Write a caption...' : 'Share with campus...'}
                  placeholderTextColor={colors.muted}
                  value={newPost}
                  onChangeText={setNewPost}
                  multiline
                />

                <View style={styles.postActionsRow}>
                  <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
                    <Ionicons name="camera-outline" size={16} color={colors.brand} style={{ marginRight: 4 }} />
                    <Text style={styles.photoButtonText}>{newPostImage ? 'Change' : 'Photo'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoButton} onPress={() => setIsWorkoutModalOpen(true)}>
                    <Ionicons name="barbell-outline" size={16} color={colors.brand} style={{ marginRight: 4 }} />
                    <Text style={styles.photoButtonText}>Workout</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={() => {
                      setSelectedCampusForMeter(resCode);
                      setShowGymStatus(true);
                    }}
                  >
                    <Ionicons name="fitness-outline" size={16} color={colors.brand} style={{ marginRight: 4 }} />
                    <Text style={styles.photoButtonText}>Check-in</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.postButton} onPress={handleAddPost}>
                    <Text style={styles.postButtonText}>Post</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.moreCompose} onPress={() => setShowMoreCompose(false)}>
                  <Text style={styles.moreComposeText}>Close composer</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        data={visiblePosts}
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
                  <Text style={[styles.darkMeta, { color: colors.muted }]}>{item.meta || 'UJ student'}</Text>
                  {item.isCheckIn ? (
                    <View style={styles.tagRow}>
                      <Ionicons name="location-outline" size={12} color={colors.brand} style={{ marginRight: 2 }} />
                      <Text style={[styles.checkInTag, { color: colors.brand }]}>
                        Gym Check-In • {item.campus} • {item.busynessStatus}
                      </Text>
                    </View>
                  ) : null}
                  {item.recipe ? (
                    <View style={styles.tagRow}>
                      <Ionicons name="restaurant-outline" size={12} color={colors.brand} style={{ marginRight: 2 }} />
                      <Text style={styles.recipeTag}>Gym recipe • {item.recipe.goal}</Text>
                    </View>
                  ) : null}
                  {item.workoutClip ? (
                    <View style={styles.tagRow}>
                      <Ionicons name="musical-notes-outline" size={12} color={colors.brand} style={{ marginRight: 2 }} />
                      <Text style={styles.recipeTag}>
                        Workout clip • {item.workoutClip.musicTitle}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {isOwnPost(item) ? (
                  <TouchableOpacity onPress={() => handleDeletePost(item)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.muted} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    hitSlop={8}
                    accessibilityLabel="Report or hide post"
                    onPress={() =>
                      setActionTarget({
                        table: 'community_posts',
                        messageId: item.id,
                        authorName: item.author,
                        text: item.text,
                        blockKey: nameKey(item.author),
                      })
                    }
                  >
                    <Ionicons name="ellipsis-horizontal" size={18} color={colors.muted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Workout Log Highlight Section */}
              {item.workoutStats && (
                <View style={styles.workoutCardBadge}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="flash-outline" size={16} color={colors.brand} style={{ marginRight: 4 }} />
                    <Text style={styles.workoutCardTitle}>
                      {item.workoutStats.title}
                    </Text>
                  </View>
                  <View style={styles.workoutStatsRow}>
                    <View style={styles.statChip}>
                      <Ionicons name="time-outline" size={12} color={colors.muted} style={{ marginRight: 4 }} />
                      <Text style={styles.statChipLabel}>Duration: </Text>
                      <Text style={styles.statChipVal}>
                        {item.workoutStats.durationMinutes} mins
                      </Text>
                    </View>
                    {item.workoutStats.totalWeightKg && (
                      <View style={styles.statChip}>
                        <Ionicons name="barbell-outline" size={12} color={colors.muted} style={{ marginRight: 4 }} />
                        <Text style={styles.statChipLabel}>Vol: </Text>
                        <Text style={styles.statChipVal}>
                          {item.workoutStats.totalWeightKg} kg
                        </Text>
                      </View>
                    )}
                    {item.workoutStats.distanceKm && (
                      <View style={styles.statChip}>
                        <Ionicons name="walk-outline" size={12} color={colors.muted} style={{ marginRight: 4 }} />
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
              {!!item.text ? <Text style={styles.postText}>{item.text}</Text> : null}
              {item.imageUri && (
                <SafeImage
                  uri={typeof item.imageUri === 'string' ? item.imageUri : item.imageUri?.uri}
                  style={styles.postImage}
                />
              )}
              {postTags(item).length ? (
                <View style={styles.darkTagRow}>
                  {postTags(item).map((tag) => (
                    <View key={tag} style={styles.darkTag}>
                      <Text style={[styles.darkTagText, { color: colors.text }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={styles.postFooterRow}>
                <View style={styles.darkFooterLeft}>
                  <TouchableOpacity onPress={() => handleLike(item.id)} style={styles.footerActionRow}>
                    <Ionicons
                      name="heart-outline"
                      size={16}
                      color={colors.brand}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.likeText, { color: colors.text }]}>{item.likes}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.footerActionRow}
                    onPress={() =>
                      setActiveCommentPostId(isCommenting ? null : item.id)
                    }
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={16}
                      color={colors.text}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.commentBtnText, { color: colors.text }]}>
                      Comments ({item.comments.length})
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => Share.share({ message: item.text || `${item.author} on UFitness` })}
                  hitSlop={8}
                >
                  <Ionicons name="share-outline" size={18} color={colors.text} />
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
                <Ionicons name="camera-outline" size={20} color={colors.brand} style={{ marginRight: 6 }} />
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
                  <Ionicons name="videocam-outline" size={16} color={colors.brand} style={{ marginRight: 4 }} />
                  <Text style={styles.photoButtonText}>Record</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={() => handlePickWorkoutClip(false)}>
                  <Ionicons name="images-outline" size={16} color={colors.brand} style={{ marginRight: 4 }} />
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
      <MessageActionSheet target={actionTarget} onClose={() => setActionTarget(null)} />
    </>
  );
}

/** List of campus workout groups the student can join. */
function GroupsScreen({
  loading,
  groups,
  setGroups,
  actor,
  onBack,
  onOpenGroup,
  onJoinGroup,
}: {
  loading?: boolean;
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  actor: { uid: string; name: string; campus: string };
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
      name: newGroupName.trim(),
      campus: selectedCampus,
      link: `myapp://group/${id}`,
      imageUri: newGroupImage
        ? { uri: newGroupImage }
        : { uri: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80' },
      status: 'joined',
    };
    setGroups((current) => [newGroup, ...current]);
    joinGroupLive(id, actor, newGroup);
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
            <Ionicons name="arrow-back" size={20} color={colors.brand} />
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
                <Ionicons name="image-outline" size={16} color={colors.brand} style={{ marginRight: 4 }} />
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
      data={loading ? [] : filteredGroups}
      // Skeleton cards while saved group memberships load
      ListEmptyComponent={
        loading ? (
          <View>
            <SkeletonCard style={{ marginHorizontal: 0 }} />
            <SkeletonCard style={{ marginHorizontal: 0 }} />
          </View>
        ) : (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 16 }}>No groups match your search.</Text>
        )
      }
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
                    <Ionicons name="location-outline" size={12} color={colors.muted} style={{ marginRight: 2 }} />
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

/** One group: about, session info, and live chat thread. */
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
  const { styles, colors } = useCommunityStyles();
  const page = getGroupPage(group);
  const joined = group?.status === 'joined';
  const [liveMembers, setLiveMembers] = useState<{ name: string; role: string }[]>([]);
  const [messages, setMessages] = useState<{ id: string; userId?: string; author: string; text: string; time: string }[]>([]);
  const [draft, setDraft] = useState('');
  const [actionTarget, setActionTarget] = useState<any>(null);
  const { profile: appProfile, user } = useApp();
  const blocked = useBlockedKeys();
  const syncTick = useSyncTick(); // reload members + chat after reconnecting
  // Hide messages from people I blocked (my own always show).
  const visibleMessages = filterBlocked(messages, blocked, (item) => item.userId, user?.id);

  useEffect(() => {
    let alive = true;
    loadGroupMembers(group?.id).then((rows) => {
      if (alive) setLiveMembers(rows);
    });
    return () => {
      alive = false;
    };
  }, [group?.id, joined, syncTick]);

  useEffect(() => {
    if (!joined || !group?.id) {
      setMessages([]);
      return undefined;
    }
    let alive = true;
    loadGroupMessages(group.id).then((rows) => {
      if (alive) setMessages(rows);
    });
    const unsubscribe = subscribeGroupChat(group.id, (message) => {
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [group?.id, joined, syncTick]);

  const sendChat = async () => {
    const text = draft.trim();
    if (!text || !group?.id) return;
    setDraft('');
    const saved = await sendGroupMessage(group.id, { body: text });
    if (saved) {
      setMessages((current) => (current.some((item) => item.id === saved.id) ? current : [...current, saved]));
    }
  };

  const members = liveMembers;

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <>
          <TouchableOpacity onPress={onBack} style={styles.backRow}>
            <Ionicons name="arrow-back" size={20} color={colors.brand} />
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
              <Ionicons name="location-outline" size={14} color={colors.muted} style={{ marginRight: 4 }} />
              <Text style={styles.campusBadge}>{group.campus.split(' ')[0]}</Text>
            </View>
          ) : null}

          <View style={styles.createBox}>
            <Text style={styles.fieldLabel}>Next session</Text>
            <Text style={styles.challengeDesc}>{page.nextSession}</Text>
            <Text style={styles.linkSubtext}>
              {joined
                ? liveMembers.length
                  ? 'You are in. Members below are students who joined from their own phones.'
                  : 'You are in. Other signed-in students appear here when they join.'
                : 'Join to add yourself to this group. Other students will see you on the member list.'}
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

          <Text style={styles.sectionTitle}>Group chat</Text>
          {!joined ? (
            <Text style={styles.subHeading}>Join to read and send messages. They show up for everyone in this group.</Text>
          ) : (
            <View style={styles.rowCard}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Message the group"
                placeholderTextColor={colors.muted}
                style={[styles.linkSubtext, { flex: 1, color: colors.text, paddingVertical: 8 }]}
              />
              <TouchableOpacity style={styles.smallButton} onPress={sendChat}>
                <Text style={styles.smallButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      }
      data={joined ? visibleMessages : []}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        joined ? <Text style={styles.subHeading}>No messages yet. Say hello.</Text> : null
      }
      ListFooterComponent={
        <>
          {joined && visibleMessages.length ? (
            <Text style={styles.linkSubtext}>Long-press a message to report it or block the sender.</Text>
          ) : null}
          <MessageActionSheet target={actionTarget} onClose={() => setActionTarget(null)} />
        </>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          delayLongPress={350}
          onLongPress={
            item.userId && item.userId === user?.id
              ? undefined
              : () =>
                  setActionTarget({
                    table: 'group_messages',
                    messageId: item.id,
                    authorId: item.userId,
                    authorName: item.author,
                    text: item.text,
                  })
          }
        >
          <Text style={styles.author}>{item.author}</Text>
          <Text style={styles.linkSubtext}>{item.time}</Text>
          <Text style={styles.postText}>{item.text}</Text>
        </Pressable>
      )}
    />
  );
}

/** Campus fitness challenges the student can browse and join. */
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
  const { styles, colors } = useCommunityStyles();
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
            <Ionicons name="arrow-back" size={20} color={colors.brand} />
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
                <Ionicons name="trophy-outline" size={14} color={colors.brand} style={{ marginRight: 4 }} />
                <Text style={styles.leaderboardBadgeText}>
                  Leading Campus: <Text style={{ fontWeight: 'bold' }}>{topCampus.campusCode}</Text> ({topCampus.completedCount} finished)
                </Text>
              </View>

              <View style={styles.rowCard}>
                <TouchableOpacity
                  style={styles.viewPlanBtn}
                  onPress={() => onOpenChallengeDetail(item.id)}
                >
                  <Ionicons name="stats-chart-outline" size={14} color={colors.brand} style={{ marginRight: 4 }} />
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

/** Single challenge: rules, leaderboard-style stats, join actions. */
function ChallengeDetailScreen({
  challenge,
  onBack,
}: {
  challenge: Challenge;
  onBack: () => void;
}) {
  const { styles, colors } = useCommunityStyles();
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
            <Ionicons name="arrow-back" size={20} color={colors.brand} />
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
              <Ionicons name="clipboard-outline" size={16} color={activeTab === 'tracker' ? '#fff' : colors.muted} style={{ marginRight: 6 }} />
              <Text style={[styles.tabText, activeTab === 'tracker' && styles.tabTextActive]}>
                My Workout Plan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'leaderboard' && styles.tabActive]}
              onPress={() => setActiveTab('leaderboard')}
            >
              <Ionicons name="podium-outline" size={16} color={activeTab === 'leaderboard' ? '#fff' : colors.muted} style={{ marginRight: 6 }} />
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
                color={done ? "#16a34a" : colors.muted}
              />
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}

