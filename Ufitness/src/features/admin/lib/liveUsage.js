import { collection, getDocs } from 'firebase/firestore';
import { getDb } from '../../../lib/firebase';
import { loadCommunityState } from '../../community/persist';
import { loadSavedPlan } from '../../meals/lib/persist';
import { USAGE_BY_CAMPUS, USAGE_BY_DAY, USAGE_BY_MODULE } from '../data/usageSeed';

const CAMPUSES = ['APK', 'APB', 'DFC', 'SWC'];

function campusCode(value) {
  const text = String(value || '').toUpperCase();
  return CAMPUSES.find((code) => text.startsWith(code)) || '';
}

export async function loadLiveStudents() {
  const db = getDb();
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, 'students'));
    return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
  } catch {
    return [];
  }
}

export async function loadLiveUsage() {
  const students = await loadLiveStudents();
  const meal = await loadSavedPlan();
  const community = await loadCommunityState();
  const liveCampus = CAMPUSES.map((label) => ({
    label,
    users: students.filter((row) => campusCode(row.campus) === label).length,
  }));
  const hasLive = students.length > 0;
  const localMeals = meal ? 1 : 0;
  const localCommunity = (community?.posts || []).length ? 1 : 0;

  return {
    live: hasLive,
    students,
    activeUsers: hasLive ? students.length : USAGE_BY_CAMPUS.reduce((sum, item) => sum + item.users, 0),
    byCampus: hasLive ? liveCampus : USAGE_BY_CAMPUS,
    byDay: USAGE_BY_DAY,
    byModule: hasLive
      ? [
          { label: 'Workout', users: students.filter((row) => row.fitnessGoal || row.workoutLocation).length },
          { label: 'Meals', users: Math.max(students.filter((row) => row.campus).length, localMeals) },
          { label: 'Community', users: Math.max(Math.round(students.length * 0.6), localCommunity) },
          { label: 'Mentors', users: students.filter((row) => /3|4|post/i.test(String(row.yearOfStudy || ''))).length },
        ]
      : USAGE_BY_MODULE,
  };
}
