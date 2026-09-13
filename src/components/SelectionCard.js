import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function SelectionCard({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.selectedCard]}
      onPress={onPress}
    >
      <Text style={[styles.cardText, selected && styles.selectedText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    width: "100%",
  },
  selectedCard: {
    borderColor: "#4CAF50",
    backgroundColor: "#E8F5E9",
  },
  cardText: {
    fontSize: 16,
    textAlign: "center",
    color: "#333",
  },
  selectedText: {
    fontWeight: "bold",
    color: "#2E7D32",
  },
});
