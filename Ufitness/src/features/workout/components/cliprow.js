import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './glass';

function thumb(youtubeId) {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

export default function ClipRow({ videos, onWatch, onStart, onDownload, savedIds = new Set() }) {
  if (!videos?.length) {
    return <Text className="text-muted">No challenges today. Saved ones stay below.</Text>;
  }

  return (
    <View className="gap-2.5">
      {videos.map((video) => {
        const downloaded = savedIds.has(video.id) || video.downloaded;
        return (
          <GlassCard key={video.id} onPress={() => onWatch?.(video)}>
            <View className="flex-row items-center gap-3">
              <Image source={{ uri: thumb(video.youtubeId) }} className="h-14 w-14 rounded-xl bg-black/20" />
              <View className="flex-1">
                <Text className="text-[11px] font-extrabold uppercase text-accent">
                  {downloaded ? 'Saved offline' : video.kind === 'technique' ? 'Technique' : 'Challenge'}
                </Text>
                <Text className="font-bold text-ink">{video.title}</Text>
                <Text className="mt-0.5 text-xs text-muted" numberOfLines={2}>
                  {video.creator} · {video.blurb}
                </Text>
              </View>
              <View className="items-center gap-2">
                <TouchableOpacity
                  onPress={() => onStart?.(video)}
                  className="items-center rounded-full bg-accent px-3 py-2"
                >
                  <Ionicons name="play" size={14} color="#FFFFFF" />
                  <Text className="mt-0.5 text-[10px] font-extrabold text-white">START</Text>
                </TouchableOpacity>
                {onDownload ? (
                  <TouchableOpacity onPress={() => onDownload(video)} hitSlop={8}>
                    <Ionicons
                      name={downloaded ? 'checkmark-circle' : 'download-outline'}
                      size={20}
                      color={downloaded ? '#BA4A0C' : '#8E8E93'}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </GlassCard>
        );
      })}
    </View>
  );
}
