import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './glass';

// One curated Spotify playlist: coloured cover tile + name + vibe.
export default function SpotifyPlaylistCard({ playlist, onPress, note }) {
  return (
    <GlassCard className="mb-3" onPress={onPress}>
      <View className="flex-row items-center gap-3">
        <View
          style={{ backgroundColor: playlist.color, width: 48, height: 48, borderRadius: 10 }}
          className="items-center justify-center"
        >
          <Ionicons name={playlist.icon} size={22} color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-ink">{playlist.name}</Text>
          <Text className="mt-0.5 text-[12px] text-muted">{note || playlist.label + ' · Spotify playlist'}</Text>
        </View>
        <Ionicons name="logo-spotify" size={22} color="#1DB954" />
      </View>
    </GlassCard>
  );
}
