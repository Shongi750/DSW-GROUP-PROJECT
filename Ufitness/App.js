import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { vars } from 'nativewind';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Anton_400Regular } from '@expo-google-fonts/anton';
import { AppProvider, useApp } from './src/context/AppContext';
import { ActiveSessionProvider } from './src/context/ActiveSessionContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import SplashScreen from './src/screens/SplashScreen';
import InspoBackground from './src/components/InspoBackground';

// On web, native screen containers cause weird blank flashes — turn them off
if (Platform.OS === 'web') {
  enableScreens(false);
}

// How long the splash stays up (even if auth is already ready)
const SPLASH_MS = 1800;
// If fonts hang (common on web), leave splash after this anyway
const FONT_WAIT_MS = 3500;
let splashStartedAt = Date.now();
let splashFinished = false;

// Theme + nav once fonts/auth are ready
function ThemedApp() {
  const { isDark, colors, navigationTheme } = useTheme();
  return (
    <View
      style={[
        { flex: 1, backgroundColor: colors.background },
        vars({
          '--color-background': colors.background,
          '--color-surface': colors.overlay,
          '--color-ink': colors.text,
          '--color-muted': colors.muted,
          '--color-glass': isDark ? 'rgba(26,22,18,0.92)' : 'rgba(255,255,255,0.94)',
        }),
      ]}
    >
      <InspoBackground />
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <RootNavigator />
      </NavigationContainer>
    </View>
  );
}

// Holds the splash until fonts load AND the timer finishes AND AppContext is done booting
function BootGate({ fontsReady }) {
  const { booting } = useApp();
  const [, setTick] = useState(0);

  // Fresh timer on mount (helps after hot reload / stuck web sessions)
  useEffect(function () {
    splashStartedAt = Date.now();
    splashFinished = false;
  }, []);

  // re-render every 200ms so the splash timer can expire
  useEffect(function () {
    if (splashFinished) return undefined;
    const timer = setInterval(function () {
      setTick(function (n) {
        return n + 1;
      });
    }, 200);
    return function () {
      clearInterval(timer);
    };
  }, []);

  const stillTiming = !splashFinished && Date.now() - splashStartedAt < SPLASH_MS;
  const holdSplash = !fontsReady || (!splashFinished && (booting || stillTiming));

  if (fontsReady && !booting && Date.now() - splashStartedAt >= SPLASH_MS) {
    splashFinished = true;
  }

  if (holdSplash) {
    return (
      <View style={{ flex: 1, width: '100%', height: '100%', backgroundColor: '#060405' }}>
        <SplashScreen />
      </View>
    );
  }

  return <ThemedApp />;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ Anton_400Regular: Anton_400Regular });
  const [fontTimedOut, setFontTimedOut] = useState(false);

  // Web sometimes never flips fontsLoaded — don't trap the user on splash
  useEffect(function () {
    const t = setTimeout(function () {
      setFontTimedOut(true);
    }, FONT_WAIT_MS);
    return function () {
      clearTimeout(t);
    };
  }, []);

  const fontsReady = fontsLoaded || Boolean(fontError) || fontTimedOut;

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#0E0A08' }}>
      <ThemeProvider>
        <AppProvider>
          {/* ActiveSessionProvider wraps everything so the live workout pill works on Home */}
          <ActiveSessionProvider>
            <BootGate fontsReady={fontsReady} />
          </ActiveSessionProvider>
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
