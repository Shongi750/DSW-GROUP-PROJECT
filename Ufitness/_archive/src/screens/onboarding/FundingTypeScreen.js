import { Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { FUNDING_TYPES } from '../../data/onboardingOptions';
import SelectionCard from '../../components/SelectionCard';
import PrimaryButton from '../../components/PrimaryButton';
import ProgressIndicator from '../../components/ProgressIndicator';

// Step 5 — NSFAS / self-funded / etc (used for buddy matching context)
export default function FundingTypeScreen({ navigation, data, updateField }) {
  const selected = data.fundingType;

  function handleNext() {
    if (!selected) {
      Alert.alert('Please select an option before continuing.');
      return;
    }
    navigation.navigate('Campus');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ProgressIndicator current={5} total={6} />
      <Text style={styles.title}>How do you fund your studies?</Text>

      {FUNDING_TYPES.map(function (type) {
        return (
          <SelectionCard
            key={type}
            label={type}
            selected={selected === type}
            onPress={function () {
              updateField('fundingType', type);
            }}
          />
        );
      })}

      <PrimaryButton title="Next" onPress={handleNext} />
      <TouchableOpacity style={styles.backButton} onPress={function () { navigation.goBack(); }}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingBottom: 100, backgroundColor: '#f9f9f9' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
  backButton: { marginTop: 16, paddingVertical: 10, alignItems: 'center' },
  backText: { fontSize: 16, color: '#666' },
});
