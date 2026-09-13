import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { WORKOUT_PREFERENCES } from "../../data/onboardingOptions";
import SelectionCard from "../../components/SelectionCard";
import PrimaryButton from "../../components/PrimaryButton";
import ProgressIndicator from "../../components/ProgressIndicator";

export default function WorkoutPreferenceScreen({
  navigation,
  data,
  updateField,
}) {
  const selected = data.workoutPreference;

  const handleNext = () => {
    if (!selected) {
      Alert.alert("Please select an option before continuing.");
      return;
    }
    navigation.navigate("FoodBudget");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ProgressIndicator current={3} total={6} />
      <Text style={styles.title}>Where do you prefer to work out?</Text>
      {WORKOUT_PREFERENCES.map((pref) => (
        <SelectionCard
          key={pref}
          label={pref}
          selected={selected === pref}
          onPress={() => updateField("workoutPreference", pref)}
        />
      ))}
      <PrimaryButton title="Next" onPress={handleNext} />

      {/* ← BACK BUTTON ADDED HERE */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: "#f9f9f9" },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  // ← BACK BUTTON STYLES ADDED HERE
  backButton: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  backText: {
    fontSize: 16,
    color: "#666",
  },
});
