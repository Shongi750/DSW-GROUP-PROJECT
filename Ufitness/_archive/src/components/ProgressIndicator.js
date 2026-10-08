import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function ProgressIndicator({ current, total }) {
  const { colors } = useTheme();
  const dots = Array.from({ length: total }, (_, i) => (
    <View
      key={i}
      style={[
        styles.dot,
        { backgroundColor: colors.border },
        i < current && { backgroundColor: colors.accent, width: 24 },
      ]}
    />
  ));

  return (
    <View style={styles.container}>
      <Text style={[styles.stepText, { color: colors.muted }]}>
        Step {current} of {total}
      </Text>
      <View style={styles.dotsContainer}>{dots}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", marginBottom: 20 },
  stepText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  dotsContainer: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
