import { router, useLocalSearchParams } from "expo-router";
import React, { FC } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useWorkoutViewModel } from "../viewmodels/useWorkoutViewModel";
import type { Exercise, ExerciseGroup, WorkoutExercise } from "../types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GROUP_LABELS: Record<ExerciseGroup, string> = {
  UPPER_BODY: "Upper Body",
  CORE: "Core",
  LOWER_BODY: "Lower Body",
};

const GROUP_ORDER: ExerciseGroup[] = ["UPPER_BODY", "CORE", "LOWER_BODY"];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface WorkoutDetailScreenProps {}

// ---------------------------------------------------------------------------
// Sub-component types
// ---------------------------------------------------------------------------

export interface ExerciseRowProps {
  entry: WorkoutExercise;
  exercise: Exercise;
}

// ---------------------------------------------------------------------------
// ExerciseRow
// ---------------------------------------------------------------------------

const ExerciseRow: FC<ExerciseRowProps> = ({ entry, exercise }) => {
  const weightText =
    entry.weightKg !== undefined ? ` · ${entry.weightKg} kg` : "";
  const restText =
    entry.restSeconds !== undefined ? ` · ${entry.restSeconds}s rest` : "";

  return (
    <View style={styles.exerciseRow}>
      <Text style={styles.exerciseName}>{exercise.name}</Text>
      <Text style={styles.exerciseMeta}>
        {entry.sets} × {entry.reps}
        {weightText}
        {restText}
      </Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const WorkoutDetailScreen: FC<WorkoutDetailScreenProps> = () => {
  const { id: workoutId } = useLocalSearchParams<{ id: string }>();
  const vm = useWorkoutViewModel();

  const workout = vm.getWorkoutById(workoutId);

  if (!workout) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Workout not found.</Text>
          <Pressable
            style={styles.backLink}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backLinkText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Group exercises by muscle group, preserving display order
  const groupedEntries = GROUP_ORDER.reduce<
    Array<{ group: ExerciseGroup; entries: WorkoutExercise[] }>
  >((acc, group) => {
    const entries = workout.exercises.filter((entry) => {
      const exercise = vm.getExerciseById(entry.exerciseId);
      return exercise?.muscleGroup === group;
    });
    if (entries.length > 0) {
      acc.push({ group, entries });
    }
    return acc;
  }, []);

  // Exercises that couldn't be resolved (defensive)
  const ungrouped = workout.exercises.filter(
    (entry) => !vm.getExerciseById(entry.exerciseId)
  );

  const handleAddExercise = () => {
    router.push({
      pathname: "/workouts/[id]/add-exercise",
      params: { id: workoutId },
    });
  };

  const handleConfigureTimer = () => {
    router.push({
      pathname: "/workouts/[id]/timer-config",
      params: { id: workoutId },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Workout header */}
        <View style={styles.header}>
          <Text style={styles.title}>{workout.name}</Text>
          {workout.description ? (
            <Text style={styles.description}>{workout.description}</Text>
          ) : null}
        </View>

        {/* Exercise groups */}
        {groupedEntries.length === 0 && ungrouped.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No exercises yet. Tap "Add Exercise" to get started.
            </Text>
          </View>
        ) : (
          groupedEntries.map(({ group, entries }) => (
            <View key={group} style={styles.group}>
              <Text style={styles.groupHeader}>{GROUP_LABELS[group]}</Text>
              {entries.map((entry) => {
                const exercise = vm.getExerciseById(entry.exerciseId);
                if (!exercise) return null;
                return (
                  <ExerciseRow
                    key={entry.exerciseId}
                    entry={entry}
                    exercise={exercise}
                  />
                );
              })}
            </View>
          ))
        )}

        {/* Add Exercise button */}
        <Pressable
          style={styles.addButton}
          onPress={handleAddExercise}
          accessibilityLabel="Add exercise to workout"
        >
          <Text style={styles.addButtonText}>Add Exercise</Text>
        </Pressable>

        {/* Auto Timer Config */}
        {workout.autoTimerConfig !== undefined && (
          <View style={styles.autoConfigSummary}>
            <Text style={styles.autoConfigSummaryText}>
              {"Auto: "}
              {workout.autoTimerConfig.secondsPerSet}
              {"s/set · "}
              {workout.autoTimerConfig.restBetweenSetsSecs}
              {"s set rest · "}
              {workout.autoTimerConfig.restBetweenExercisesSecs}
              {"s exercise rest"}
            </Text>
          </View>
        )}

        <Pressable
          style={styles.timerConfigButton}
          onPress={handleConfigureTimer}
          accessibilityLabel="Configure auto timer for this workout"
        >
          <Text style={styles.timerConfigButtonText}>Configure Auto Timer</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WorkoutDetailScreen;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#6B6B6B",
    lineHeight: 20,
  },
  group: {
    marginBottom: 8,
  },
  groupHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginBottom: 6,
    marginTop: 12,
  },
  exerciseRow: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 10,
    padding: 14,
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    elevation: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  exerciseMeta: {
    fontSize: 13,
    color: "#6B6B6B",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 32,
    marginHorizontal: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
  addButton: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  notFoundContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  notFoundText: {
    fontSize: 16,
    color: "#6B6B6B",
    marginBottom: 16,
  },
  backLink: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: "#2563EB",
    borderRadius: 8,
  },
  backLinkText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  autoConfigSummary: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  autoConfigSummaryText: {
    fontSize: 13,
    color: "#1D4ED8",
    fontWeight: "500",
  },
  timerConfigButton: {
    marginHorizontal: 20,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  timerConfigButtonText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "600",
  },
});
