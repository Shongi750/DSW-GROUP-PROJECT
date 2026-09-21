import React, { useMemo, useState } from 'react';
import { coachPrograms, newCoachPrograms } from '../data/programs';
import CatalogHeader from '../components/catalogheader';
import SectionTitle from '../components/sectiontitle';
import ProgramGrid from '../components/programgrid';
import { GlassScreen } from '../components/glass';

function matchesQuery(program, query) {
  const haystack = `${program.overlayTitle} ${program.overlaySubtitle} ${program.name}`.toLowerCase();
  return haystack.includes(query);
}

export default function CoachingScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();

  const fromCoaches = useMemo(
    () => (normalized ? coachPrograms.filter((item) => matchesQuery(item, normalized)) : coachPrograms),
    [normalized]
  );
  const newest = useMemo(
    () => (normalized ? newCoachPrograms.filter((item) => matchesQuery(item, normalized)) : newCoachPrograms),
    [normalized]
  );

  const openProgram = (program) => {
    navigation.navigate('Exercises', { programId: program.id, title: program.name });
  };

  return (
    <GlassScreen>
      <CatalogHeader placeholder="Search coaches..." activeId="coaching" onQueryChange={setQuery} />
      <SectionTitle className="mt-[18px]">Programs from Coaches</SectionTitle>
      <ProgramGrid programs={fromCoaches} onPressProgram={openProgram} />
      <SectionTitle>New Coach Programs</SectionTitle>
      <ProgramGrid programs={newest} onPressProgram={openProgram} />
    </GlassScreen>
  );
}
