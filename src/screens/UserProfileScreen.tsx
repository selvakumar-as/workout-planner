import React, { FC, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { useUserProfileViewModel } from "../viewmodels/useUserProfileViewModel";
import type { Gender } from "../types/userProfile";

export interface UserProfileScreenProps {}

const GENDERS: { label: string; value: Gender }[] = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Other", value: "OTHER" },
];

const UserProfileScreen: FC<UserProfileScreenProps> = () => {
  const vm = useUserProfileViewModel();
  const { profile } = vm;

  const [name, setName] = useState(profile.name ?? "");
  const [age, setAge] = useState(profile.age !== undefined ? String(profile.age) : "");
  const [gender, setGender] = useState<Gender | undefined>(profile.gender);
  const [heightCm, setHeightCm] = useState(
    profile.heightCm !== undefined ? String(profile.heightCm) : ""
  );
  const [weightKg, setWeightKg] = useState(
    profile.weightKg !== undefined ? String(profile.weightKg) : ""
  );
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const newErrors: Record<string, string> = {};

    if (name.length > 0 && name.trim().length === 0) {
      newErrors.name = 'Name cannot be only spaces';
    }

    const ageNum = age === '' ? undefined : parseInt(age, 10);
    if (age !== '' && (isNaN(ageNum!) || ageNum! <= 0)) {
      newErrors.age = 'Age must be a positive number';
    }

    const heightNum = heightCm === '' ? undefined : parseInt(heightCm, 10);
    if (heightCm !== '' && (isNaN(heightNum!) || heightNum! <= 0)) {
      newErrors.heightCm = 'Height must be a positive number';
    }

    const weightNum = weightKg === '' ? undefined : parseInt(weightKg, 10);
    if (weightKg !== '' && (isNaN(weightNum!) || weightNum! <= 0)) {
      newErrors.weightKg = 'Weight must be a positive number';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    vm.updateProfile({
      name: name.trim() || undefined,
      age: ageNum,
      gender,
      heightCm: heightNum,
      weightKg: weightNum,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "My Profile",
          headerLeft: () => (
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
              accessibilityLabel="Go back"
              style={styles.headerBackButton}
            >
              <Text style={styles.headerBackButtonText}>‹ Back</Text>
            </Pressable>
          ),
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={styles.heading}>My Profile</Text>

          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={[styles.input, errors.name ? styles.inputError : null]}
              value={name}
              onChangeText={(text) => setName(text.replace(/[^a-zA-Z0-9 ]/g, ''))}
              placeholder="Your name"
              placeholderTextColor="#9CA3AF"
              autoCorrect={false}
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </View>

          {/* Age */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={[styles.input, errors.age ? styles.inputError : null]}
              value={age}
              onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 28"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
            />
            {errors.age ? <Text style={styles.errorText}>{errors.age}</Text> : null}
          </View>

          {/* Gender */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.toggleRow}>
              {GENDERS.map((g) => (
                <Pressable
                  key={g.value}
                  style={[
                    styles.toggleOption,
                    gender === g.value && styles.toggleOptionActive,
                  ]}
                  onPress={() => setGender(g.value)}
                  accessibilityLabel={`Select gender ${g.label}`}
                >
                  <Text
                    style={[
                      styles.toggleOptionText,
                      gender === g.value && styles.toggleOptionTextActive,
                    ]}
                  >
                    {g.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Height */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={[styles.input, errors.heightCm ? styles.inputError : null]}
              value={heightCm}
              onChangeText={(text) => setHeightCm(text.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 175"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
            />
            {errors.heightCm ? <Text style={styles.errorText}>{errors.heightCm}</Text> : null}
          </View>

          {/* Weight */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={[styles.input, errors.weightKg ? styles.inputError : null]}
              value={weightKg}
              onChangeText={(text) => setWeightKg(text.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 75.5"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
            />
            {errors.weightKg ? <Text style={styles.errorText}>{errors.weightKg}</Text> : null}
          </View>

          {/* Sound toggle — live update so it takes effect immediately */}
          <View style={styles.soundRow}>
            <Text style={styles.soundLabel}>Metronome Sound</Text>
            <Switch
              value={profile.soundEnabled}
              onValueChange={(v) => vm.setSoundEnabled(v)}
              trackColor={{ false: "#D1D5DB", true: "#BFDBFE" }}
              thumbColor={profile.soundEnabled ? "#2563EB" : "#9CA3AF"}
              accessibilityLabel="Toggle metronome sound"
            />
          </View>

          {/* Save button */}
          <Pressable
            style={[styles.saveButton, saved && styles.saveButtonSaved]}
            onPress={handleSave}
            accessibilityLabel="Save profile"
          >
            <Text style={styles.saveButtonText}>
              {saved ? "Saved!" : "Save Profile"}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default UserProfileScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerBackButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  headerBackButtonText: {
    fontSize: 17,
    color: "#2563EB",
    fontWeight: "500",
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1A1A1A",
  },
  toggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  toggleOption: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 12,
    alignItems: "center",
  },
  toggleOptionActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  toggleOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  toggleOptionTextActive: {
    color: "#FFFFFF",
  },
  soundRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 24,
  },
  soundLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  saveButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonSaved: {
    backgroundColor: "#059669",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  inputError: {
    borderColor: '#DC2626',
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
});
