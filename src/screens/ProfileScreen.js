import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import PrimaryButton from "../components/PrimaryButton";

export default function ProfileScreen({ data, updateField }) {
  // Helper to display full labels from short values
  const getCampusLabel = (value) => {
    const map = {
      APK: "Auckland Park Kingsway (APK)",
      APB: "Auckland Park Bunting Road (APB)",
      DFC: "Doornfontein (DFC)",
      SWC: "Soweto (SWC)",
    };
    return map[value] || value;
  };

  const getFitnessGoalLabel = (value) => {
    const map = {
      weight: "Weight Management",
      muscle: "Muscle Building",
      general: "General Fitness",
      endurance: "Endurance",
    };
    return map[value] || value;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ========== PROFILE PICTURE CIRCLE + NAME ========== */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>UF</Text>
        </View>
        <Text style={styles.userName}>UFitness User</Text>
        <Text style={styles.userEmail}>student@uj.ac.za</Text>
      </View>

      {/* ========== PROFILE INFO SECTION ========== */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Your Profile</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Fitness Goal</Text>
          <Text style={styles.value}>
            {getFitnessGoalLabel(data?.fitnessGoal) || "Not selected"}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Campus</Text>
          <Text style={styles.value}>
            {getCampusLabel(data?.campus) || "Not selected"}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Experience Level</Text>
          <Text style={styles.value}>
            {data?.experienceLevel || "Not selected"}
          </Text>
        </View>
      </View>

      {/* Edit Profile Button */}
      <PrimaryButton
        title="Edit Profile"
        onPress={() =>
          Alert.alert(
            "Edit Profile",
            "This will take you back to update your answers.",
          )
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 50,
    paddingBottom: 50,
    backgroundColor: "#F5F5F5",
  },

  // ========== PROFILE HEADER — CIRCLE AVATAR ==========
  profileHeader: {
    alignItems: "center",
    marginBottom: 40,
  },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#8B4513",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  userName: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#665952",
  },

  // ========== INFO CARD ==========
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 30,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#8B4513",
    marginBottom: 24,
    textAlign: "center",
  },
  infoRow: {
    paddingVertical: 12,
  },
  label: {
    fontSize: 15,
    color: "#8B4513",
    fontWeight: "600",
    marginBottom: 4,
  },
  value: {
    fontSize: 17,
    color: "#333333",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0E6E0",
    marginVertical: 4,
  },
});
