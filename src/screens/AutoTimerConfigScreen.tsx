import { router, useLocalSearchParams } from "expo-router";
import React, { FC, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useWorkoutViewModel } from "../viewmodels/useWorkoutViewModel";
import { AutoTimerConfigSchema } from "../types";

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const AutoTimerConfigScreen: FC = () => {
  const { id: workoutId } = useLocalSearchParams<{ id: string }>();
  const vm = useWorkoutViewModel();
  const workout = vm.getWorkoutById(workoutId);
  const existing = workout?.autoTimerConfig;

  const [secondsPerSet, setSecondsPerSet] = useState(
    String(existing?.secondsPerSet ?? 45)
  );
  const [restBetweenSets, setRestBetweenSets] = useState(
    String(existing?.restBetweenSetsSecs ?? 60)
  );
  const [restBetweenExercises, setRestBetweenExercises] = useState(
    String(existing?.restBetweenExercisesSecs ?? 90)
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const raw = {
      secondsPerSet: Number(secondsPerSet),
      restBetweenSetsSecs: Number(restBetweenSets),
      restBetweenExercisesSecs: Number(restBetweenExercises),
    };

    const result = AutoTimerConfigSchema.safeParse(raw);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "general");
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    vm.updateWorkoutTimerConfig(workoutId, result.data);
    router.back();
  };

  const handleClear = () => {
    vm.updateWorkoutTimerConfig(workoutId, undefined);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Auto Timer Settings</Text>
          <Text style={styles.sectionSubtitle}>
            Configure how long each set runs and how long to rest between sets
            and exercises.
          </Text>

          {/* Seconds per set */}
          <View style={styles.field}>
            <Text style={styles.label}>Seconds per set (5–300)</Text>
            <TextInput
              style={[styles.input, errors.secondsPerSet !== undefined && styles.inputError]}
              value={secondsPerSet}
              onChangeText={setSecondsPerSet}
              keyboardType="number-pad"
              accessibilityLabel="Seconds per set"
              returnKeyType="next"
            />
            {errors.secondsPerSet !== undefined && (
              <Text style={styles.errorText}>{errors.secondsPerSet}</Text>
            )}
          </View>

          {/* Rest between sets */}
          <View style={styles.field}>
            <Text style={styles.label}>Rest between sets, seconds (0–600)</Text>
            <TextInput
              style={[styles.input, errors.restBetweenSetsSecs !== undefined && styles.inputError]}
              value={restBetweenSets}
              onChangeText={setRestBetweenSets}
              keyboardType="number-pad"
              accessibilityLabel="Rest between sets in seconds"
              returnKeyType="next"
            />
            {errors.restBetweenSetsSecs !== undefined && (
              <Text style={styles.errorText}>{errors.restBetweenSetsSecs}</Text>
            )}
          </View>

          {/* Rest between exercises */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Rest between exercises, seconds (0–900)
            </Text>
            <TextInput
              style={[
                styles.input,
                errors.restBetweenExercisesSecs !== undefined && styles.inputError,
              ]}
              value={restBetweenExercises}
              onChangeText={setRestBetweenExercises}
              keyboardType="number-pad"
              accessibilityLabel="Rest between exercises in seconds"
              returnKeyType="done"
            />
            {errors.restBetweenExercisesSecs !== undefined && (
              <Text style={styles.errorText}>
                {errors.restBetweenExercisesSecs}
              </Text>
            )}
          </View>

          <Pressable
            style={styles.saveButton}
            onPress={handleSave}
            accessibilityLabel="Save auto timer configuration"
          >
            <Text style={styles.saveButtonText}>Save Configuration</Text>
          </Pressable>

          {existing !== undefined && (
            <Pressable
              style={styles.clearButton}
              onPress={handleClear}
              accessibilityLabel="Clear auto timer configuration"
            >
              <Text style={styles.clearButtonText}>Clear Configuration</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AutoTimerConfigScreen;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B6B6B",
    lineHeight: 20,
    marginBottom: 28,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1A1A1A",
  },
  inputError: {
    borderColor: "#DC2626",
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  clearButton: {
    borderWidth: 1,
    borderColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  clearButtonText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "600",
  },
});
