import React, { useEffect, useRef } from 'react';
import { Animated, ImageBackground, StatusBar, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { glass } from '../context/ThemeContext';

/** Lifestyle plates — real gym / food / campus atmosphere only. */
export const TAB_PLATES = {
  home: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1400&auto=format&fit=crop&q=80',
  meals: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1400&auto=format&fit=crop&q=80',
  workout: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1400&auto=format&fit=crop&q=80',
  community: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&auto=format&fit=crop&q=80',
  profile: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&auto=format&fit=crop&q=80',
  auth: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1400&auto=format&fit=crop&q=80',
};

export const HOME_BACKDROP = TAB_PLATES.home;

/** Frosted glass on photo — single recipe (see ThemeContext.glass). */
export const PHOTO_GLASS = {
  backgroundColor: glass.fill,
  borderColor: glass.border,
  borderWidth: glass.borderWidth,
};

/** Photo + heavy fade so type/CTAs stay primary over busy imagery. */
export function PhotoBackdrop({ plate = 'home' }) {
  const uri = TAB_PLATES[plate] || TAB_PLATES.home;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <ImageBackground source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover">
        <LinearGradient
          colors={['rgba(14,10,8,0.62)', 'rgba(14,10,8,0.86)', 'rgba(14,10,8,0.97)']}
          locations={[0, 0.42, 1]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>
    </View>
  );
}

/** Full-screen shell with tab plate + light status bar + soft enter fade. */
export default function PhotoShell({ children, style, plate = 'home' }) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [plate, fade]);

  return (
    <View style={[styles.root, style]}>
      <PhotoBackdrop plate={plate} />
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      <Animated.View style={[styles.body, { opacity: fade }]}>{children}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0E0A08',
  },
  body: {
    flex: 1,
  },
});
