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

if (Platform.OS === 'web') {
  enableScreens(false);
}

// 3200ms = 3.2 seconds
const SPLASH_MS = 6000;
let splashStartedAt = Date.now();
let splashFinished = false;

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

function BootGate({ fontsLoaded }) {
  const { booting } = useApp();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (splashFinished) return undefined;
    const timer = setInterval(() => setTick((n) => n + 1), 200);
    return () => clearInterval(timer);
  }, []);

  const holdSplash =
    !fontsLoaded || (!splashFinished && (booting || Date.now() - splashStartedAt < SPLASH_MS));
  if (fontsLoaded && !booting && Date.now() - splashStartedAt >= SPLASH_MS) splashFinished = true;
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
  const [fontsLoaded] = useFonts({ Anton_400Regular });
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#0E0A08' }}>
      <ThemeProvider>
        <AppProvider>
          <ActiveSessionProvider>
            <BootGate fontsLoaded={fontsLoaded} />
          </ActiveSessionProvider>
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
