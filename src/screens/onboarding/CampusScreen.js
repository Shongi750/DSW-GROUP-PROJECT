import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { CAMPUSES } from "../../data/onboardingOptions";
import SelectionCard from "../../components/SelectionCard";
import PrimaryButton from "../../components/PrimaryButton";
import ProgressIndicator from "../../components/ProgressIndicator";

export default function CampusScreen({ navigation, data, updateField }) {
  const selected = data.campus;

  const handleFinish = () => {
    if (!selected) {
      Alert.alert("Please select an option before continuing.");
      return;
    }
    navigation.navigate("Profile");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ProgressIndicator current={6} total={6} />
      <Text style={styles.title}>Which UJ campus do you attend?</Text>
      {CAMPUSES.map((campus) => (
        <SelectionCard
          key={campus.value}
          label={campus.label}
          selected={selected === campus.value}
          onPress={() => updateField("campus", campus.value)}
        />
      ))}
      <PrimaryButton title="Finish" onPress={handleFinish} />

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
