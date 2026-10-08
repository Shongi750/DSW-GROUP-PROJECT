import {
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { CAMPUSES } from '../../data/onboardingOptions';
import SelectionCard from '../../components/SelectionCard';
import PrimaryButton from '../../components/PrimaryButton';
import ProgressIndicator from '../../components/ProgressIndicator';

// Last step of the main onboarding — which UJ campus they're on
export default function CampusScreen({ navigation, data, updateField, onFinish }) {
  const selected = data.campus;

  async function handleFinish() {
    if (!selected) {
      Alert.alert('Please select an option before continuing.');
      return;
    }
    // onFinish saves the whole profile and jumps into the app
    if (onFinish) {
      await onFinish();
      return;
    }
    navigation.navigate('Profile');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ProgressIndicator current={6} total={6} />
      <Text style={styles.title}>Which UJ campus do you attend?</Text>

      {CAMPUSES.map(function (campus) {
        return (
          <SelectionCard
            key={campus.value}
            label={campus.label}
            selected={selected === campus.value}
            onPress={function () {
              updateField('campus', campus.value);
            }}
          />
        );
      })}

      <PrimaryButton title="Finish" onPress={handleFinish} />

      <TouchableOpacity style={styles.backButton} onPress={function () { navigation.goBack(); }}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingBottom: 100, backgroundColor: '#f9f9f9' },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#666',
  },
});
