import { Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { FOOD_BUDGETS } from '../../data/onboardingOptions';
import SelectionCard from '../../components/SelectionCard';
import PrimaryButton from '../../components/PrimaryButton';
import ProgressIndicator from '../../components/ProgressIndicator';

// Step 4 — monthly food budget (feeds the meals planner later)
export default function FoodBudgetScreen({ navigation, data, updateField }) {
  const selected = data.foodBudget;

  function handleNext() {
    if (!selected) {
      Alert.alert('Please select an option before continuing.');
      return;
    }
    navigation.navigate('FundingType');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ProgressIndicator current={4} total={6} />
      <Text style={styles.title}>What's your monthly food budget?</Text>

      {FOOD_BUDGETS.map(function (budget) {
        return (
          <SelectionCard
            key={budget}
            label={budget}
            selected={selected === budget}
            onPress={function () {
              updateField('foodBudget', budget);
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
