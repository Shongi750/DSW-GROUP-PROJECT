import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

// Shown while fonts and auth state load — keeps the app from flashing a blank screen.
const LOGO = require('../../assets/splash-logo.png');

function PulseRing({ delay }) {
  const scale = useRef(new Animated.Value(0.08)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(function startPulse() {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 2600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(scale, { toValue: 0.08, duration: 0, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.7, duration: 0, useNativeDriver: true }),
      ])
    );
    animation.start();
    return function stopPulse() {
      animation.stop();
    };
  }, [delay, opacity, scale]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.ring, { opacity, transform: [{ scale }] }]}
    />
  );
}

function BounceDot({ delay }) {
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(function startBounce() {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(y, { toValue: -6, duration: 400, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(y, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.4, duration: 400, useNativeDriver: true }),
        ]),
        Animated.delay(200),
      ])
    );
    animation.start();
    return function stopBounce() {
      animation.stop();
    };
  }, [delay, opacity, y]);

  return <Animated.View style={[styles.dot, { opacity, transform: [{ translateY: y }] }]} />;
}

export default function SplashScreen() {
  const logo = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const tag = useRef(new Animated.Value(0)).current;
  const dots = useRef(new Animated.Value(0)).current;

  useEffect(function playIntro() {
    Animated.parallel([
      Animated.sequence([
        Animated.delay(250),
        Animated.spring(logo, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
      ]),
      Animated.timing(word, { toValue: 1, duration: 700, delay: 1050, useNativeDriver: true }),
      Animated.timing(tag, { toValue: 1, duration: 700, delay: 1350, useNativeDriver: true }),
      Animated.timing(dots, { toValue: 1, duration: 500, delay: 1700, useNativeDriver: true }),
    ]).start();
  }, [dots, logo, tag, word]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#2A1508', '#170C05', '#0A0A0A', '#0A0A0A']}
        locations={[0, 0.4, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.35)', 'transparent', 'transparent', 'rgba(0,0,0,0.55)']}
        locations={[0, 0.25, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.center}>
        <View style={styles.logoSlot}>
          <PulseRing delay={0} />
          <PulseRing delay={650} />
          <PulseRing delay={1300} />
          <Animated.View
            style={[
              styles.logowrap,
              {
                opacity: logo,
                transform: [
                  {
                    scale: logo.interpolate({
                      inputRange: [0, 0.6, 1],
                      outputRange: [0.4, 1.08, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image source={LOGO} style={[styles.logo, styles.logoWeb]} resizeMode="contain" />
          </Animated.View>
        </View>
        <Animated.View
          style={[
            styles.wordmark,
            {
              opacity: word,
              transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            },
          ]}
        >
          <Text style={styles.u}>U</Text>
          <Text style={styles.fitness}>FITNESS</Text>
        </Animated.View>
        <Animated.View
          style={[
            styles.accentLineWrap,
            {
              opacity: tag,
              transform: [{ scaleX: tag.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }],
            },
          ]}
        >
          <View style={styles.accentLine} />
        </Animated.View>
        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: tag,
              transform: [{ translateY: tag.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            },
          ]}
        >
          MOVE. CAMPUS. TOGETHER.
        </Animated.Text>
      </View>
      <Animated.View style={[styles.dots, { opacity: dots }]}>
        <BounceDot delay={0} />
        <BounceDot delay={150} />
        <BounceDot delay={300} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#060405',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSlot: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
  },
  ring: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    borderWidth: 1.5,
    borderColor: '#F07C1D',
  },
  logowrap: {
    width: 220,
    height: 220,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoWeb: Platform.OS === 'web' ? { opacity: 1 } : {},
  wordmark: {
    flexDirection: 'row',
    marginTop: 6,
  },
  u: {
    color: '#FFFFFF',
    fontFamily: 'Anton_400Regular',
    fontSize: 40,
    letterSpacing: 1.5,
  },
  fitness: {
    color: '#FF6A00',
    fontFamily: 'Anton_400Regular',
    fontSize: 40,
    letterSpacing: 1.5,
  },
  accentLineWrap: {
    marginTop: 14,
    width: 56,
    alignItems: 'center',
  },
  accentLine: {
    width: 56,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FF6A00',
  },
  tagline: {
    marginTop: 12,
    fontSize: 12,
    letterSpacing: 2.6,
    color: '#A3A3A3',
    fontWeight: '700',
  },
  dots: {
    position: 'absolute',
    bottom: 70,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F07C1D',
  },
});
