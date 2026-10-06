// src/features/progress/services/progressStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const WORKOUT_LOGS_KEY = '@ufitness_workout_logs';

export async function saveWorkoutLog(logData) {
  try {
    const existing = await getStoredWorkoutLogs();
    const updated = [logData, ...existing];
    await AsyncStorage.setItem(WORKOUT_LOGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to save workout log:', error);
    return [];
  }
}

export async function getStoredWorkoutLogs() {
  try {
    const data = await AsyncStorage.getItem(WORKOUT_LOGS_KEY);
    return data ? JSON.parse(data) : [
      // Default fallback mock logs for your presentation demo
      { id: '1', title: 'Full Body Ignition', date: '2026-10-04', durationMinutes: 35 },
      { id: '2', title: 'Core & Upper Power', date: '2026-10-02', durationMinutes: 30 },
      { id: '3', title: 'Full Body Ignition', date: '2026-09-30', durationMinutes: 40 }
    ];
  } catch (error) {
    console.error('Failed to fetch workout logs:', error);
    return [];
  }
}