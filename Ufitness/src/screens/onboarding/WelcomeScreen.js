import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";

// Splash: logo animation, then send user to Login after ~1.2s.
export default function WelcomeScreen({ navigation }) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleUp = useRef(new Animated.Value(0.85)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(function runIntro() {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleUp, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    const timer = setTimeout(function goToLogin() {
      navigation.navigate("Login");
    }, 1200);

    return function cleanup() {
      clearTimeout(timer);
    };
  }, [navigation, fadeIn, scaleUp, pulse]);

  return (
    <View style={styles.background}>
      <LinearGradient
        colors={["#2A1508", "#140A04", "#0A0A0A"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.logoCard,
            {
              opacity: fadeIn,
              transform: [{ scale: scaleUp }, { scale: pulse }],
            },
          ]}
        >
          <View style={styles.markRow}>
            <Text style={styles.markU}>U</Text>
            <Text style={styles.markF}>FITNESS</Text>
          </View>
          <Text style={styles.logoSubtitle}>YOUR CAMPUS FITNESS COMPANION</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  logoCard: {
    backgroundColor: "rgba(21,21,21,0.9)",
    borderWidth: 1,
    borderColor: "#262626",
    paddingVertical: 34,
    paddingHorizontal: 40,
    borderRadius: 6,
    alignItems: "center",
    shadowColor: "#FF6A00",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  markRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  markU: {
    fontFamily: "Anton_400Regular",
    fontSize: 38,
    letterSpacing: 1.5,
    color: "#FFFFFF",
  },
  markF: {
    fontFamily: "Anton_400Regular",
    fontSize: 38,
    letterSpacing: 1.5,
    color: "#FF6A00",
  },
  logoSubtitle: {
    fontSize: 10,
    color: "#A3A3A3",
    marginTop: 8,
    letterSpacing: 2.4,
    fontWeight: "700",
  },
});
