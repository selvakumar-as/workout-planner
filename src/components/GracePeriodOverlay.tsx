import React, { FC, useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GracePeriodOverlayProps {
  remaining: number; // ms
  exerciseName: string;
  setNumber: number;
  onSkip: () => void;
}

// ---------------------------------------------------------------------------
// GracePeriodOverlay
// ---------------------------------------------------------------------------

const GracePeriodOverlay: FC<GracePeriodOverlayProps> = ({
  remaining,
  exerciseName,
  setNumber,
  onSkip,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const secondsLeft = Math.ceil(remaining / 1000);

  return (
    <View style={styles.overlay}>
      <Text style={styles.getReady}>Get Ready!</Text>
      <Text style={styles.exerciseName}>{exerciseName}</Text>
      <Text style={styles.setLabel}>Set {setNumber}</Text>
      <Animated.Text
        style={[styles.countdown, { transform: [{ scale: pulseAnim }] }]}
        accessibilityLabel={`${secondsLeft} seconds until set starts`}
      >
        {secondsLeft}
      </Animated.Text>
      <Pressable
        style={styles.skipButton}
        onPress={onSkip}
        accessibilityLabel="Skip grace period and start set now"
      >
        <Text style={styles.skipButtonText}>Skip</Text>
      </Pressable>
    </View>
  );
};

export default GracePeriodOverlay;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "#1E3A8A",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    marginBottom: 16,
  },
  getReady: {
    fontSize: 18,
    fontWeight: "700",
    color: "#93C5FD",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
  },
  setLabel: {
    fontSize: 15,
    color: "#BFDBFE",
    marginBottom: 24,
  },
  countdown: {
    fontSize: 80,
    fontWeight: "900",
    color: "#FFFFFF",
    fontVariant: ["tabular-nums"],
    marginBottom: 28,
  },
  skipButton: {
    borderWidth: 2,
    borderColor: "#93C5FD",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 36,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#BFDBFE",
  },
});
