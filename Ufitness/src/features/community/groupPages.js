const PAGES = {
  g1: {
    about: 'Easy 5 km loops before lectures. New runners welcome — no pace gate.',
    nextSession: 'Tue 06:15 · APK Kingsway loop',
    members: [
      { name: 'Lerato K.', role: 'Admin' },
      { name: 'Thabo M.', role: 'Member' },
      { name: 'Naledi P.', role: 'Member' },
    ],
    posts: [
      { id: 'gp1', author: 'Lerato K.', time: 'Yesterday', text: 'Meet at the library steps. Bring a bottle — we do the short loop if it rains.' },
      { id: 'gp2', author: 'Thabo M.', time: 'Mon', text: 'Hit 5.2 km. Who is in for Thursday?' },
    ],
  },
  g2: {
    about: 'Compound lifts, form checks, and a shared squat rack booking at APB.',
    nextSession: 'Wed 17:30 · APB gym floor',
    members: [
      { name: 'Sipho N.', role: 'Admin' },
      { name: 'Kagiso M.', role: 'Member' },
    ],
    posts: [
      { id: 'gp3', author: 'Sipho N.', time: 'Today', text: 'Bench pairs at 17:30. If you are new, we start you on the bar.' },
    ],
  },
  g3: {
    about: 'Mobility and recovery after labs. Mats on the DFC courtyard when the studio is full.',
    nextSession: 'Thu 16:00 · DFC courtyard',
    members: [
      { name: 'Aisha R.', role: 'Admin' },
      { name: 'Mike van Heerden', role: 'Member' },
      { name: 'Zanele D.', role: 'Member' },
    ],
    posts: [
      { id: 'gp4', author: 'Aisha R.', time: 'Sun', text: 'Hip openers this week. Come even if you only stay for 20 minutes.' },
    ],
  },
  g4: {
    about: 'Five-a-side and weekend matches. Boots optional, shin guards if you have them.',
    nextSession: 'Sat 09:00 · SWC field',
    members: [
      { name: 'Bongani S.', role: 'Admin' },
      { name: 'Faith M.', role: 'Member' },
    ],
    posts: [
      { id: 'gp5', author: 'Bongani S.', time: 'Fri', text: 'Need one more for Saturday. Text the group if you are late.' },
    ],
  },
};

function fallbackPage(group) {
  return {
    about: group?.about || 'Campus workout group. Join when you are ready — the feed opens after you do.',
    nextSession: group?.nextSession || 'Time to be set once more people join',
    members: group?.members || [{ name: 'Group admin', role: 'Admin' }],
    posts: group?.posts || [],
  };
}

export function getGroupPage(group) {
  const seeded = group?.id ? PAGES[group.id] : null;
  const page = seeded || fallbackPage(group);
  return {
    about: group?.about || page.about,
    nextSession: group?.nextSession || page.nextSession,
    members: page.members,
    posts: page.posts,
  };
}

export function mergeGroupMembership(seed, saved = []) {
  const byId = Object.fromEntries((saved || []).map((row) => [row.id, row]));
  const merged = (seed || []).map((group) => {
    const row = byId[group.id];
    const status = row?.status === 'joined' || row?.status === 'requested' ? 'joined' : group.status;
    return { ...group, status };
  });
  (saved || []).forEach((row) => {
    if (merged.some((group) => group.id === row.id)) return;
    if (row?.id && row?.name) merged.unshift({ ...row, status: row.status === 'none' ? 'none' : 'joined' });
  });
  return merged;
}
