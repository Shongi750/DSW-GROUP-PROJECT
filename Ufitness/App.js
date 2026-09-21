import 'react-native-gesture-handler';
import React from 'react';
import { Platform, View } from 'react-native';
import { vars } from 'nativewind';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';

if (Platform.OS === 'web') {
  enableScreens(false);
}

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
          '--color-glass': isDark ? 'rgba(30,28,27,0.94)' : 'rgba(255,255,255,0.86)',
        }),
      ]}
    >
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <RootNavigator />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <ThemeProvider>
        <AppProvider>
          <ThemedApp />
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
