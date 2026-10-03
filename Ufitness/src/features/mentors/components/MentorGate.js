import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../../context/AppContext';
import { display, spacing } from '../../../context/ThemeContext';
import InspoBackground from '../../../components/InspoBackground';

/** Blocks mentor-only screens for accounts without the mentor role. */
export default function MentorGate({ children }) {
  const { isMentor } = useApp();
  if (isMentor) return children;
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <InspoBackground plate="community" />
      <View style={styles.locked}>
        <Text style={styles.title}>Mentors only</Text>
        <Text style={styles.copy}>
          Accept a campus mentor invite from Profile to unlock this. Your student tabs stay the same.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  locked: { flex: 1, padding: spacing.section, justifyContent: 'center' },
  title: { ...display, fontSize: 28, color: '#FFFFFF', marginBottom: 8 },
  copy: { fontSize: 15, color: '#C9C9C9', lineHeight: 22 },
});
