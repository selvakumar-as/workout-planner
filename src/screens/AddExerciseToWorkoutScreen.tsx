import { router, useLocalSearchParams } from "expo-router";
import React, { FC, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { z } from "zod";
import RestTimerInput from "../components/RestTimerInput";
import SetRepInput from "../components/SetRepInput";
import { useWorkoutViewModel } from "../viewmodels/useWorkoutViewModel";
import type { Exercise, ExerciseGroup } from "../types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GROUP_LABELS: Record<ExerciseGroup, string> = {
  UPPER_BODY: "Upper Body",
  CORE: "Core",
  LOWER_BODY: "Lower Body",
};

type FilterOption = "ALL" | ExerciseGroup;

const FILTER_OPTIONS: Array<{ key: FilterOption; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "UPPER_BODY", label: "Upper Body" },
  { key: "CORE", label: "Core" },
  { key: "LOWER_BODY", label: "Lower Body" },
];

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const AddExerciseToWorkoutFormSchema = z.object({
  exerciseId: z.string().min(1, "An exercise must be selected"),
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(100),
  weightKg: z.number().min(0).max(500).optional(),
  restSeconds: z.number().int().min(0).max(600).optional(),
});

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AddExerciseToWorkoutScreenProps {}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const AddExerciseToWorkoutScreen: FC<AddExerciseToWorkoutScreenProps> = () => {
  const { id: workoutId } = useLocalSearchParams<{ id: string }>();
  const vm = useWorkoutViewModel();

  const [filter, setFilter] = useState<FilterOption>("ALL");
  const [selectedExerciseId, setSelectedExerciseId] = useState<
    string | undefined
  >(undefined);
  const [sets, setSets] = useState<number | undefined>(undefined);
  const [reps, setReps] = useState<number | undefined>(undefined);
  const [weightKg, setWeightKg] = useState<number | undefined>(undefined);
  const [restSeconds, setRestSeconds] = useState<number | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredExercises: Exercise[] =
    filter === "ALL"
      ? vm.exercises
      : vm.getExercisesByGroup(filter as ExerciseGroup);

  const handleSave = () => {
    const result = AddExerciseToWorkoutFormSchema.safeParse({
      exerciseId: selectedExerciseId ?? "",
      sets: sets,
      reps: reps,
      weightKg: weightKg,
      restSeconds: restSeconds,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    vm.addExerciseToWorkout(workoutId, {
      exerciseId: result.data.exerciseId,
      sets: result.data.sets,
      reps: result.data.reps,
      weightKg: result.data.weightKg,
      restSeconds: result.data.restSeconds,
    });
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/workouts/${workoutId}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Filter by group */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter by Muscle Group</Text>
          <View style={styles.buttonRow}>
            {FILTER_OPTIONS.map(({ key, label }) => (
              <Pressable
                key={key}
                style={[
                  styles.filterButton,
                  filter === key && styles.filterButtonActive,
                ]}
                onPress={() => setFilter(key)}
                accessibilityLabel={`Filter exercises by ${label}`}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filter === key && styles.filterButtonTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Step 2: Exercise selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Exercise *</Text>
          {filteredExercises.length === 0 ? (
            <View>
              <Text style={styles.noExercisesText}>
                No exercises in this group.
              </Text>
              <Pressable
                style={styles.addToLibraryButton}
                onPress={() => router.push("/exercises/new")}
                accessibilityLabel="Add exercise to library"
              >
                <Text style={styles.addToLibraryButtonText}>+ Add to Exercise Library</Text>
              </Pressable>
            </View>
          ) : (
            filteredExercises.map((exercise) => {
              const isSelected = selectedExerciseId === exercise.id;
              return (
                <Pressable
                  key={exercise.id}
                  style={[
                    styles.exerciseItem,
                    isSelected && styles.exerciseItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedExerciseId(exercise.id);
                    if (errors.exerciseId)
                      setErrors((prev) => ({ ...prev, exerciseId: "" }));
                  }}
                  accessibilityLabel={`Select exercise ${exercise.name}`}
                >
                  <View style={styles.exerciseItemContent}>
                    <Text
                      style={[
                        styles.exerciseName,
                        isSelected && styles.exerciseNameSelected,
                      ]}
                    >
                      {exercise.name}
                    </Text>
                    <Text
                      style={[
                        styles.exerciseGroup,
                        isSelected && styles.exerciseGroupSelected,
                      ]}
                    >
                      {GROUP_LABELS[exercise.muscleGroup]}
                    </Text>
                  </View>
                  {isSelected ? (
                    <Text style={styles.checkmark}>✓</Text>
                  ) : null}
                </Pressable>
              );
            })
          )}
          {errors.exerciseId ? (
            <Text style={styles.errorText}>{errors.exerciseId}</Text>
          ) : null}
        </View>

        {/* Step 3: Set / rep / weight / rest config */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configure</Text>
          <SetRepInput
            label="Sets *"
            value={sets}
            onChange={(v) => {
              setSets(v);
              if (errors.sets) setErrors((prev) => ({ ...prev, sets: "" }));
            }}
            min={1}
            max={20}
            placeholder="e.g. 3"
          />
          {errors.sets ? (
            <Text style={styles.errorText}>{errors.sets}</Text>
          ) : null}

          <SetRepInput
            label="Reps *"
            value={reps}
            onChange={(v) => {
              setReps(v);
              if (errors.reps) setErrors((prev) => ({ ...prev, reps: "" }));
            }}
            min={1}
            max={100}
            placeholder="e.g. 10"
          />
          {errors.reps ? (
            <Text style={styles.errorText}>{errors.reps}</Text>
          ) : null}

          <SetRepInput
            label="Weight (kg, optional)"
            value={weightKg}
            onChange={setWeightKg}
            min={0}
            max={500}
            allowDecimal
            placeholder="e.g. 60"
          />

          <RestTimerInput value={restSeconds} onChange={setRestSeconds} />
        </View>

        {/* Save button */}
        <Pressable
          style={styles.saveButton}
          onPress={handleSave}
          accessibilityLabel="Add exercise to workout"
        >
          <Text style={styles.saveButtonText}>Add to Workout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddExerciseToWorkoutScreen;

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
  section: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
  },
  filterButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  noExercisesText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontStyle: "italic",
    marginBottom: 10,
  },
  addToLibraryButton: {
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  addToLibraryButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  exerciseItemSelected: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
  },
  exerciseItemContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  exerciseNameSelected: {
    color: "#2563EB",
    fontWeight: "600",
  },
  exerciseGroup: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  exerciseGroupSelected: {
    color: "#3B82F6",
  },
  checkmark: {
    fontSize: 18,
    color: "#2563EB",
    fontWeight: "700",
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 4,
    marginBottom: 4,
  },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

