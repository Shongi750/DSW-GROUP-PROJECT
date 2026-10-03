// Simulated live campus data — deterministic per time slice, local only.

const GYMS = [
  { id: 'kingsway', name: 'Kingsway Gym', short: 'KINGSWAY', peak: 84 },
  { id: 'doornfontein', name: 'Doornfontein Gym', short: 'DOORNFONTEIN', peak: 66 },
  { id: 'soweto', name: 'Soweto Campus Gym', short: 'SOWETO', peak: 58 },
];

const FEED = [
  { name: 'Thabo M.', action: 'hit a Bench Press PR' },
  { name: 'Naledi K.', action: 'started HIIT Circuit' },
  { name: 'Kagiso D.', action: 'finished 5km on the track' },
  { name: 'Lerato P.', action: 'joined Kingsway strength' },
  { name: 'Sipho B.', action: 'logged a 36 min session' },
];

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function occupancyFor(gym, date) {
  const h = date.getHours() + date.getMinutes() / 60;
  const evening = Math.exp(-Math.pow(h - 18, 2) / 18);
  const morning = 0.55 * Math.exp(-Math.pow(h - 7.5, 2) / 6);
  const slice = Math.floor(date.getMinutes() / 5);
  const jitter = (hash(`${gym.id}-${date.getHours()}-${slice}`) % 13) - 6;
  const occ = Math.min(1, evening + morning) * gym.peak + jitter;
  return Math.max(6, Math.min(97, Math.round(occ)));
}

export function gymStatus(now = new Date()) {
  return GYMS.map((gym) => {
    const occupancy = occupancyFor(gym, now);
    const level = occupancy > 75 ? 'PEAK' : occupancy > 45 ? 'BUSY' : 'CHILL';
    return { ...gym, occupancy, level };
  });
}

export function liveFeed(now = new Date(), count = 4) {
  const minute = Math.floor(now.getTime() / 60000);
  return FEED.map((entry, i) => ({
    ...entry,
    minutesAgo: ((minute + i * 7) % 47) + 1,
  }))
    .sort((a, b) => a.minutesAgo - b.minutesAgo)
    .slice(0, count);
}
