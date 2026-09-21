import AsyncStorage from '@react-native-async-storage/async-storage';
import { cloudSafeCommunity, currentUid, fetchCloudDoc, saveCloudDoc } from '../../lib/cloudCache';

const KEY = 'ufitness.community.v1';

export async function loadCommunityState() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    }
    const uid = currentUid();
    if (!uid) return null;
    const remote = await fetchCloudDoc('communityState', uid);
    if (!remote || typeof remote !== 'object') return null;
    const { ownerUid, updatedAt, ...state } = remote;
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
    return state;
  } catch {
    return null;
  }
}

export async function saveCommunityState(state, { replacePosts = false } = {}) {
  try {
    const current = await loadCommunityState();
    const incoming = Array.isArray(state?.posts) ? state.posts : [];
    const incomingIds = new Set(incoming.map((item) => item.id));
    const leftover = replacePosts
      ? []
      : (current?.posts || []).filter((item) => !incomingIds.has(item.id));
    const next = {
      posts: [...leftover, ...incoming],
      gymStatuses: { ...(current?.gymStatuses || {}), ...(state?.gymStatuses || {}) },
      groups: Array.isArray(state?.groups) ? state.groups : current?.groups || [],
    };
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    const uid = currentUid();
    if (uid) saveCloudDoc('communityState', uid, cloudSafeCommunity(next));
  } catch {
    /* quota / private mode */
  }
}

export async function appendCommunityPost(post) {
  const saved = await loadCommunityState();
  const posts = Array.isArray(saved?.posts) ? saved.posts : [];
  await saveCommunityState({
    posts: [post, ...posts.filter((item) => item.id !== post.id)],
    gymStatuses: saved?.gymStatuses,
  });
}
