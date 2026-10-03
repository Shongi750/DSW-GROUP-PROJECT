const fs = require('fs');
const path = 'src/features/community/CommunityModule.tsx';
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
const hookStart = lines.findIndex((line) => line.startsWith('function useCommunityStyles'));
const modelStart = lines.findIndex((line) => line.startsWith('const UJ_CAMPUSES'));
const moduleStart = lines.findIndex((line) => line.startsWith('export default function CommunityModule'));
const stylesStart = lines.findIndex((line) => line.startsWith('function createStyles'));
if ([hookStart, modelStart, moduleStart, stylesStart].some((index) => index < 0)) {
  throw new Error('Could not find split markers');
}
const hook = lines.slice(hookStart, modelStart).join('\n');
const model = lines.slice(modelStart, moduleStart).join('\n').replace(/^(type |const |function )/gm, 'export $1') + '\n';
const screens = lines.slice(moduleStart, stylesStart).join('\n');
const stylesFn = lines.slice(stylesStart).join('\n');
const styles = [
  "import { useMemo } from 'react';",
  "import { StyleSheet } from 'react-native';",
  "import { useTheme } from '../../context/ThemeContext';",
  '',
  'export ' + hook.trim(),
  '',
  stylesFn,
  '',
].join('\n');
const header = `import React, { useCallback, useEffect, useState } from 'react';
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
import { joinGroupLive, leaveGroupLive, loadGroupMembers } from './groupLive';
import { useApp } from '../../context/AppContext';
import WorkoutClipCard from './WorkoutClipCard';
import { useCommunityStyles } from './styles';
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
`;
fs.writeFileSync('src/features/community/model.ts', model);
fs.writeFileSync('src/features/community/styles.ts', styles);
fs.writeFileSync(path, header + '\n' + screens + '\n');
console.log('ok', model.split('\n').length, styles.split('\n').length, (header + screens).split('\n').length);
