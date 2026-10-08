import React, { useState } from 'react';
import { Image, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors, radius } from '../constants/theme';
import { useLocalMedia } from '../../../lib/downloads/downloadsStore';
import { useOnline } from '../../../lib/autoSync';

function searchUrl(video, mealTitle) {
  const query = video.query || mealTitle || video.title;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

// A cook video that is a real file link (mp4): plays the downloaded copy when there is one.
function FileVideo({ url }) {
  const uri = useLocalMedia(url);
  const player = useVideoPlayer(uri, (next) => {
    next.loop = false;
  });
  return <VideoView player={player} style={styles.player} nativeControls contentFit="contain" />;
}

export default function CookVideo({ video, mealTitle, label, moreLabel }) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const online = useOnline();
  const youtubeThumb = video?.youtubeId ? `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg` : null;
  const thumb = useLocalMedia(youtubeThumb); // saved thumbnail when the recipe is downloaded
  if (!video?.youtubeId && !video?.url) return null;

  if (video.url) {
    return (
      <View style={styles.wrap}>
        <FileVideo url={video.url} />
        <Text style={styles.caption}>{video.title}</Text>
      </View>
    );
  }

  const embed = `https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&modestbranding=1`;
  const watch = `https://www.youtube.com/watch?v=${video.youtubeId}`;
  const more = searchUrl(video, mealTitle);

  return (
    <View style={styles.wrap}>
      {Platform.OS === 'web' && online ? (
        <View style={styles.player}>
          {React.createElement('iframe', {
            src: embed,
            title: video.title,
            style: {
              border: 0,
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            },
            allow:
              'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen',
            allowFullScreen: true,
          })}
        </View>
      ) : (
        <Pressable onPress={() => Linking.openURL(watch)} style={styles.player}>
          {thumbFailed ? null : (
            <Image
              source={{ uri: thumb }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              onError={() => setThumbFailed(true)}
            />
          )}
          <View style={styles.play}>
            <Ionicons name="play-circle" size={64} color={colors.white} />
          </View>
        </Pressable>
      )}
      <Text style={styles.caption}>{video.title}</Text>
      {!online ? (
        <Text style={styles.channel}>You are offline — YouTube videos need internet. The steps above work offline.</Text>
      ) : null}
      <Text style={styles.channel}>
        {label ||
          `Cook-along for this meal · ${video.channel} on YouTube. Numbered steps above still work if campus Wi‑Fi blocks the video.`}
      </Text>
      <Pressable onPress={() => Linking.openURL(more)} style={styles.more}>
        <Ionicons name="logo-youtube" size={16} color="#FF0000" />
        <Text style={styles.moreText}>
          {moreLabel || `More videos of ${mealTitle || 'this meal'}`}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  player: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: '#111',
    position: 'relative',
  },
  play: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  caption: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  channel: {
    marginTop: 2,
    fontSize: 12,
    color: colors.muted,
  },
  more: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moreText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textDecorationLine: 'underline',
  },
});
