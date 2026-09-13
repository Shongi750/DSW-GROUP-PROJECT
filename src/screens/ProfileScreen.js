import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import SelectionCard from "../components/SelectionCard";
import {
  FITNESS_GOALS,
  EXPERIENCE_LEVELS,
  WORKOUT_PREFERENCES,
  FOOD_BUDGETS,
  FUNDING_TYPES,
  CAMPUSES,
} from "../data/onboardingOptions";

// ✨ NEW: Firebase imports
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export default function ProfileScreen({ data, updateField }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editField, setEditField] = useState("");
  const [tempValue, setTempValue] = useState("");
  const [isSaving, setIsSaving] = useState(false); // ✨ NEW: Loading state

  const getCampusLabel = (value) => {
    const map = {
      APK: "Auckland Park Kingsway (APK)",
      APB: "Auckland Park Bunting Road (APB)",
      DFC: "Doornfontein (DFC)",
      SWC: "Soweto (SWC)",
    };
    return map[value] || value;
  };

  const openEdit = (field, currentValue) => {
    setEditField(field);
    setTempValue(currentValue);
    setIsEditing(true);
  };

  const saveChanges = () => {
    if (tempValue) {
      updateField(editField, tempValue);
      Alert.alert("✅ Saved!", "Your profile has been updated!");
    }
    setIsEditing(false);
    setEditField("");
  };

  // ✨ NEW: Function to finalize onboarding and trigger App.js redirect
  const handleCompleteOnboarding = async () => {
    if (!data.campus) {
      return Alert.alert("Missing Info", "Please ensure you have selected a campus.");
    }
    
    setIsSaving(true);
    try {
      const currentUserId = auth.currentUser?.uid;
      if (currentUserId) {
        await updateDoc(doc(db, 'users', currentUserId), {
          campus: data.campus,
          goal: data.fitnessGoal,
          level: data.experienceLevel,
          workoutPreference: data.workoutPreference,
          foodBudget: data.foodBudget,
          fundingType: data.fundingType
        });
        // Note: We don't need to navigate manually! App.js will detect this save and move us.
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Could not save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getOptions = (field) => {
    switch (field) {
      case "fitnessGoal": return FITNESS_GOALS;
      case "experienceLevel": return EXPERIENCE_LEVELS;
      case "workoutPreference": return WORKOUT_PREFERENCES;
      case "foodBudget": return FOOD_BUDGETS;
      case "fundingType": return FUNDING_TYPES;
      case "campus": return CAMPUSES;
      default: return [];
    }
  };

  const fieldLabels = {
    fitnessGoal: "Fitness Goal",
    experienceLevel: "Experience Level",
    workoutPreference: "Workout Preference",
    foodBudget: "Monthly Food Budget",
    fundingType: "Funding Type",
    campus: "Campus",
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>UFitness Profile</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{data.name || "Student"}</Text>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{data.email || "student@uj.ac.za"}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Campus</Text>
          <TouchableOpacity onPress={() => openEdit("campus", data.campus)}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.value}>
          {getCampusLabel(data.campus) || "Not selected"}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fitness Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Fitness Goal</Text>
          <TouchableOpacity onPress={() => openEdit("fitnessGoal", data.fitnessGoal)}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.value}>{data.fitnessGoal || "Not selected"}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Experience Level</Text>
          <TouchableOpacity onPress={() => openEdit("experienceLevel", data.experienceLevel)}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.value}>{data.experienceLevel || "Not selected"}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Workout Preference</Text>
          <TouchableOpacity onPress={() => openEdit("workoutPreference", data.workoutPreference)}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.value}>{data.workoutPreference || "Not selected"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Budget Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Monthly Food Budget</Text>
          <TouchableOpacity onPress={() => openEdit("foodBudget", data.foodBudget)}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.value}>{data.foodBudget || "Not selected"}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Funding Type</Text>
          <TouchableOpacity onPress={() => openEdit("fundingType", data.fundingType)}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.value}>{data.fundingType || "Not selected"}</Text>
      </View>

      <PrimaryButton title="Edit Profile" onPress={() => setIsEditing(true)} />

      {/* ✨ NEW: The Final Finish Button */}
      <View style={{ marginTop: 16 }}>
        {isSaving ? (
          <ActivityIndicator size="large" color="#2E7D32" />
        ) : (
          <PrimaryButton title="Complete Setup & Enter App 🚀" onPress={handleCompleteOnboarding} />
        )}
      </View>

      <Modal visible={isEditing} animationType="slide">
        <ScrollView style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            Edit {fieldLabels[editField] || "Profile"}
          </Text>

          {getOptions(editField).map((opt) => (
            <SelectionCard
              key={opt.value || opt}
              label={opt.label || opt}
              selected={tempValue === (opt.value || opt)}
              onPress={() => setTempValue(opt.value || opt)}
            />
          ))}

          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setIsEditing(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={saveChanges}>
              <Text style={styles.saveText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: "#f9f9f9" },
  heading: { fontSize: 28, fontWeight: "bold", color: "#2E7D32", textAlign: "center", marginBottom: 30 },
  section: { marginBottom: 24, padding: 16, backgroundColor: "#fff", borderRadius: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12, color: "#333" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  label: { fontSize: 14, color: "#666" },
  value: { fontSize: 16, color: "#222", fontWeight: "500", marginTop: 4 },
  editLink: { color: "#2E7D32", fontSize: 14, fontWeight: "600" },
  modalContainer: { padding: 24, backgroundColor: "#f9f9f9", flex: 1, marginTop: 30 },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center", color: "#2E7D32" },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 24 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: "center" },
  saveBtn: { backgroundColor: "#2E7D32" },
  cancelBtn: { backgroundColor: "#eee" },
  saveText: { color: "#fff", fontWeight: "bold" },
  cancelText: { color: "#666", fontWeight: "600" },
});