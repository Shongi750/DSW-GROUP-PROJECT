import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NotificationsScreen({ navigation }) {
  return (
    <View style={styles.page}>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.copy}>Your weekly meal plan is ready.</Text>
      <TouchableOpacity onPress={() => navigation.navigate('MealPlanning')}>
        <Text style={styles.link}>Back to meal plan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F7FAFC' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  copy: { fontSize: 14, color: '#5A4136', marginBottom: 16 },
  link: { color: '#A04100', fontWeight: '700' },
});
