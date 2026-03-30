import React, { FC, useEffect, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSessionViewModel } from "../hooks/useSessionViewModel";
import { useWorkoutViewModel } from "../hooks/useWorkoutViewModel";
import { useStopwatch } from "../hooks/useStopwatch";
import { useCountdown } from "../hooks/useCountdown";
import { formatElapsed, formatCountdown } from "../utils/formatTime";
import type { ExerciseGroup } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ActiveSessionScreenProps {}

// ---------------------------------------------------------------------------
// Group badge config
// ---------------------------------------------------------------------------

const GROUP_BADGE_CONFIG: Record<
  ExerciseGroup,
  { background: string; text: string; label: string }
> = {
  UPPER_BODY: { background: "#DBEAFE", text: "#1D4ED8", label: "Upper Body" },
  CORE: { background: "#D1FAE5", text: "#065F46", label: "Core" },
  LOWER_BODY: { background: "#FEF3C7", text: "#92400E", label: "Lower Body" },
};

// ---------------------------------------------------------------------------
// RestTimer sub-component
// ---------------------------------------------------------------------------

interface RestTimerProps {
  restMs: number;
  onDone: () => void;
  onSkip: () => void;
}

const RestTimer: FC<RestTimerProps> = ({ restMs, onDone, onSkip }) => {
  const countdown = useCountdown(restMs);

  // Auto-start when this component mounts.
  useEffect(() => {
    countdown.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notify parent when done.
  useEffect(() => {
    if (countdown.isDone) {
      onDone();
    }
  }, [countdown.isDone, onDone]);

  const handleSkip = () => {
    countdown.reset();
    onSkip();
  };

  return (
    <View style={restStyles.container}>
      <Text style={restStyles.sectionLabel}>Rest Timer</Text>
      <Text style={restStyles.time}>{formatCountdown(countdown.remaining)}</Text>
      <Pressable
        style={restStyles.skipButton}
        onPress={handleSkip}
        accessibilityLabel="Skip rest timer"
      >
        <Text style={restStyles.skipButtonText}>Skip Rest</Text>
      </Pressable>
    </View>
  );
};

const restStyles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#92400E",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  time: {
    fontSize: 48,
    fontWeight: "700",
    color: "#D97706",
    fontVariant: ["tabular-nums"],
    marginBottom: 16,
  },
  skipButton: {
    borderWidth: 1,
    borderColor: "#D97706",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#D97706",
  },
});

// ---------------------------------------------------------------------------
// ActiveSessionScreen
// ---------------------------------------------------------------------------

const ActiveSessionScreen: FC<ActiveSessionScreenProps> = () => {
  const sessionVm = useSessionViewModel();
  const workoutVm = useWorkoutViewModel();

  // Per-exercise navigation state.
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [currentSetNumber, setCurrentSetNumber] = useState<number>(1);
  const [isResting, setIsResting] = useState<boolean>(false);
  const [setStarted, setSetStarted] = useState<boolean>(false);
  const [isSetPaused, setIsSetPaused] = useState<boolean>(false);
  const [nextExerciseWarning, setNextExerciseWarning] = useState<boolean>(false);

  // Total session stopwatch — auto-starts on mount.
  const sessionStopwatch = useStopwatch();
  const setStopwatch = useStopwatch();

  // Auto-start session stopwatch.
  useEffect(() => {
    sessionStopwatch.start();
    // Only on mount; sessionStopwatch is stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeSession = sessionVm.activeSession;

  if (activeSession === null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.noSessionContainer}>
          <Text style={styles.noSessionText}>No active session.</Text>
          <Pressable
            style={styles.backButton}
            onPress={() => router.replace("/")}
            accessibilityLabel="Go back to home"
          >
            <Text style={styles.backButtonText}>Go Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const workout = workoutVm.getWorkoutById(activeSession.workoutId);

  if (workout === undefined || workout.exercises.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.noSessionContainer}>
          <Text style={styles.noSessionText}>
            {workout === undefined
              ? "Workout not found."
              : "This workout has no exercises."}
          </Text>
          <Pressable
            style={styles.backButton}
            onPress={() => router.replace("/")}
            accessibilityLabel="Go back to home"
          >
            <Text style={styles.backButtonText}>Go Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const sortedExercises = [...workout.exercises].sort((a, b) => a.order - b.order);
  const totalExercises = sortedExercises.length;
  const currentWorkoutExercise = sortedExercises[currentExerciseIndex];
  const exercise = workoutVm.getExerciseById(currentWorkoutExercise.exerciseId);
  const exerciseName = exercise?.name ?? "Unknown Exercise";
  const muscleGroup: ExerciseGroup = exercise?.muscleGroup ?? "UPPER_BODY";
  const badgeConfig = GROUP_BADGE_CONFIG[muscleGroup];

  const totalSets = currentWorkoutExercise.sets;
  const restSeconds = currentWorkoutExercise.restSeconds ?? 0;
  const isLastExercise = currentExerciseIndex === totalExercises - 1;

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleStartSet = () => {
    setSetStarted(true);
    setIsSetPaused(false);
    setStopwatch.start();
  };

  const handlePauseSet = () => {
    setStopwatch.pause();
    setIsSetPaused(true);
  };

  const handleResumeSet = () => {
    setStopwatch.start();
    setIsSetPaused(false);
  };

  const handleStopAndLogSet = () => {
    setStopwatch.pause();
    sessionVm.logSet({
      exerciseId: currentWorkoutExercise.exerciseId,
      setNumber: currentSetNumber,
      reps: currentWorkoutExercise.reps,
      weightKg: currentWorkoutExercise.weightKg,
    });
    setSetStarted(false);
    setIsSetPaused(false);
    setCurrentSetNumber((prev) => prev + 1);

    if (restSeconds > 0) {
      setIsResting(true);
    } else {
      setStopwatch.reset();
    }
  };

  const handleRestDone = () => {
    setIsResting(false);
    setStopwatch.reset();
  };

  const handlePrevExercise = () => {
    if (currentExerciseIndex === 0) return;
    setCurrentExerciseIndex((prev) => prev - 1);
    setCurrentSetNumber(1);
    setSetStarted(false);
    setIsSetPaused(false);
    setIsResting(false);
    setNextExerciseWarning(false);
    setStopwatch.reset();
  };

  const handleNextExercise = () => {
    const allSetsDone = currentSetNumber > totalSets;
    if (!allSetsDone) {
      setNextExerciseWarning(true);
      return;
    }
    setNextExerciseWarning(false);
    if (isLastExercise) {
      return;
    }
    setCurrentExerciseIndex((prev) => prev + 1);
    setCurrentSetNumber(1);
    setSetStarted(false);
    setIsSetPaused(false);
    setIsResting(false);
    setStopwatch.reset();
  };

  const handleComplete = () => {
    sessionVm.completeSession();
    router.replace("/");
  };

  const handleAbandon = () => {
    sessionVm.abandonSession();
    router.replace("/");
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const allSetsDone = currentSetNumber > totalSets;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: workout name + total elapsed */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.workoutName} numberOfLines={1}>
              {workout.name}
            </Text>
            <Text style={styles.headerSubtitle}>Active Session</Text>
          </View>
          <Text
            style={styles.totalElapsed}
            accessibilityLabel={`Total elapsed time ${formatElapsed(sessionStopwatch.elapsed)}`}
          >
            {formatElapsed(sessionStopwatch.elapsed)}
          </Text>
        </View>

        {/* Exercise progress card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Exercise Progress</Text>
          <Text style={styles.exerciseProgress}>
            Exercise {currentExerciseIndex + 1} of {totalExercises}
          </Text>
          <View style={styles.exerciseNameRow}>
            <Text style={styles.exerciseName}>{exerciseName}</Text>
            <View
              style={[
                styles.groupBadge,
                { backgroundColor: badgeConfig.background },
              ]}
            >
              <Text style={[styles.groupBadgeText, { color: badgeConfig.text }]}>
                {badgeConfig.label}
              </Text>
            </View>
          </View>
          <Text style={styles.setProgress}>
            Set {Math.min(currentSetNumber, totalSets)} of {totalSets}
            {allSetsDone ? " (all sets done)" : ""}
          </Text>
        </View>

        {/* Set timer card */}
        {!isResting && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Set Timer</Text>
            <Text
              style={styles.setTimerText}
              accessibilityLabel={`Set elapsed time ${formatElapsed(setStopwatch.elapsed)}`}
            >
              {formatElapsed(setStopwatch.elapsed)}
            </Text>
            {!allSetsDone && (
              <View style={styles.setButtonRow}>
                <Pressable
                  style={[
                    styles.setButton,
                    styles.setButtonPrimary,
                    setStarted ? styles.setButtonStop : styles.setButtonStart,
                  ]}
                  onPress={setStarted ? handleStopAndLogSet : handleStartSet}
                  accessibilityLabel={setStarted ? "Stop and log set" : "Start set"}
                >
                  <Text style={styles.setButtonText}>
                    {setStarted ? "Stop & Log Set" : "Start Set"}
                  </Text>
                </Pressable>
                {setStarted && (
                  <Pressable
                    style={[styles.setButton, styles.setButtonPause, isSetPaused && styles.setButtonResume]}
                    onPress={isSetPaused ? handleResumeSet : handlePauseSet}
                    accessibilityLabel={isSetPaused ? "Resume set timer" : "Pause set timer"}
                  >
                    <Text style={styles.setButtonText}>
                      {isSetPaused ? "▶ Resume" : "⏸ Pause"}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        )}

        {/* Rest timer */}
        {isResting && restSeconds > 0 && (
          <RestTimer
            restMs={restSeconds * 1000}
            onDone={handleRestDone}
            onSkip={handleRestDone}
          />
        )}

        {/* Navigation */}
        <View style={styles.navRow}>
          <Pressable
            style={[
              styles.navButton,
              currentExerciseIndex === 0 && styles.navButtonDisabled,
            ]}
            onPress={handlePrevExercise}
            disabled={currentExerciseIndex === 0}
            accessibilityLabel="Go to previous exercise"
          >
            <Text
              style={[
                styles.navButtonText,
                currentExerciseIndex === 0 && styles.navButtonTextDisabled,
              ]}
            >
              ← Prev
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.navButton,
              isLastExercise && allSetsDone && styles.navButtonDisabled,
            ]}
            onPress={handleNextExercise}
            disabled={isLastExercise && allSetsDone}
            accessibilityLabel={isLastExercise ? "Finish exercises" : "Go to next exercise"}
          >
            <Text
              style={[
                styles.navButtonText,
                isLastExercise && allSetsDone && styles.navButtonTextDisabled,
              ]}
            >
              {isLastExercise ? "Finish Exercises" : "Next →"}
            </Text>
          </Pressable>
        </View>

        {nextExerciseWarning && (
          <Text style={styles.warningText}>Complete all sets first</Text>
        )}

        {/* Complete / Abandon */}
        <View style={styles.finalRow}>
          <Pressable
            style={[styles.button, styles.buttonComplete]}
            onPress={handleComplete}
            accessibilityLabel="Complete workout and end session"
          >
            <Text style={styles.buttonText}>Complete Workout</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.buttonAbandon]}
            onPress={handleAbandon}
            accessibilityLabel="Abandon workout and end session"
          >
            <Text style={styles.buttonText}>Abandon</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ActiveSessionScreen;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  // ---- No session ----
  noSessionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  noSessionText: {
    fontSize: 16,
    color: "#6B6B6B",
    marginBottom: 16,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // ---- Header ----
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  workoutName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6B6B6B",
    marginTop: 2,
  },
  totalElapsed: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1A1A1A",
    fontVariant: ["tabular-nums"],
  },
  // ---- Card ----
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    elevation: 2,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  // ---- Exercise progress ----
  exerciseProgress: {
    fontSize: 13,
    color: "#6B6B6B",
    marginBottom: 6,
  },
  exerciseNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    flexShrink: 1,
  },
  groupBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  groupBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  setProgress: {
    fontSize: 14,
    color: "#6B6B6B",
  },
  // ---- Set timer ----
  setTimerText: {
    fontSize: 48,
    fontWeight: "700",
    color: "#2563EB",
    fontVariant: ["tabular-nums"],
    marginBottom: 16,
  },
  setButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  setButton: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  setButtonPrimary: {
    flex: 1,
  },
  setButtonStart: {
    backgroundColor: "#2563EB",
  },
  setButtonStop: {
    backgroundColor: "#DC2626",
  },
  setButtonPause: {
    backgroundColor: "#6B7280",
    minWidth: 110,
  },
  setButtonResume: {
    backgroundColor: "#059669",
  },
  setButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // ---- Navigation row ----
  navRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  navButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    elevation: 1,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  navButtonTextDisabled: {
    color: "#9CA3AF",
  },
  warningText: {
    textAlign: "center",
    fontSize: 13,
    color: "#D97706",
    fontWeight: "500",
    marginBottom: 12,
  },
  // ---- Final action row ----
  finalRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonComplete: {
    backgroundColor: "#059669",
  },
  buttonAbandon: {
    backgroundColor: "#DC2626",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
