import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GlassScreen } from '../components/glass';
import PrimaryButton from '../components/button';
import CookVideo from '../../meals/components/CookVideo';
import { getProgram } from '../data/programs';
import { loadSavedClips, removeSavedClip, saveClipOffline, snapshotClip } from '../lib/clipStore';

export default function ClipScreen() {
  const navigation = useNavigation();
  const clip = useRoute().params?.clip;
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (!clip?.id) return;
    loadSavedClips().then((saved) => setDownloaded(Boolean(saved[clip.id])));
  }, [clip?.id]);

  if (!clip) return null;

  const snap = snapshotClip(clip);
  const program = clip.programId ? getProgram(clip.programId) : null;
  const moves = snap.moves?.length ? snap.moves : program?.moves;
  const exerciseIds = snap.exerciseIds?.length ? snap.exerciseIds : program?.exerciseIds;

  return (
    <GlassScreen>
      <Text className="text-[11px] font-extrabold uppercase text-accent">
        {downloaded ? 'Saved offline' : clip.kind === 'technique' ? 'Technique' : 'Challenge'}
      </Text>
      <Text className="mt-1 text-[26px] font-extrabold text-ink">{clip.title}</Text>
      <Text className="mb-4 mt-2 leading-5 text-muted">{clip.blurb}</Text>
      <CookVideo video={{ youtubeId: clip.youtubeId, title: clip.title, channel: clip.creator }} mealTitle={clip.title} />
      <View className="mt-6">
        {moves?.length || exerciseIds?.length ? (
          <PrimaryButton
            title="START THIS"
            icon="play"
            onPress={() =>
              navigation.navigate('Player', {
                exerciseIds: exerciseIds || moves.map((move) => move.id),
                moves,
                startIndex: 0,
                programId: clip.programId || clip.id,
              })
            }
          />
        ) : null}
        <View className="mt-3">
          <PrimaryButton
            title={downloaded ? 'REMOVE DOWNLOAD' : 'SAVE FOR OFFLINE'}
            icon={downloaded ? 'trash-outline' : 'download-outline'}
            onPress={async () => {
              if (downloaded) {
                await removeSavedClip(clip.id);
                setDownloaded(false);
                return;
              }
              await saveClipOffline(clip);
              setDownloaded(true);
            }}
          />
        </View>
        <View className="mt-3">
          <PrimaryButton title="BACK" icon="arrow-back" onPress={() => navigation.goBack()} />
        </View>
      </View>
    </GlassScreen>
  );
}
