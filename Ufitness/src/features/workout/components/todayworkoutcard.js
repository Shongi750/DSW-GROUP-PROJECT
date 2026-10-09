import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { GlassCard } from './glass';
import PrimaryButton from './button';

function MoveThumb({ uri }) {
  if (!uri) {
    return (
      <View className="h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
        <Ionicons name="barbell-outline" size={20} color="#FF6A00" />
      </View>
    );
  }
  return (
    <Image
      source={{ uri: uri }}
      style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#111' }}
      contentFit="cover"
    />
  );
}

// "Today's workout" layout: weekday heading, then the moves you are about to do, then Start.
export default function TodayWorkoutCard({ preview, eyebrow, onStart, onRestPress }) {
  if (!preview) return null;
  const training = preview.type === 'train';

  return (
    <GlassCard className={training ? 'border-accent/30' : ''} onPress={training ? undefined : onRestPress}>
      <View className="flex-row items-end justify-between">
        <View className="flex-1">
          <Text className="text-[11px] font-extrabold tracking-widest text-accent">
            {(preview.weekday + ' · ' + preview.dateLabel).toUpperCase()}
          </Text>
          <Text className="mt-1 text-[24px] font-display uppercase text-ink">{preview.title}</Text>
          {eyebrow ? <Text className="mt-1 text-[13px] text-muted">{eyebrow}</Text> : null}
        </View>
        {training ? (
          <View className="ml-3 items-end">
            <Text className="text-lg font-bold text-ink">~{preview.minutes} min</Text>
            <Text className="text-[12px] text-muted">{preview.totalMoves} moves</Text>
          </View>
        ) : null}
      </View>

      {training ? (
        <>
          {preview.makeup ? (
            <Text className="mt-2 text-[12px] font-bold text-accent">Makeup session</Text>
          ) : null}
          <View className="mb-4 mt-4 gap-3">
            {preview.items.map(function (item) {
              return (
                <View key={item.key} className="flex-row items-center gap-3">
                  <MoveThumb uri={item.image} />
                  <View className="flex-1">
                    <Text className="text-[15px] font-bold text-ink" numberOfLines={1}>
                      {item.number}. {item.name}
                    </Text>
                    <Text className="mt-0.5 text-[12px] text-muted" numberOfLines={1}>
                      {item.meta}
                      {item.focus ? ' · ' + item.focus : ''}
                      {item.swapped ? ' · swapped for your injury' : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
            {preview.moreCount ? (
              <Text className="text-[13px] text-muted">+{preview.moreCount} more in the session</Text>
            ) : null}
          </View>
          <PrimaryButton title="Start workout" onPress={onStart} />
        </>
      ) : (
        <Text className="mt-2 text-[13px] leading-5 text-muted">
          {preview.type === 'done'
            ? 'Session logged. Tap to see your week.'
            : preview.nextTrainDay
              ? 'Recover today. Next session: ' + preview.nextTrainDay + '.'
              : 'Recover today.'}
        </Text>
      )}
    </GlassCard>
  );
}
