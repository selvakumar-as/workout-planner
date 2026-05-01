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
import { useSessionViewModel } from "../viewmodels/useSessionViewModel";
import { useWorkoutViewModel } from "../viewmodels/useWorkoutViewModel";
import { useStopwatch } from "../hooks/useStopwatch";
import { useCountdown } from "../hooks/useCountdown";
import { useWorkoutSound } from "../hooks/useWorkoutSound";
import { useAutoSession, GRACE_PERIOD_MS } from "../hooks/useAutoSession";
import { formatElapsed, formatCountdown } from "../utils/formatTime";
import AutoModeToggle from "../components/AutoModeToggle";
import GracePeriodOverlay from "../components/GracePeriodOverlay";
import type { AutoTimerConfig, ExerciseGroup } from "../types";

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
// RestTimer sub-component (manual mode)
// ---------------------------------------------------------------------------

interface RestTimerProps {
  restMs: number;
  onDone: () => void;
  onSkip: () => void;
}

const RestTimer: FC<RestTimerProps> = ({ restMs, onDone, onSkip }) => {
  const countdown = useCountdown(restMs);

  useEffect(() => {
    countdown.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
// AutoRunningCard sub-component
// ---------------------------------------------------------------------------

interface AutoRunningCardProps {
  remaining: number; // ms
  onStopEarly: () => void;
}

const AutoRunningCard: FC<AutoRunningCardProps> = ({ remaining, onStopEarly }) => (
  <View style={autoCardStyles.container}>
    <Text style={autoCardStyles.label}>Set Running</Text>
    <Text
      style={autoCardStyles.timer}
      accessibilityLabel={`Set time remaining ${formatCountdown(remaining)}`}
    >
      {formatCountdown(remaining)}
    </Text>
    <Pressable
      style={autoCardStyles.stopButton}
      onPress={onStopEarly}
      accessibilityLabel="Stop set early and log it"
    >
      <Text style={autoCardStyles.stopButtonText}>Stop Early</Text>
    </Pressable>
  </View>
);

const autoCardStyles = StyleSheet.create({
  container: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1D4ED8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  timer: {
    fontSize: 48,
    fontWeight: "700",
    color: "#2563EB",
    fontVariant: ["tabular-nums"],
    marginBottom: 16,
  },
  stopButton: {
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  stopButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
  },
});

// ---------------------------------------------------------------------------
// AutoRestCard sub-component
// ---------------------------------------------------------------------------

interface AutoRestCardProps {
  remaining: number; // ms
  label: string;
  onSkip: () => void;
}

const AutoRestCard: FC<AutoRestCardProps> = ({ remaining, label, onSkip }) => (
  <View style={autoRestStyles.container}>
    <Text style={autoRestStyles.sectionLabel}>{label}</Text>
    <Text
      style={autoRestStyles.time}
      accessibilityLabel={`Rest time remaining ${formatCountdown(remaining)}`}
    >
      {formatCountdown(remaining)}
    </Text>
    <Pressable
      style={autoRestStyles.skipButton}
      onPress={onSkip}
      accessibilityLabel="Skip rest period"
    >
      <Text style={autoRestStyles.skipButtonText}>Skip Rest</Text>
    </Pressable>
  </View>
);

const autoRestStyles = StyleSheet.create({
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
// AutoModeContent sub-component
// ---------------------------------------------------------------------------

interface AutoModeContentProps {
  autoTimerConfig: AutoTimerConfig | null;
  workoutId: string;
  sortedExercises: import("../types").WorkoutExercise[];
  sessionVm: ReturnType<typeof useSessionViewModel>;
  sounds: ReturnType<typeof useWorkoutSound>;
  getExerciseName: (exerciseId: string) => string;
}

const AutoModeContent: FC<AutoModeContentProps> = ({
  autoTimerConfig,
  workoutId,
  sortedExercises,
  sessionVm,
  sounds,
  getExerciseName,
}) => {
  const handleSetComplete = (
    exerciseId: string,
    setNumber: number,
    reps: number,
    weightKg?: number
  ) => {
    sessionVm.logSet({ exerciseId, setNumber, reps, weightKg });
  };

  const handleSessionComplete = () => {
    // Session continues — user still needs to tap Complete Workout
  };

  const noConfig = autoTimerConfig === null;

  // We always call useAutoSession to satisfy Rules of Hooks.
  // Use a fallback config when not configured.
  const effectiveConfig: AutoTimerConfig = autoTimerConfig ?? {
    secondsPerSet: 45,
    restBetweenSetsSecs: 60,
    restBetweenExercisesSecs: 90,
  };

  const autoSession = useAutoSession(
    {
      exercises: sortedExercises,
      autoTimerConfig: effectiveConfig,
      onSetComplete: handleSetComplete,
      onSessionComplete: handleSessionComplete,
    },
    sounds
  );

  if (noConfig) {
    return (
      <Pressable
        style={autoStyles.warningBanner}
        onPress={() =>
          router.push({
            pathname: "/workouts/[id]/timer-config",
            params: { id: workoutId },
          })
        }
        accessibilityLabel="Auto timer not configured — tap to set it up"
      >
        <Text style={autoStyles.warningBannerText}>
          Auto timer not configured — tap here to set it up
        </Text>
      </Pressable>
    );
  }

  const currentEx = sortedExercises[autoSession.currentExerciseIndex];
  const exerciseName = currentEx !== undefined
    ? getExerciseName(currentEx.exerciseId)
    : "Exercise";

  if (autoSession.phase === "IDLE") {
    const handleStart = () => {
      sounds.unlockAudio(); // unlock Web Audio API before first beep
      autoSession.start();
    };
    return (
      <Pressable
        style={autoStyles.startButton}
        onPress={handleStart}
        accessibilityLabel="Start auto session"
      >
        <Text style={autoStyles.startButtonText}>Start Auto Session</Text>
      </Pressable>
    );
  }

  if (autoSession.phase === "GRACE") {
    return (
      <GracePeriodOverlay
        remaining={autoSession.graceRemaining}
        exerciseName={exerciseName}
        setNumber={autoSession.currentSetNumber}
        onSkip={autoSession.skipGrace}
      />
    );
  }

  if (autoSession.phase === "RUNNING") {
    return (
      <AutoRunningCard
        remaining={autoSession.setRemaining}
        onStopEarly={autoSession.stopEarly}
      />
    );
  }

  if (autoSession.phase === "SET_REST") {
    return (
      <AutoRestCard
        remaining={autoSession.restRemaining}
        label="Rest Between Sets"
        onSkip={autoSession.skipRest}
      />
    );
  }

  if (autoSession.phase === "EXERCISE_REST") {
    return (
      <AutoRestCard
        remaining={autoSession.restRemaining}
        label="Rest Between Exercises"
        onSkip={autoSession.skipRest}
      />
    );
  }

  if (autoSession.phase === "DONE") {
    return (
      <View style={autoStyles.doneCard}>
        <Text style={autoStyles.doneText}>All sets complete!</Text>
        <Text style={autoStyles.doneSubtext}>
          Tap Complete Workout to finish.
        </Text>
      </View>
    );
  }

  return null;
};

const autoStyles = StyleSheet.create({
  warningBanner: {
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  warningBannerText: {
    fontSize: 14,
    color: "#92400E",
    fontWeight: "500",
    textAlign: "center",
  },
  startButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 16,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  doneCard: {
    backgroundColor: "#D1FAE5",
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#6EE7B7",
  },
  doneText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#065F46",
    marginBottom: 6,
  },
  doneSubtext: {
    fontSize: 14,
    color: "#047857",
  },
});

// ---------------------------------------------------------------------------
// ActiveSessionScreen
// ---------------------------------------------------------------------------

const ActiveSessionScreen: FC<ActiveSessionScreenProps> = () => {
  const sessionVm = useSessionViewModel();
  const workoutVm = useWorkoutViewModel();
  const sounds = useWorkoutSound();

  // Per-exercise navigation state (manual mode).
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [currentSetNumber, setCurrentSetNumber] = useState<number>(1);
  const [isResting, setIsResting] = useState<boolean>(false);
  const [setStarted, setSetStarted] = useState<boolean>(false);
  const [isSetPaused, setIsSetPaused] = useState<boolean>(false);
  const [nextExerciseWarning, setNextExerciseWarning] = useState<boolean>(false);

  const sessionStopwatch = useStopwatch();
  const setStopwatch = useStopwatch();
  const manualGrace = useCountdown(GRACE_PERIOD_MS);
  const [isManualGrace, setIsManualGrace] = useState<boolean>(false);

  useEffect(() => {
    sessionStopwatch.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (manualGrace.isDone && isManualGrace) {
      setIsManualGrace(false);
      sounds.playSetStart();
      setSetStarted(true);
      setIsSetPaused(false);
      setStopwatch.start();
    }
  }, [manualGrace.isDone, isManualGrace]);

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

  const autoMode = sessionVm.autoMode;
  const autoTimerConfig = sessionVm.autoTimerConfig;

  // Auto mode toggle disabled while a set is in progress (manual) or auto
  // session is running.
  const toggleDisabled = setStarted;

  const handleToggleAutoMode = (value: boolean) => {
    sessionVm.setAutoMode(value);
  };

  // Manual mode derived values
  const currentWorkoutExercise = sortedExercises[currentExerciseIndex];
  const exercise = workoutVm.getExerciseById(currentWorkoutExercise.exerciseId);
  const exerciseName = exercise?.name ?? "Unknown Exercise";
  const muscleGroup: ExerciseGroup = exercise?.muscleGroup ?? "UPPER_BODY";
  const badgeConfig = GROUP_BADGE_CONFIG[muscleGroup];
  const totalSets = currentWorkoutExercise.sets;
  const restSeconds = currentWorkoutExercise.restSeconds ?? 0;
  const isLastExercise = currentExerciseIndex === totalExercises - 1;
  const allSetsDone = currentSetNumber > totalSets;

  const getExerciseName = (exerciseId: string): string =>
    workoutVm.getExerciseById(exerciseId)?.name ?? "Exercise";

  // -------------------------------------------------------------------------
  // Manual handlers
  // -------------------------------------------------------------------------

  const handleStartSet = () => {
    sounds.unlockAudio();
    manualGrace.reset(GRACE_PERIOD_MS);
    setIsManualGrace(true);
    setTimeout(() => manualGrace.start(), 0);
  };

  const handleManualSkipGrace = () => {
    manualGrace.reset();
    setIsManualGrace(false);
    sounds.playSetStart();
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
    if (!allSetsDone) {
      setNextExerciseWarning(true);
      return;
    }
    setNextExerciseWarning(false);
    if (isLastExercise) return;
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: workout name + total elapsed + auto toggle */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.workoutName} numberOfLines={1}>
              {workout.name}
            </Text>
            <Text style={styles.headerSubtitle}>Active Session</Text>
            <View style={styles.toggleRow}>
              <AutoModeToggle
                isAuto={autoMode}
                onToggle={handleToggleAutoMode}
                disabled={toggleDisabled}
              />
            </View>
          </View>
          <Text
            style={styles.totalElapsed}
            accessibilityLabel={`Total elapsed time ${formatElapsed(sessionStopwatch.elapsed)}`}
          >
            {formatElapsed(sessionStopwatch.elapsed)}
          </Text>
        </View>

        {/* Exercise progress card (shown in both modes) */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Exercise Progress</Text>
          {autoMode ? (
            <Text style={styles.exerciseProgress}>
              Auto mode active · {totalExercises} exercise{totalExercises !== 1 ? "s" : ""}
            </Text>
          ) : (
            <>
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
            </>
          )}
        </View>

        {/* Auto mode content */}
        {autoMode && (
          <AutoModeContent
            autoTimerConfig={autoTimerConfig}
            workoutId={workout.id}
            sortedExercises={sortedExercises}
            sessionVm={sessionVm}
            sounds={sounds}
            getExerciseName={getExerciseName}
          />
        )}

        {/* Manual mode: grace period overlay */}
        {!autoMode && !isResting && isManualGrace && (
          <GracePeriodOverlay
            remaining={manualGrace.remaining}
            exerciseName={exerciseName}
            setNumber={currentSetNumber}
            onSkip={handleManualSkipGrace}
          />
        )}

        {/* Manual mode: set timer card */}
        {!autoMode && !isResting && !isManualGrace && (
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
                    style={[
                      styles.setButton,
                      styles.setButtonPause,
                      isSetPaused && styles.setButtonResume,
                    ]}
                    onPress={isSetPaused ? handleResumeSet : handlePauseSet}
                    accessibilityLabel={isSetPaused ? "Resume set timer" : "Pause set timer"}
                  >
                    <Text style={styles.setButtonText}>
                      {isSetPaused ? "Resume" : "Pause"}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        )}

        {/* Manual mode: rest timer */}
        {!autoMode && isResting && restSeconds > 0 && (
          <RestTimer
            restMs={restSeconds * 1000}
            onDone={handleRestDone}
            onSkip={handleRestDone}
          />
        )}

        {/* Manual mode: navigation */}
        {!autoMode && (
          <>
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
                  Prev
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.navButton,
                  isLastExercise && allSetsDone && styles.navButtonDisabled,
                ]}
                onPress={handleNextExercise}
                disabled={isLastExercise && allSetsDone}
                accessibilityLabel={
                  isLastExercise ? "Finish exercises" : "Go to next exercise"
                }
              >
                <Text
                  style={[
                    styles.navButtonText,
                    isLastExercise && allSetsDone && styles.navButtonTextDisabled,
                  ]}
                >
                  {isLastExercise ? "Finish Exercises" : "Next"}
                </Text>
              </Pressable>
            </View>

            {nextExerciseWarning && (
              <Text style={styles.warningText}>Complete all sets first</Text>
            )}
          </>
        )}

        {/* Complete / Abandon (always visible) */}
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
  toggleRow: {
    marginTop: 8,
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
  // ---- Set timer (manual) ----
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
  // ---- Navigation row (manual) ----
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
