import React from 'react';
import { Text, View } from 'react-native';
import { StartCard, StartCardRow } from './startcard';

function thumb(youtubeId) {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

export default function ClipRow({ videos, onWatch, onStart, onDownload, savedIds = new Set() }) {
  if (!videos?.length) {
    return <Text className="text-muted">No challenges today. Saved ones stay below.</Text>;
  }

  return (
    <View>
      <StartCardRow>
        {videos.map((video) => {
          const downloaded = savedIds.has(video.id) || video.downloaded;
          return (
            <StartCard
              key={video.id}
              image={thumb(video.youtubeId)}
              title={video.title}
              meta={`${video.creator}${downloaded ? ' · Saved' : ''}`}
              badge={downloaded ? 'Offline' : video.kind === 'technique' ? 'Technique' : 'Challenge'}
              onPress={() => (onStart ? onStart(video) : onWatch?.(video))}
            />
          );
        })}
      </StartCardRow>
      {onDownload ? (
        <View className="mt-2 flex-row flex-wrap gap-2">
          {videos.map((video) => {
            const downloaded = savedIds.has(video.id) || video.downloaded;
            if (downloaded) return null;
            return (
              <Text
                key={`dl-${video.id}`}
                onPress={() => onDownload(video)}
                className="text-xs font-bold text-accent"
              >
                Save “{video.title}” offline
              </Text>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
