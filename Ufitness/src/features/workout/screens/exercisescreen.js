import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProgram } from '../data/programs';
import CatalogHeader from '../components/catalogheader';
import SectionTitle from '../components/sectiontitle';
import PrimaryButton from '../components/button';
import { GlassCard, GlassScreen } from '../components/glass';
import { useApp } from '../context/AppContext';
import { lookupExercise } from '../lib/exercisedb';
import { programMoves } from '../lib/session';

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

  useEffect(() => {
    if (program) return undefined;
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
  }, [query, bodyPart, hasApiKey, program, searchRemote, loadBodyPart]);

  const list = useMemo(() => {
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
  }, [program, catalog, query, getExercise, remoteRows]);

  const startAll = () => {
    if (!list.length) return;
    navigation.navigate('Player', {
      exerciseIds: list.map((item) => item.id),
      moves: program ? programMoves(program, getExercise) : programMoves({ exerciseIds: list.map((item) => item.id) }, getExercise),
      startIndex: 0,
      programId: program?.id,
    });
  };

  return (
    <GlassScreen>
      {program ? (
        <TouchableOpacity onPress={() => navigation.goBack()} className="mb-1 flex-row items-center gap-1">
          <Ionicons name="chevron-back" size={20} color="#1A1A1A" />
          <Text className="font-semibold text-ink">Programs</Text>
        </TouchableOpacity>
      ) : (
        <CatalogHeader placeholder="Search ExerciseDB..." activeId="exercises" onQueryChange={setQuery} />
      )}

      <SectionTitle className={program ? 'mt-2' : 'mt-[18px]'}>
        {program ? program.name : 'Exercises'}
      </SectionTitle>
      <Text className="-mt-1 mb-3 text-[13px] text-muted">
        {program
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

      {!program ? (
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

      {busy ? <ActivityIndicator color="#BA4A0C" className="mb-3" /> : null}

      {list.map((exercise) => {
        const done = profile.completedExerciseIds.includes(exercise.id);
        return (
          <GlassCard
            key={exercise.id}
            className="mb-2.5"
            onPress={() =>
              navigation.navigate('ExerciseDetail', { exerciseId: exercise.id, programId: program?.id })
            }
          >
            <View className="flex-row items-center gap-3">
              {exercise.gifUrl ? (
                <Image source={{ uri: exercise.gifUrl }} className="h-11 w-11 rounded-xl bg-accent/20" />
              ) : (
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-accent/20">
                  <Ionicons name="accessibility" size={22} color="#BA4A0C" />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-base font-bold text-ink">{exercise.name}</Text>
                <Text className="mt-0.5 text-[13px] text-muted">
                  {exercise.duration}s • {(exercise.focus || []).join(', ')}
                </Text>
              </View>
              {done ? <Ionicons name="checkmark-circle" size={20} color="#BA4A0C" /> : null}
              <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
            </View>
          </GlassCard>
        );
      })}

      <View className="mt-3">
        <PrimaryButton title={program ? 'Start program' : 'Start first exercise'} onPress={startAll} />
      </View>
    </GlassScreen>
  );
}
