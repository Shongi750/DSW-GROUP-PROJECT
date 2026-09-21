import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { GlassCard, GlassScreen } from '../components/glass';
import SectionTitle from '../components/sectiontitle';
import PrimaryButton from '../components/button';
import { PLATFORMS, GOAL_MUSIC, MOOD_MUSIC, getPlatform } from '../data/music';
import { openSearch, openSavedLink, isLikelyPlaylistUrl } from '../lib/music';

export default function MusicScreen({ navigation }) {
  const { profile, setMusicPlatform, saveMusicLink, setMusicAutoOpen } = useApp();
  const platformId = profile.musicPlatform || 'spotify';
  const platform = getPlatform(platformId);
  const savedLink = profile.musicLinks?.[platformId] || '';
  const [link, setLink] = useState(savedLink);
  const [message, setMessage] = useState('');
  const goalMusic = GOAL_MUSIC[profile.goal] || GOAL_MUSIC.hypertrophy;

  const choosePlatform = (id) => {
    setMusicPlatform(id);
    setLink(profile.musicLinks?.[id] || '');
    setMessage('');
  };

  const save = () => {
    if (link && !isLikelyPlaylistUrl(link)) {
      setMessage('That does not look like a link. Paste the full https:// playlist URL.');
      return;
    }
    saveMusicLink(platformId, link);
    setMessage(link ? `Saved. Workouts will open this in ${platform.name}.` : 'Cleared your saved playlist.');
  };

  const play = async (query) => {
    const opened = query ? await openSearch(platformId, query) : await openSavedLink(platformId, savedLink);
    if (!opened) setMessage(`Could not open ${platform.name}. Is it installed?`);
  };

  return (
    <GlassScreen>
      <View className="mb-2 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-ink">Music</Text>
        <View className="w-9" />
      </View>

      <Text className="text-[28px] font-extrabold text-ink">Your music, your app</Text>
      <Text className="mb-4 mt-2 leading-5 text-muted">
        Playback stays in the app you already pay for, so your library and account work as normal. Pick a service and
        we will open it when your workout starts; the workout keeps running here.
      </Text>

      <SectionTitle>Service</SectionTitle>
      <View className="flex-row flex-wrap gap-2">
        {PLATFORMS.map((item) => {
          const active = item.id === platformId;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => choosePlatform(item.id)}
              className={`flex-row items-center gap-2 rounded-full border px-4 py-2.5 ${
                active ? 'border-accent bg-accent/15' : 'border-black/10 bg-surface'
              }`}
            >
              <Ionicons name={item.icon} size={16} color={active ? '#BA4A0C' : '#8E8E93'} />
              <Text className={`font-semibold ${active ? 'text-ink' : 'text-muted'}`}>{item.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <SectionTitle>Your playlist</SectionTitle>
      <GlassCard>
        <Text className="text-[13px] leading-5 text-muted">{platform.linkHint}</Text>
        <TextInput
          value={link}
          onChangeText={setLink}
          placeholder="https://..."
          placeholderTextColor="#6B6B70"
          autoCapitalize="none"
          autoCorrect={false}
          className="mt-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink"
          style={{ color: '#1A1A1A' }}
        />
        {message ? <Text className="mt-2 text-[13px] text-accent">{message}</Text> : null}
        <View className="mt-3 flex-row gap-2">
          <View className="flex-1">
            <PrimaryButton title="Save" icon="bookmark" onPress={save} />
          </View>
          {savedLink ? (
            <TouchableOpacity
              onPress={() => play(null)}
              className="flex-1 items-center justify-center rounded-full border border-black/10 bg-surface py-3.5"
            >
              <Text className="font-bold text-ink">Open saved</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </GlassCard>

      <SectionTitle>Matched to your goal</SectionTitle>
      <GlassCard onPress={() => play(goalMusic.query)}>
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-accent/20">
            <Ionicons name="play" size={18} color="#BA4A0C" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-ink">{goalMusic.label}</Text>
            <Text className="mt-1 text-[13px] text-muted">
              Opens a "{goalMusic.query}" search in {platform.name}
            </Text>
          </View>
        </View>
      </GlassCard>

      <SectionTitle>By part of the session</SectionTitle>
      {MOOD_MUSIC.map((item) => (
        <GlassCard key={item.id} className="mb-3" onPress={() => play(item.query)}>
          <View className="flex-row items-center justify-between">
            <Text className="font-bold text-ink">{item.label}</Text>
            <Ionicons name="open-outline" size={18} color="#8E8E93" />
          </View>
        </GlassCard>
      ))}

      <GlassCard className="mt-2">
        <View className="flex-row items-center justify-between">
          <View className="mr-3 flex-1">
            <Text className="font-bold text-ink">Open music when a workout starts</Text>
            <Text className="mt-1 text-[13px] leading-5 text-muted">
              Launches {platform.name} as the player opens. Come back to this app and the timer is still running.
            </Text>
          </View>
          <Switch
            value={Boolean(profile.musicAutoOpen)}
            onValueChange={setMusicAutoOpen}
            trackColor={{ true: '#BA4A0C', false: '#E0E0E0' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </GlassCard>
    </GlassScreen>
  );
}
