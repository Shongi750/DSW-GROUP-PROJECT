// Fixed UJ gym pins — we do NOT track students around campus.
// Check-in only: "are you near this gym right now?"

export const CAMPUS_GYMS = [
  {
    id: 'kingsway',
    name: 'Kingsway Gym',
    short: 'KINGSWAY',
    campus: 'APK',
    // approx Auckland Park Kingsway
    lat: -26.1826,
    lng: 28.0042,
  },
  {
    id: 'doornfontein',
    name: 'Doornfontein Gym',
    short: 'DOORNFONTEIN',
    campus: 'DFC',
    lat: -26.1925,
    lng: 28.0515,
  },
  {
    id: 'soweto',
    name: 'Soweto Campus Gym',
    short: 'SOWETO',
    campus: 'SWC',
    lat: -26.2635,
    lng: 27.8735,
  },
];

// How close you need to be (metres) to count as checked in
export const CHECK_IN_RADIUS_M = 250;

// Rough distance between two lat/lng points (metres)
export function distanceMetres(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = function (d) {
    return (d * Math.PI) / 180;
  };
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearest gym within radius, or null
export function nearestGym(lat, lng, radiusM) {
  if (radiusM == null) radiusM = CHECK_IN_RADIUS_M;
  let best = null;
  let bestDist = radiusM + 1;
  let i = 0;
  while (i < CAMPUS_GYMS.length) {
    const gym = CAMPUS_GYMS[i];
    const d = distanceMetres(lat, lng, gym.lat, gym.lng);
    if (d <= radiusM && d < bestDist) {
      best = gym;
      bestDist = d;
    }
    i = i + 1;
  }
  if (!best) return null;
  return { gym: best, metres: Math.round(bestDist) };
}

// Map main profile campus code → default gym (manual fallback on web)
export function gymForCampus(campusCode) {
  if (!campusCode) return CAMPUS_GYMS[0];
  const code = String(campusCode).toUpperCase();
  let i = 0;
  while (i < CAMPUS_GYMS.length) {
    if (CAMPUS_GYMS[i].campus === code) return CAMPUS_GYMS[i];
    // APB is also Auckland Park — treat like Kingsway
    if (code.indexOf('APK') !== -1 || code.indexOf('APB') !== -1) {
      if (CAMPUS_GYMS[i].id === 'kingsway') return CAMPUS_GYMS[i];
    }
    if (code.indexOf('DFC') !== -1 && CAMPUS_GYMS[i].id === 'doornfontein') return CAMPUS_GYMS[i];
    if (code.indexOf('SWC') !== -1 && CAMPUS_GYMS[i].id === 'soweto') return CAMPUS_GYMS[i];
    i = i + 1;
  }
  return CAMPUS_GYMS[0];
}
