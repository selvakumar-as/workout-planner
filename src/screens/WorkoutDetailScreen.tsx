import { router, useLocalSearchParams } from "expo-router";
import React, { FC, useRef, useState, useCallback } from "react";
import {
  Alert,
  Animated,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWorkoutViewModel } from "../viewmodels/useWorkoutViewModel";
import type { Exercise, ExerciseGroup, WorkoutExercise } from "../types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GROUP_LABELS: Record<ExerciseGroup, string> = {
  CHEST: "Chest",
  BACK: "Back",
  SHOULDERS: "Shoulders",
  ARMS: "Arms",
  CORE: "Core",
  LEGS: "Legs",
  FOREARMS: "Forearms",
};

/** Approximate height of a single exercise row including bottom margin. */
const ROW_HEIGHT = 72;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface WorkoutDetailScreenProps {}

// ---------------------------------------------------------------------------
// DraggableExerciseRow
// ---------------------------------------------------------------------------

interface DraggableExerciseRowProps {
  entry: WorkoutExercise;
  exercise: Exercise;
  onEdit: (exerciseId: string) => void;
  onDelete: (exerciseId: string) => void;
  onDragStart: (exerciseId: string) => void;
  onDragMove: (dy: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

const DraggableExerciseRow: FC<DraggableExerciseRowProps> = ({
  entry,
  exercise,
  onEdit,
  onDelete,
  onDragStart,
  onDragMove,
  onDragEnd,
  isDragging,
}) => {
  const translateY = useRef(new Animated.Value(0)).current;

  // Keep latest values in refs so the PanResponder (created once) never has stale closures
  const onDragStartRef = useRef(onDragStart);
  const onDragMoveRef = useRef(onDragMove);
  const onDragEndRef = useRef(onDragEnd);
  const exerciseIdRef = useRef(entry.exerciseId);
  onDragStartRef.current = onDragStart;
  onDragMoveRef.current = onDragMove;
  onDragEndRef.current = onDragEnd;
  exerciseIdRef.current = entry.exerciseId;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        onDragStartRef.current(exerciseIdRef.current);
      },
      onPanResponderMove: (
        _evt: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        translateY.setValue(gestureState.dy);
        onDragMoveRef.current(gestureState.dy);
      },
      onPanResponderRelease: () => {
        translateY.setValue(0);
        onDragEndRef.current();
      },
      onPanResponderTerminate: () => {
        translateY.setValue(0);
        onDragEndRef.current();
      },
    })
  ).current;

  const isTimeBased = exercise.isTimeBased ?? false;
  const weightText = entry.weightKg !== undefined ? ` · ${entry.weightKg} kg` : "";
  const restText = entry.restSeconds !== undefined ? ` · ${entry.restSeconds}s rest` : "";
  const configText = isTimeBased
    ? `${entry.sets} sets × ${entry.durationPerSetSecs ?? "?"}s${restText}`
    : `${entry.sets} × ${entry.reps}${weightText}${restText}`;

  return (
    <Animated.View
      style={[
        styles.exerciseRow,
        isDragging && styles.exerciseRowDragging,
        { transform: [{ translateY }] },
      ]}
      accessibilityLabel={`Draggable row for ${exercise.name}`}
    >
      {/* Drag handle — ONLY this region responds to pan gestures */}
      <View
        style={styles.dragHandle}
        accessibilityLabel={`Drag handle for ${exercise.name}`}
        {...panResponder.panHandlers}
      >
        <View style={styles.dragHandleLine} />
        <View style={styles.dragHandleLine} />
        <View style={styles.dragHandleLine} />
      </View>

      <Pressable
        style={styles.exerciseRowContent}
        onPress={() => onEdit(exerciseIdRef.current)}
        accessibilityLabel={`Edit exercise ${exercise.name}`}
      >
        <View style={styles.exerciseNameRow}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <View style={styles.muscleGroupBadge}>
            <Text style={styles.muscleGroupBadgeText}>
              {GROUP_LABELS[exercise.muscleGroup]}
            </Text>
          </View>
        </View>
        <Text style={styles.exerciseMeta}>{configText}</Text>
      </Pressable>

      <Text style={styles.exerciseEditHint}>›</Text>

      <Pressable
        style={styles.exerciseDeleteButton}
        onPress={() => onDelete(exerciseIdRef.current)}
        accessibilityLabel={`Delete exercise ${exercise.name}`}
        hitSlop={8}
      >
        <Text style={styles.exerciseDeleteButtonText}>⌫</Text>
      </Pressable>
    </Animated.View>
  );
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const WorkoutDetailScreen: FC<WorkoutDetailScreenProps> = () => {
  const { id: workoutId } = useLocalSearchParams<{ id: string }>();
  const vm = useWorkoutViewModel();

  const workout = vm.getWorkoutById(workoutId);

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);
  const dragStartIndex = useRef<number>(-1);
  const currentDy = useRef<number>(0);

  const handleDragStart = useCallback(
    (exerciseId: string) => {
      if (!workout) return;
      const sorted = [...workout.exercises].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((e) => e.exerciseId === exerciseId);
      dragStartIndex.current = idx;
      currentDy.current = 0;
      setDraggingId(exerciseId);
      setDragTargetIndex(idx);
    },
    [workout]
  );

  const handleDragMove = useCallback(
    (dy: number) => {
      currentDy.current = dy;
      if (!workout || dragStartIndex.current < 0) return;
      const sorted = [...workout.exercises].sort((a, b) => a.order - b.order);
      const totalItems = sorted.length;
      const rawTarget = dragStartIndex.current + Math.round(dy / ROW_HEIGHT);
      const clampedTarget = Math.max(0, Math.min(totalItems - 1, rawTarget));
      setDragTargetIndex(clampedTarget);
    },
    [workout]
  );

  const handleDragEnd = useCallback(() => {
    if (!workout || draggingId === null) {
      setDraggingId(null);
      setDragTargetIndex(null);
      return;
    }

    const sorted = [...workout.exercises].sort((a, b) => a.order - b.order);
    const totalItems = sorted.length;
    const fromIdx = dragStartIndex.current;
    const rawTarget = fromIdx + Math.round(currentDy.current / ROW_HEIGHT);
    const toIdx = Math.max(0, Math.min(totalItems - 1, rawTarget));

    if (fromIdx !== toIdx) {
      const newOrder = sorted.map((e) => e.exerciseId);
      const [removed] = newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, removed);
      vm.reorderExercises(workoutId, newOrder);
    }

    dragStartIndex.current = -1;
    currentDy.current = 0;
    setDraggingId(null);
    setDragTargetIndex(null);
  }, [workout, draggingId, workoutId, vm]);

  if (!workout) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
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

  const sortedEntries = [...workout.exercises].sort((a, b) => a.order - b.order);

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

  const handleEditExercise = (exerciseId: string) => {
    router.push({
      pathname: "/workouts/[id]/add-exercise",
      params: { id: workoutId, exerciseId },
    });
  };

  const handleDeleteExercise = (exerciseId: string) => {
    const exercise = vm.getExerciseById(exerciseId);
    Alert.alert(
      "Remove Exercise",
      `Remove "${exercise?.name ?? "this exercise"}" from the workout?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => vm.removeExerciseFromWorkout(workoutId, exerciseId),
        },
      ]
    );
  };

  const isDragging = draggingId !== null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={!isDragging}
      >
        {/* Workout header */}
        <View style={styles.header}>
          <Text style={styles.title}>{workout.name}</Text>
          {workout.description ? (
            <Text style={styles.description}>{workout.description}</Text>
          ) : null}
        </View>

        {/* Drop target indicator hint */}
        {isDragging && dragTargetIndex !== null && (
          <View style={styles.dragHint} pointerEvents="none">
            <Text style={styles.dragHintText}>
              Position {dragTargetIndex + 1} of {sortedEntries.length}
            </Text>
          </View>
        )}

        {/* Exercise list — flat, user-defined order, drag to reorder */}
        {sortedEntries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No exercises yet. Tap "Add Exercise" to get started.
            </Text>
          </View>
        ) : (
          <View style={styles.exerciseList}>
            {sortedEntries.map((entry, idx) => {
              const exercise = vm.getExerciseById(entry.exerciseId);
              if (!exercise) return null;
              return (
                <DraggableExerciseRow
                  key={`${entry.exerciseId}-${idx}`}
                  entry={entry}
                  exercise={exercise}
                  onEdit={handleEditExercise}
                  onDelete={handleDeleteExercise}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  isDragging={draggingId === entry.exerciseId}
                />
              );
            })}
          </View>
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

        {/* Complete Plan */}
        <Pressable
          style={styles.completePlanButton}
          onPress={() => router.replace("/")}
          accessibilityLabel="Complete plan and go to My Workouts"
        >
          <Text style={styles.completePlanButtonText}>Complete Plan</Text>
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
  scroll: {
    flex: 1,
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
  exerciseList: {
    marginBottom: 8,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 10,
    padding: 14,
    elevation: 1,
  },
  exerciseRowDragging: {
    backgroundColor: "#EFF6FF",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  dragHandle: {
    width: 20,
    height: 24,
    alignItems: "center",
    justifyContent: "space-around",
    marginRight: 10,
    paddingVertical: 2,
  },
  dragHandleLine: {
    width: 14,
    height: 2,
    backgroundColor: "#9CA3AF",
    borderRadius: 1,
  },
  exerciseRowContent: { flex: 1 },
  exerciseNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 2,
  },
  muscleGroupBadge: {
    backgroundColor: "#EFF6FF",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  muscleGroupBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563EB",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  exerciseEditHint: { fontSize: 22, color: "#9CA3AF", marginLeft: 8 },
  exerciseDeleteButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  exerciseDeleteButtonText: {
    fontSize: 16,
    color: "#DC2626",
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
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
  completePlanButton: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  completePlanButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  dragHint: {
    marginHorizontal: 20,
    marginBottom: 4,
    alignItems: "center",
  },
  dragHintText: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "600",
  },
});
