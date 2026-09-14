import { View, Text, StyleSheet } from "react-native";

export default function ProgressIndicator({ current, total }) {
  const dots = Array.from({ length: total }, (_, i) => (
    <View
      key={i}
      style={[styles.dot, i < current ? styles.activeDot : styles.inactiveDot]}
    />
  ));

  return (
    <View style={styles.container}>
      <Text style={styles.stepText}>
        Step {current} of {total}
      </Text>
      <View style={styles.dotsContainer}>{dots}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", marginBottom: 20 },
  stepText: { fontSize: 14, color: "#666", marginBottom: 8 },
  dotsContainer: { flexDirection: "row", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  activeDot: { backgroundColor: "#8B4513" },
  inactiveDot: { backgroundColor: "#ddd" },
});
