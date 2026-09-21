import React, { useCallback, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { popularPrograms, getProgram } from '../data/programs';
import CatalogHeader from '../components/catalogheader';
import SectionTitle from '../components/sectiontitle';
import ProgramGrid from '../components/programgrid';
import ClipRow from '../components/cliprow';
import { GlassScreen } from '../components/glass';
import { useApp } from '../context/AppContext';
import { loadChallengeFeed, saveClipOffline } from '../lib/clipStore';

function matchesQuery(program, query) {
  const haystack = `${program.overlayTitle} ${program.overlaySubtitle} ${program.name} ${program.reason || ''} ${program.badge || ''}`.toLowerCase();
  return haystack.includes(query);
}

function matchesClip(clip, query) {
  return `${clip.title} ${clip.blurb} ${clip.creator}`.toLowerCase().includes(query);
}

export default function WorkoutScreen({ navigation }) {
  const { recommendations } = useApp();
  const [query, setQuery] = useState('');
  const [feed, setFeed] = useState({ date: '', today: [], saved: [] });
  const normalized = query.trim().toLowerCase();

  const reload = useCallback(() => {
    loadChallengeFeed().then(setFeed);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const popular = useMemo(
    () => (normalized ? popularPrograms.filter((item) => matchesQuery(item, normalized)) : popularPrograms),
    [normalized]
  );
  const recommended = useMemo(
    () => (normalized ? recommendations.filter((item) => matchesQuery(item, normalized)) : recommendations.slice(0, 2)),
    [normalized, recommendations]
  );

  const savedIds = useMemo(() => new Set((feed.saved || []).map((item) => item.id)), [feed.saved]);
  const today = normalized ? feed.today.filter((item) => matchesClip(item, normalized)) : feed.today;
  const saved = (normalized ? feed.saved.filter((item) => matchesClip(item, normalized)) : feed.saved)
    .filter((item) => !today.some((clip) => clip.id === item.id));

  const openProgram = (program) => {
    navigation.navigate('Exercises', { programId: program.id, title: program.name });
  };

  const startClip = (clip) => {
    const program = clip.programId ? getProgram(clip.programId) : null;
    const moves = clip.moves?.length ? clip.moves : program?.moves;
    const exerciseIds = clip.exerciseIds?.length ? clip.exerciseIds : program?.exerciseIds;
    if (!moves?.length && !exerciseIds?.length) {
      navigation.navigate('Clip', { clip });
      return;
    }
    navigation.navigate('Player', {
      exerciseIds: exerciseIds || moves.map((move) => move.id),
      moves,
      startIndex: 0,
      programId: clip.programId || clip.id,
    });
  };

  const downloadClip = async (clip) => {
    await saveClipOffline(clip);
    reload();
  };

  return (
    <GlassScreen>
      <CatalogHeader placeholder="Search programs..." activeId="programs" onQueryChange={setQuery} />
      <SectionTitle className="mt-[18px]">Popular Programs</SectionTitle>
      <ProgramGrid programs={popular} onPressProgram={openProgram} />
      <SectionTitle>Recommended for You</SectionTitle>
      <Text className="-mt-1 mb-3 text-xs text-muted">Ranked from your finished exercises and missing muscle groups.</Text>
      <ProgramGrid programs={recommended} onPressProgram={openProgram} />
      <SectionTitle>Today’s challenges</SectionTitle>
      <Text className="-mt-1 mb-3 text-xs text-muted">
        A new set each day. Community stays on Community — this column is only challenges and techniques. Download one to keep the session when Wi‑Fi is off.
      </Text>
      <ClipRow
        videos={today}
        savedIds={savedIds}
        onWatch={(clip) => navigation.navigate('Clip', { clip })}
        onStart={startClip}
        onDownload={downloadClip}
      />
      {saved.length ? (
        <>
          <SectionTitle>Saved offline</SectionTitle>
          <Text className="-mt-1 mb-3 text-xs text-muted">These stay on this phone. START still works with no data. The YouTube clip needs a connection.</Text>
          <ClipRow
            videos={saved}
            savedIds={savedIds}
            onWatch={(clip) => navigation.navigate('Clip', { clip })}
            onStart={startClip}
          />
        </>
      ) : null}
    </GlassScreen>
  );
}
