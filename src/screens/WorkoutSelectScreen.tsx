import React, { FC } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useWorkoutViewModel } from "../hooks/useWorkoutViewModel";
import { useSessionViewModel } from "../hooks/useSessionViewModel";
import type { Workout } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface WorkoutSelectScreenProps {}

// ---------------------------------------------------------------------------
// WorkoutRow sub-component
// ---------------------------------------------------------------------------

interface WorkoutRowProps {
  workout: Workout;
  onPress: (id: string) => void;
}

const WorkoutRow: FC<WorkoutRowProps> = ({ workout, onPress }) => (
  <Pressable
    style={styles.row}
    onPress={() => onPress(workout.id)}
    accessibilityLabel={`Select workout ${workout.name}`}
  >
    <View style={styles.rowContent}>
      <Text style={styles.rowName}>{workout.name}</Text>
      {workout.description !== undefined && workout.description.length > 0 && (
        <Text style={styles.rowDescription} numberOfLines={2}>
          {workout.description}
        </Text>
      )}
      <Text style={styles.rowMeta}>
        {workout.exercises.length}{" "}
        {workout.exercises.length === 1 ? "exercise" : "exercises"}
      </Text>
    </View>
    <Text style={styles.chevron}>›</Text>
  </Pressable>
);

// ---------------------------------------------------------------------------
// WorkoutSelectScreen
// ---------------------------------------------------------------------------

const WorkoutSelectScreen: FC<WorkoutSelectScreenProps> = () => {
  const workoutVm = useWorkoutViewModel();
  const sessionVm = useSessionViewModel();

  const handleSelectWorkout = (workoutId: string) => {
    sessionVm.startSession(workoutId);
    router.replace("/session");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Workout</Text>
        <Text style={styles.subtitle}>Choose a workout to start your session</Text>
      </View>

      <FlatList<Workout>
        data={workoutVm.workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WorkoutRow workout={item} onPress={handleSelectWorkout} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No workouts yet.</Text>
            <Pressable
              style={styles.createButton}
              onPress={() => router.push("/workouts/new")}
              accessibilityLabel="Create a new workout"
            >
              <Text style={styles.createButtonText}>Create Workout</Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

export default WorkoutSelectScreen;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B6B6B",
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    elevation: 2,
  },
  rowContent: {
    flex: 1,
  },
  rowName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  rowDescription: {
    fontSize: 13,
    color: "#6B6B6B",
    marginTop: 4,
  },
  rowMeta: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "500",
    marginTop: 6,
  },
  chevron: {
    fontSize: 24,
    color: "#C0C0C0",
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 64,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
