import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProgram } from '../data/programs';
import CatalogHeader from '../components/catalogheader';
import SectionTitle from '../components/sectiontitle';
import { GlassScreen } from '../components/glass';
import { OrangeStartBar } from '../components/startcard';
import WorkoutListRow from '../components/workoutlistrow';
import { useApp } from '../context/AppContext';
import { lookupExercise } from '../lib/exercisedb';
import { programMoves } from '../lib/session';
import { buildSession, rememberExercises } from '../lib/sessionApi';
import {
  downloadWorkout,
  loadWorkoutDownload,
  removeWorkoutDownload,
  workoutRefId,
  workoutSnapshot,
} from '../lib/workoutDownloads';
import DownloadButton from '../../../components/DownloadButton';
import { useDownload } from '../../../lib/downloads/useDownload';
import { pickOfflineSource } from '../../../lib/downloads/downloadsCore';
import { isOnline, useOnline } from '../../../lib/autoSync';

export default function ExercisesScreen({ navigation, route }) {
  const {
    profile,
    catalog,
    catalogSource,
    catalogError,
    catalogLoading,
    bodyParts,
    hasApiKey,
    getExercise,
    searchRemote,
    loadBodyPart,
  } = useApp();
  const [query, setQuery] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [remoteRows, setRemoteRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [apiNote, setApiNote] = useState('');
  const program = route.params?.programId ? getProgram(route.params.programId) : null;
  const sessionId = route.params?.sessionId || null;
  const [session, setSession] = useState(null);
  const [sessionError, setSessionError] = useState('');
  const online = useOnline();
  const refId = workoutRefId({ sessionId, programId: program?.id });
  const dl = useDownload('workout', refId);
  const [offlineCopy, setOfflineCopy] = useState(null); // downloaded session/program (or null)

  // Downloaded copy of this session/program, if any.
  useEffect(() => {
    if (!refId) return undefined;
    let alive = true;
    loadWorkoutDownload(refId).then((saved) => alive && setOfflineCopy(saved?.data || null));
    return () => {
      alive = false;
    };
  }, [refId, dl.downloaded]);

  useEffect(() => {
    if (!sessionId) return undefined;
    let cancelled = false;
    setBusy(true);
    setSessionError('');
    (async () => {
      // Offline-first: no connection + a downloaded copy → use it straight away.
      const saved = await loadWorkoutDownload(`session-${sessionId}`);
      if (!isOnline() && saved?.data) {
        if (!cancelled) {
          setSession({ ...saved.data, offline: true });
          setBusy(false);
        }
        return;
      }
      try {
        const built = await buildSession(sessionId, { tier: profile.equipmentTier || 'bodyweight' });
        if (cancelled) return;
        rememberExercises(built.exercises);
        setSession(built);
      } catch (error) {
        if (cancelled) return;
        if (saved?.data) setSession({ ...saved.data, offline: true });
        else setSessionError(error.message || 'Could not build this session.');
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, profile.equipmentTier]);

  useEffect(() => {
    if (program || sessionId) return undefined;
    const needle = query.trim();
    if (needle.length < 2 && !bodyPart) {
      setRemoteRows([]);
      setApiNote('');
      return undefined;
    }
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const rows = needle.length >= 2 ? await searchRemote(needle) : await loadBodyPart(bodyPart);
        setRemoteRows(rows);
        setApiNote(rows.length ? `ExerciseDB · ${rows.length} matches` : 'No ExerciseDB matches');
      } catch (error) {
        setApiNote(error.message || 'ExerciseDB search failed');
      } finally {
        setBusy(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, bodyPart, hasApiKey, program, sessionId, searchRemote, loadBodyPart]);

  // Programs: offline (or catalog not loaded) → the downloaded exercises, which have photos + how-to.
  const programSource = program
    ? pickOfflineSource({ online, liveOk: catalogSource !== 'local', hasDownload: Boolean(offlineCopy?.exercises?.length) })
    : null;

  const list = useMemo(() => {
    if (session?.exercises?.length) return session.exercises;
    if (program && programSource === 'download') return offlineCopy.exercises;
    if (program) {
      return program.exerciseIds.map((id) => lookupExercise(id, catalog) || getExercise(id)).filter(Boolean);
    }
    if (remoteRows.length) return remoteRows;
    const needle = query.trim().toLowerCase();
    const base = catalog;
    if (!needle) return base;
    return base.filter((item) =>
      `${item.name} ${item.focus?.join(' ') || ''} ${item.equipment || ''}`.toLowerCase().includes(needle)
    );
  }, [session, program, programSource, offlineCopy, catalog, query, getExercise, remoteRows]);

  const startAll = () => {
    if (!list.length) return;
    if (session?.exercises) rememberExercises(session.exercises);
    navigation.navigate('Player', {
      exerciseIds: list.map((item) => item.id),
      moves: session?.moves || (program ? programMoves(program, getExercise) : programMoves({ exerciseIds: list.map((item) => item.id) }, getExercise)),
      startIndex: 0,
      programId: session?.id || program?.id,
    });
  };

  // Download for offline: exercise list, sets/reps, how-to + GIFs/photos (+ clip media on the phone).
  const downloadThis = () =>
    dl.run(async () => {
      const moves = session?.moves || programMoves(program, getExercise);
      await downloadWorkout(workoutSnapshot({ session, program, exercises: list, moves }));
    });
  const removeThis = () => dl.run(() => removeWorkoutDownload(refId));
  const usingOffline = Boolean(session?.offline) || programSource === 'download';

  return (
    <GlassScreen>
      {program || session ? (
        <TouchableOpacity onPress={() => navigation.goBack()} className="mb-1 flex-row items-center gap-1">
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          <Text className="font-semibold text-ink">Programs</Text>
        </TouchableOpacity>
      ) : (
        <CatalogHeader placeholder="Search ExerciseDB..." activeId="exercises" onQueryChange={setQuery} />
      )}

      <SectionTitle className={program || session ? 'mt-2' : 'mt-[18px]'}>
        {session?.name || program?.name || 'Exercises'}
      </SectionTitle>
      <Text className="-mt-1 mb-3 text-[13px] text-muted">
        {sessionError
          ? sessionError
          : usingOffline
          ? `${list.length} moves · downloaded copy (offline)`
          : session
          ? `${list.length} moves · ${session.source === 'exercisedb' ? 'ExerciseDB' : 'exercise library'} · ${session.meta || 'tap one to preview'}`
          : program
          ? `${list.length} moves • tap one to preview`
          : catalogLoading
            ? 'Loading exercise photos…'
            : apiNote ||
              (catalogSource === 'exercisedb'
                ? `${list.length} moves · ExerciseDB`
                : catalogSource === 'open'
                  ? `${list.length} moves · photos included, no API key`
                  : catalogError || `${list.length} local moves`)}
      </Text>

      {!program && !session ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          <View className="flex-row gap-2 pb-2">
            <TouchableOpacity
              className={`rounded-full px-3 py-2 ${!bodyPart ? 'bg-accent' : 'bg-surface'}`}
              onPress={() => {
                setBodyPart('');
                setRemoteRows([]);
              }}
            >
              <Text className={`text-xs font-bold ${!bodyPart ? 'text-white' : 'text-ink'}`}>All</Text>
            </TouchableOpacity>
            {bodyParts.map((part) => {
              const on = bodyPart === part;
              return (
                <TouchableOpacity
                  key={part}
                  className={`rounded-full px-3 py-2 ${on ? 'bg-accent' : 'bg-surface'}`}
                  onPress={() => setBodyPart(on ? '' : part)}
                >
                  <Text className={`text-xs font-bold capitalize ${on ? 'text-white' : 'text-ink'}`}>{part}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      ) : null}

      {busy ? <ActivityIndicator color="#FF6A00" className="mb-3" /> : null}

      {list.map((exercise) => {
        const level =
          (exercise.duration || 40) <= 30 ? 'Easy' : (exercise.duration || 40) <= 45 ? 'Medium' : 'Hard';
        return (
          <WorkoutListRow
            key={exercise.id}
            image={exercise.gifUrl}
            title={exercise.name}
            meta={`${exercise.duration || 40}s · ${(exercise.focus || []).join(', ') || 'move'}`}
            level={level}
            onPress={() =>
              navigation.navigate('ExerciseDetail', { exerciseId: exercise.id, programId: session?.id || program?.id })
            }
          />
        );
      })}

      <View className="mt-3 gap-3">
        {(session || program) && list.length ? (
          <DownloadButton dl={{ ...dl, remove: removeThis }} onDownload={downloadThis} />
        ) : null}
        <OrangeStartBar
          title={session || program ? 'Start course' : 'Start first exercise'}
          onPress={startAll}
          disabled={!list.length}
        />
      </View>
    </GlassScreen>
  );
}
