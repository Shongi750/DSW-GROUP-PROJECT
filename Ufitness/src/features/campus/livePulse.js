// Campus pulse for Home.
// Base busy % is simulated from time of day.
// Real check-ins (last hour) add a small bump so GPS check-in shows up.

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
  let i = 0;
  while (i < str.length) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
    i = i + 1;
  }
  return Math.abs(h);
}

function occupancyFor(gym, date) {
  const h = date.getHours() + date.getMinutes() / 60;
  const evening = Math.exp(-Math.pow(h - 18, 2) / 18);
  const morning = 0.55 * Math.exp(-Math.pow(h - 7.5, 2) / 6);
  const slice = Math.floor(date.getMinutes() / 5);
  const jitter = (hash(gym.id + '-' + date.getHours() + '-' + slice) % 13) - 6;
  const occ = Math.min(1, evening + morning) * gym.peak + jitter;
  return Math.max(6, Math.min(97, Math.round(occ)));
}

// checkInCounts = { kingsway: 2, doornfontein: 0, ... } from gymCheckIn.js
export function gymStatus(now, checkInCounts) {
  if (!now) now = new Date();
  if (!checkInCounts) checkInCounts = {};

  const out = [];
  let i = 0;
  while (i < GYMS.length) {
    const gym = GYMS[i];
    let occupancy = occupancyFor(gym, now);
    // each fresh check-in nudges busy % up a bit (capped)
    const bump = Number(checkInCounts[gym.id] || 0) * 4;
    occupancy = Math.min(97, occupancy + bump);
    let level = 'CHILL';
    if (occupancy > 75) level = 'PEAK';
    else if (occupancy > 45) level = 'BUSY';
    out.push({
      id: gym.id,
      name: gym.name,
      short: gym.short,
      occupancy: occupancy,
      level: level,
      checkIns: Number(checkInCounts[gym.id] || 0),
    });
    i = i + 1;
  }
  return out;
}

export function liveFeed(now, count) {
  if (!now) now = new Date();
  if (!count) count = 4;
  const minute = Math.floor(now.getTime() / 60000);
  const rows = [];
  let i = 0;
  while (i < FEED.length) {
    const entry = FEED[i];
    rows.push({
      name: entry.name,
      action: entry.action,
      minutesAgo: ((minute + i * 7) % 47) + 1,
    });
    i = i + 1;
  }
  rows.sort(function (a, b) {
    return a.minutesAgo - b.minutesAgo;
  });
  return rows.slice(0, count);
}
