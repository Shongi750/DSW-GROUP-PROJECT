import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function SelectionCard({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.selectedCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: "#E5D4CD",       // soft beige border
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",    // white when NOT selected
    marginBottom: 12,
  },
  selectedCard: {
    backgroundColor: "#FDE4DC",    // ✅ Light peach background when SELECTED
    borderColor: "#8B4513",       // ✅ BROWN border when SELECTED
  },
  label: {
    fontSize: 17,
    color: "#333333",             // dark text when NOT selected
  },
  selectedLabel: {
    color: "#5C2E09",             // ✅ Dark brown text when SELECTED
    fontWeight: "600",
  },
});