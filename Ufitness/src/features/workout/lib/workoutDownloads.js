import { CLIP_FEED } from '../data/clips';
import { downloadId, uniqueUrls, workoutMediaUrls } from '../../../lib/downloads/downloadsCore';
import { getDownload, loadDownloads, removeDownload, saveDownload } from '../../../lib/downloads/downloadsStore';
import { rememberExercises, removeSavedSession, saveSessionOffline } from './sessionApi';

// Workout / program downloads: exercise list, sets & reps, how-to text,
// plus exercise GIFs/photos and clip media (saved as files on the phone).

const downloadedExercises = new Map();

/** 'session-legs' or 'program-full-body' — the id used in the Downloads list. */
export function workoutRefId({ sessionId, programId }) {
  if (sessionId) return `session-${sessionId}`;
  if (programId) return `program-${programId}`;
  return '';
}

/** Only the exercise fields the screens use (keeps the download small). */
function exerciseForDownload(item) {
  return {
    id: item.id,
    name: item.name,
    focus: item.focus || [],
    howToFocus: item.howToFocus || item.focus || [],
    duration: item.duration,
    mode: item.mode,
    sets: item.sets,
    reps: item.reps,
    rest: item.rest,
    equipment: item.equipment,
    instructions: item.instructions || [],
    muscleHint: item.muscleHint || '',
    gifUrl: item.gifUrl || null,
    photoFrames: item.photoFrames || [],
    bodyPart: item.bodyPart,
    source: item.source,
  };
}

/** 'ready-quick-burn' - ready-made workouts from the Workouts tab (they open in PreStart). */
export function readyRefId(workoutId) {
  return workoutId ? `ready-${workoutId}` : '';
}

/** Ready-made workout (Workouts list / PreStart) as plain JSON: plan + exercises + cover image. */
export function readyWorkoutSnapshot({ workout, exercises, image }) {
  const minutes = workout.minutes || 15;
  const level = workout.level || 'Train';
  const focus = workout.focus || 'Full body';
  return {
    type: 'ready',
    id: workout.id,
    name: workout.name || workout.title || 'Workout',
    meta: `${minutes} min · ${level} · ${focus}`,
    minutes,
    level,
    focus,
    group: workout.group || '',
    image: image || null,
    exerciseIds: exercises.map((item) => item.id),
    moves: workout.movesList || null,
    exercises: exercises.map(exerciseForDownload),
    clips: [],
  };
}

export async function downloadReadyWorkout(snapshot) {
  rememberDownloaded(snapshot.exercises);
  return saveDownload({
    kind: 'workout',
    refId: readyRefId(snapshot.id),
    title: snapshot.name,
    subtitle: `${snapshot.exercises.length} moves · ${snapshot.meta}`,
    data: snapshot,
    media: uniqueUrls([snapshot.image, ...workoutMediaUrls(snapshot)]),
  });
}

/** Everything the Exercises screen + Player need, as plain JSON. */
export function workoutSnapshot({ session, program, exercises, moves }) {
  const source = session || program || {};
  const programId = session ? null : program?.id;
  return {
    type: session ? 'session' : 'program',
    id: source.id,
    name: source.name || 'Workout',
    meta: source.meta || '',
    exerciseIds: exercises.map((item) => item.id),
    moves,
    exercises: exercises.map(exerciseForDownload),
    clips: CLIP_FEED.filter((clip) => programId && clip.programId === programId).map((clip) => ({
      id: clip.id,
      title: clip.title,
      creator: clip.creator,
      youtubeId: clip.youtubeId,
      videoUrl: clip.videoUrl || null,
    })),
  };
}

export async function downloadWorkout(snapshot) {
  const refId = snapshot.type === 'session' ? `session-${snapshot.id}` : `program-${snapshot.id}`;
  // Sessions also go in the older saved-sessions store, which buildSession() falls back to.
  if (snapshot.type === 'session') await saveSessionOffline(snapshot);
  rememberDownloaded(snapshot.exercises);
  return saveDownload({
    kind: 'workout',
    refId,
    title: snapshot.name,
    subtitle: `${snapshot.exercises.length} moves${snapshot.meta ? ` · ${snapshot.meta}` : ''}`,
    data: snapshot,
    media: workoutMediaUrls(snapshot),
  });
}

export async function removeWorkoutDownload(refId) {
  if (refId.startsWith('session-')) await removeSavedSession(refId.slice('session-'.length));
  await removeDownload(downloadId('workout', refId));
}

/** The downloaded copy of a session/program, or null. */
export async function loadWorkoutDownload(refId) {
  const saved = await getDownload('workout', refId);
  if (saved?.data?.exercises) rememberDownloaded(saved.data.exercises);
  return saved;
}

function rememberDownloaded(list = []) {
  list.forEach((item) => item?.id && downloadedExercises.set(item.id, item));
  rememberExercises(list);
}

/** Exercise from any downloaded workout (used when the online catalog didn't load). */
export function downloadedExercise(id) {
  return downloadedExercises.get(id) || null;
}

/** Load every downloaded workout's exercises into memory (call once on start). */
export async function primeDownloadedExercises() {
  const index = await loadDownloads();
  const workouts = Object.values(index).filter((entry) => entry.kind === 'workout');
  for (const entry of workouts) {
    await loadWorkoutDownload(entry.refId);
  }
  return downloadedExercises.size;
}
