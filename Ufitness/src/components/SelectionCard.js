import { Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function SelectionCard({ label, selected, onPress }) {
  const { colors, isDark } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        selected && { backgroundColor: "rgba(255,106,0,0.14)", borderColor: colors.accent },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.label,
          { color: colors.text },
          selected && { color: isDark ? '#FF8A1A' : '#B33E0A', fontWeight: '700' },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: 6,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
  },
});
