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
import type { Equipment, ExerciseGroup } from "../types";
import { EquipmentValues, ExerciseGroupValues } from "../types";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const AddExerciseFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  muscleGroup: z.enum(["UPPER_BODY", "CORE", "LOWER_BODY"], {
    errorMap: () => ({ message: "Muscle group is required" }),
  }),
  equipment: z.array(z.enum(["BARBELL", "DUMBBELL", "BODYWEIGHT", "CABLE", "MACHINE"])).optional(),
});

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

const GROUP_LABELS: Record<ExerciseGroup, string> = {
  UPPER_BODY: "Upper Body",
  CORE: "Core",
  LOWER_BODY: "Lower Body",
};

const EQUIPMENT_LABELS: Record<Equipment, string> = {
  BARBELL: "Barbell",
  DUMBBELL: "Dumbbell",
  BODYWEIGHT: "Bodyweight",
  CABLE: "Cable",
  MACHINE: "Machine",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AddExerciseScreenProps {}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const AddExerciseScreen: FC<AddExerciseScreenProps> = () => {
  const vm = useWorkoutViewModel();

  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<ExerciseGroup | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleEquipment = (equipment: Equipment) => {
    setSelectedEquipment((prev) =>
      prev.includes(equipment)
        ? prev.filter((e) => e !== equipment)
        : [...prev, equipment]
    );
  };

  const handleSave = () => {
    const result = AddExerciseFormSchema.safeParse({
      name: name.trim(),
      muscleGroup: muscleGroup ?? undefined,
      equipment: selectedEquipment.length > 0 ? selectedEquipment : undefined,
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
    vm.addExercise(
      result.data.name,
      result.data.muscleGroup,
      result.data.equipment
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
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace("/workouts")}
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <Text style={styles.title}>New Exercise</Text>
        </View>

        {/* Name field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Exercise Name *</Text>
          <TextInput
            style={[styles.textInput, errors.name ? styles.textInputError : null]}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            placeholder="e.g. Bench Press"
            placeholderTextColor="#9CA3AF"
            accessibilityLabel="Exercise name"
          />
          {errors.name ? (
            <Text style={styles.errorText}>{errors.name}</Text>
          ) : null}
        </View>

        {/* Muscle group selection */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Muscle Group *</Text>
          <View style={styles.buttonRow}>
            {(Object.keys(ExerciseGroupValues) as ExerciseGroup[]).map((group) => (
              <Pressable
                key={group}
                style={[
                  styles.toggleButton,
                  muscleGroup === group && styles.toggleButtonActive,
                ]}
                onPress={() => {
                  setMuscleGroup(group);
                  if (errors.muscleGroup)
                    setErrors((prev) => ({ ...prev, muscleGroup: "" }));
                }}
                accessibilityLabel={`Select muscle group ${GROUP_LABELS[group]}`}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    muscleGroup === group && styles.toggleButtonTextActive,
                  ]}
                >
                  {GROUP_LABELS[group]}
                </Text>
              </Pressable>
            ))}
          </View>
          {errors.muscleGroup ? (
            <Text style={styles.errorText}>{errors.muscleGroup}</Text>
          ) : null}
        </View>

        {/* Equipment selection */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Equipment (optional)</Text>
          <View style={styles.buttonRow}>
            {(Object.keys(EquipmentValues) as Equipment[]).map((eq) => (
              <Pressable
                key={eq}
                style={[
                  styles.toggleButton,
                  selectedEquipment.includes(eq) && styles.toggleButtonActive,
                ]}
                onPress={() => toggleEquipment(eq)}
                accessibilityLabel={`Toggle equipment ${EQUIPMENT_LABELS[eq]}`}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    selectedEquipment.includes(eq) &&
                      styles.toggleButtonTextActive,
                  ]}
                >
                  {EQUIPMENT_LABELS[eq]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Save button */}
        <Pressable
          style={styles.saveButton}
          onPress={handleSave}
          accessibilityLabel="Save exercise"
        >
          <Text style={styles.saveButtonText}>Save Exercise</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddExerciseScreen;

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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: "#2563EB",
    fontWeight: "500",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  fieldGroup: {
    marginHorizontal: 20,
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
  textInputError: {
    borderColor: "#DC2626",
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  toggleButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
  },
  toggleButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  toggleButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  toggleButtonTextActive: {
    color: "#FFFFFF",
  },
  saveButton: {
    marginHorizontal: 20,
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
