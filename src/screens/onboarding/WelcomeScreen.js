import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";

export default function WelcomeScreen({ navigation }) {
  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleUp = useRef(new Animated.Value(0.8)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1️⃣ FADE IN + SCALE UP — logo appears smoothly
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleUp, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // 2️⃣ GENTLE PULSE EFFECT — subtle breathing glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // 3️⃣ Auto go to Login — 4 seconds total
    const timer = setTimeout(() => {
      navigation.navigate("Login");
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigation, fadeIn, scaleUp, pulse]);

  return (
    <LinearGradient
      colors={["#FFE8D6", "#D4F1E8"]}
      style={styles.background}
      start={{ x: 0.8, y: 0 }}
      end={{ x: 0.2, y: 1 }}
    >
      <View style={styles.container}>
        {/* Animated Logo Card */}
        <Animated.View
          style={[
            styles.logoCard,
            {
              opacity: fadeIn,
              transform: [{ scale: scaleUp }, { scale: pulse }],
            },
          ]}
        >
          <Text style={styles.logoTextMain}>UFITNESS</Text>
          <Text style={styles.logoSubtitle}>YOUR CAMPUS FITNESS COMPANION</Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  logoCard: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 30,
    paddingHorizontal: 35,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  logoTextMain: {
    fontSize: 28,
    fontWeight: "800",
    color: "#25345F",
    letterSpacing: 1,
  },
  logoSubtitle: {
    fontSize: 10,
    color: "#777777",
    marginTop: 4,
    letterSpacing: 1.5,
  },
});
