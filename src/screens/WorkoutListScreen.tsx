import { router } from "expo-router";
import React, { FC } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useWorkoutViewModel } from "../hooks/useWorkoutViewModel";
import type { Workout } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface WorkoutListScreenProps {}

// ---------------------------------------------------------------------------
// Sub-component types
// ---------------------------------------------------------------------------

export interface WorkoutRowProps {
  workout: Workout;
  onPress: () => void;
}

// ---------------------------------------------------------------------------
// WorkoutRow
// ---------------------------------------------------------------------------

const WorkoutRow: FC<WorkoutRowProps> = ({ workout, onPress }) => (
  <Pressable
    style={styles.row}
    onPress={onPress}
    accessibilityLabel={`Open workout ${workout.name}`}
  >
    <View style={styles.rowContent}>
      <Text style={styles.rowTitle}>{workout.name}</Text>
      {workout.description ? (
        <Text style={styles.rowDescription} numberOfLines={2}>
          {workout.description}
        </Text>
      ) : null}
      <Text style={styles.rowMeta}>
        {workout.exercises.length}{" "}
        {workout.exercises.length === 1 ? "exercise" : "exercises"}
      </Text>
    </View>
    <Text style={styles.rowChevron}>›</Text>
  </Pressable>
);

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const WorkoutListScreen: FC<WorkoutListScreenProps> = () => {
  const vm = useWorkoutViewModel();

  const handleRowPress = (id: string) => {
    router.push({ pathname: "/workouts/[id]", params: { id } });
  };

  const handleFAB = () => {
    router.push("/workouts/new");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList<Workout>
        data={vm.workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WorkoutRow
            workout={item}
            onPress={() => handleRowPress(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No workouts yet. Tap + to create one.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Floating action button */}
      <Pressable
        style={styles.fab}
        onPress={handleFAB}
        accessibilityLabel="Create new workout"
      >
        <Text style={styles.fabLabel}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
};

export default WorkoutListScreen;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
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
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  rowDescription: {
    fontSize: 13,
    color: "#6B6B6B",
    marginBottom: 4,
  },
  rowMeta: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  rowChevron: {
    fontSize: 22,
    color: "#D1D5DB",
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: "#9CA3AF",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
    elevation: 6,
  },
  fabLabel: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "400",
  },
});
