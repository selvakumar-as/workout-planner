import { router } from "expo-router";
import React, { FC, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";
import { useWorkoutViewModel } from "../viewmodels/useWorkoutViewModel";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const WorkoutFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Local form state (inline interface allowed within component file)
// ---------------------------------------------------------------------------

interface WorkoutFormState {
  name: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface WorkoutFormScreenProps {}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const WorkoutFormScreen: FC<WorkoutFormScreenProps> = () => {
  const vm = useWorkoutViewModel();

  const [form, setForm] = useState<WorkoutFormState>({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const trimmedName = form.name.trim();
    const trimmedDescription = form.description.trim();

    const result = WorkoutFormSchema.safeParse({
      name: trimmedName,
      description: trimmedDescription.length > 0 ? trimmedDescription : undefined,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "form");
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    vm.addWorkout(
      result.data.name,
      result.data.description
    );
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/workouts");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Workout Name *</Text>
          <TextInput
            style={[styles.textInput, errors.name ? styles.textInputError : null]}
            value={form.name}
            onChangeText={(text) => {
              setForm((prev) => ({ ...prev, name: text }));
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            placeholder="e.g. Push Day"
            placeholderTextColor="#9CA3AF"
            accessibilityLabel="Workout name"
            autoFocus
          />
          {errors.name ? (
            <Text style={styles.errorText}>{errors.name}</Text>
          ) : null}
        </View>

        {/* Description field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Description (optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textInputMultiline]}
            value={form.description}
            onChangeText={(text) =>
              setForm((prev) => ({ ...prev, description: text }))
            }
            placeholder="e.g. Chest, shoulders, triceps"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            accessibilityLabel="Workout description"
            textAlignVertical="top"
          />
        </View>

        {/* Save button */}
        <Pressable
          style={styles.saveButton}
          onPress={handleSave}
          accessibilityLabel="Save workout"
        >
          <Text style={styles.saveButtonText}>Save Workout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WorkoutFormScreen;

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
    paddingTop: 24,
    paddingBottom: 40,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    height: 46,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#1A1A1A",
    backgroundColor: "#FFFFFF",
  },
  textInputMultiline: {
    height: 88,
    paddingTop: 12,
    paddingBottom: 12,
  },
  textInputError: {
    borderColor: "#DC2626",
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 4,
  },
  saveButton: {
    marginTop: 8,
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
