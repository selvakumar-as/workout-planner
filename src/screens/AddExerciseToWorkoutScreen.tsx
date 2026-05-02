import { router, useLocalSearchParams } from "expo-router";
import React, { FC, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import RestTimerInput from "../components/RestTimerInput";
import SetRepInput from "../components/SetRepInput";
import { useWorkoutViewModel } from "../viewmodels/useWorkoutViewModel";
import type { Exercise, ExerciseGroup } from "../types";
import { getExerciseIcon } from "../utils/exerciseIcons";

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
  reps: z.number().int().min(1).max(100).optional(),
  durationPerSetSecs: z.number().int().min(1).max(3600).optional(),
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
  const { id: workoutId, exerciseId } = useLocalSearchParams<{ id: string; exerciseId?: string }>();
  const isEditMode = typeof exerciseId === "string" && exerciseId.length > 0;
  const vm = useWorkoutViewModel();
  const { toggleFavourite } = vm;

  const existingEntry = isEditMode
    ? vm.getWorkoutById(workoutId)?.exercises.find((e) => e.exerciseId === exerciseId)
    : undefined;
  const lockedExercise = isEditMode && exerciseId !== undefined
    ? vm.getExerciseById(exerciseId)
    : undefined;

  const [filter, setFilter] = useState<FilterOption>("ALL");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | undefined>(
    isEditMode ? exerciseId : undefined
  );
  const [sets, setSets] = useState<number | undefined>(existingEntry?.sets);
  const [reps, setReps] = useState<number | undefined>(existingEntry?.reps);
  const [durationPerSetSecs, setDurationPerSetSecs] = useState<number | undefined>(existingEntry?.durationPerSetSecs);
  const [weightKg, setWeightKg] = useState<number | undefined>(existingEntry?.weightKg);
  const [restSeconds, setRestSeconds] = useState<number | undefined>(existingEntry?.restSeconds);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredExercises: Exercise[] =
    filter === "ALL"
      ? vm.exercises
      : vm.getExercisesByGroup(filter as ExerciseGroup);

  const selectedExercise = selectedExerciseId !== undefined
    ? vm.getExerciseById(selectedExerciseId)
    : undefined;
  const isTimeBased = selectedExercise?.isTimeBased ?? false;

  const handleSave = () => {
    const result = AddExerciseToWorkoutFormSchema.safeParse({
      exerciseId: selectedExerciseId ?? "",
      sets: sets,
      reps: isTimeBased ? 1 : reps,
      durationPerSetSecs: isTimeBased ? durationPerSetSecs : undefined,
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

    // Additional cross-field validation
    if (isTimeBased && (durationPerSetSecs === undefined || durationPerSetSecs <= 0)) {
      setErrors({ durationPerSetSecs: "Duration per set is required" });
      return;
    }
    if (!isTimeBased && (reps === undefined || reps <= 0)) {
      setErrors({ reps: "Reps is required" });
      return;
    }

    setErrors({});
    if (isEditMode && exerciseId !== undefined) {
      vm.updateWorkoutExercise(workoutId, exerciseId, {
        sets: result.data.sets,
        reps: isTimeBased ? 1 : result.data.reps,
        durationPerSetSecs: isTimeBased ? durationPerSetSecs : undefined,
        weightKg: result.data.weightKg,
        restSeconds: result.data.restSeconds,
      });
    } else {
      vm.addExerciseToWorkout(workoutId, {
        exerciseId: result.data.exerciseId,
        sets: result.data.sets,
        reps: isTimeBased ? 1 : (result.data.reps ?? 1),
        durationPerSetSecs: isTimeBased ? durationPerSetSecs : undefined,
        weightKg: result.data.weightKg,
        restSeconds: result.data.restSeconds,
      });
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/workouts/${workoutId}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {isEditMode ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exercise</Text>
            <View style={[styles.exerciseItem, styles.exerciseItemSelected]}>
              <View style={styles.exerciseItemContent}>
                <Text style={[styles.exerciseName, styles.exerciseNameSelected]}>
                  {lockedExercise?.name ?? "Unknown Exercise"}
                </Text>
                <Text style={[styles.exerciseGroup, styles.exerciseGroupSelected]}>
                  {lockedExercise !== undefined ? GROUP_LABELS[lockedExercise.muscleGroup] : ""}
                </Text>
              </View>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          </View>
        ) : (
          <>
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
                      <Pressable
                        onPress={() => toggleFavourite(exercise.id)}
                        style={styles.favouriteButton}
                        accessibilityLabel={exercise.isFavourite ? `Remove ${exercise.name} from favourites` : `Add ${exercise.name} to favourites`}
                        hitSlop={8}
                      >
                        <Text style={[styles.starIcon, exercise.isFavourite ? styles.starIconActive : undefined]}>
                          {exercise.isFavourite ? '★' : '☆'}
                        </Text>
                      </Pressable>
                      <Image
                        source={getExerciseIcon(exercise.id)}
                        style={styles.exerciseIcon}
                        accessibilityLabel={exercise.name}
                      />
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
          </>
        )}

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

          {isTimeBased ? (
            <>
              <SetRepInput
                label="Duration per Set (seconds) *"
                value={durationPerSetSecs}
                onChange={(v) => {
                  setDurationPerSetSecs(v);
                  if (errors.durationPerSetSecs) setErrors((prev) => ({ ...prev, durationPerSetSecs: "" }));
                }}
                min={10}
                max={3600}
                placeholder="e.g. 30"
              />
              {errors.durationPerSetSecs ? (
                <Text style={styles.errorText}>{errors.durationPerSetSecs}</Text>
              ) : null}
            </>
          ) : (
            <>
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
            </>
          )}

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
          accessibilityLabel={isEditMode ? "Save exercise changes" : "Add exercise to workout"}
        >
          <Text style={styles.saveButtonText}>
            {isEditMode ? "Save Changes" : "Add to Workout"}
          </Text>
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
  scroll: {
    flex: 1,
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
  favouriteButton: {
    padding: 6,
    marginRight: 4,
  },
  starIcon: {
    fontSize: 20,
    color: '#D1D5DB',
  },
  starIconActive: {
    color: '#F59E0B',
  },
  exerciseIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 10,
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

