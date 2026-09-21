import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';

export default function WorkoutClipCard({ clip, compact = false }) {
  const uri = clip?.videoUri;
  const player = useVideoPlayer(uri || null, (next) => {
    next.loop = true;
    next.muted = true;
    if (uri) next.play();
  });
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (!player || !uri) return undefined;
    try {
      player.replace(uri);
      player.loop = true;
      player.play();
    } catch {
      /* already loaded */
    }
    return undefined;
  }, [player, uri]);

  useEffect(() => {
    if (!player) return undefined;
    player.muted = muted;
    return undefined;
  }, [muted, player]);

  if (!uri) return null;

  const song = [clip.musicTitle, clip.musicArtist].filter(Boolean).join(' · ');

  return (
    <Pressable
      style={[styles.frame, compact && styles.frameCompact]}
      onPress={() => {
        const next = !muted;
        setMuted(next);
        if (player) {
          player.muted = next;
          player.play();
        }
      }}
    >
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      <View style={styles.scrim} />
      <View style={styles.soundBadge}>
        <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={14} color="#fff" />
        <Text style={styles.soundText}>{muted ? 'Tap for sound' : 'Playing'}</Text>
      </View>
      <View style={styles.sticker}>
        <View style={styles.disc}>
          <Ionicons name="musical-notes" size={14} color="#111" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.stickerLabel}>Original audio</Text>
          <Text style={styles.stickerSong} numberOfLines={1}>
            {song || 'Workout clip'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 9 / 14,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111',
    marginBottom: 8,
  },
  frameCompact: {
    aspectRatio: 9 / 12,
    marginBottom: 12,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    top: '62%',
    backgroundColor: 'transparent',
  },
  soundBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  soundText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  sticker: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  disc: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '600' },
  stickerSong: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
