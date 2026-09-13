import { View, Text, StyleSheet } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>UFitness</Text>
      <Text style={styles.subtitle}>Fitness Built Around You</Text>
      <Text style={styles.description}>
        Let's personalize your UFitness experience.
      </Text>
      <PrimaryButton
        title="Get Started"
        onPress={() => navigation.navigate("Login")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },
  subtitle: { fontSize: 18, color: "#666", marginBottom: 40 },
  description: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 40,
  },
});
