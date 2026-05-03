import Constants from "expo-constants";
import React, { FC, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWorkoutViewModel } from "../viewmodels/useWorkoutViewModel";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SettingsScreenProps {}

// ---------------------------------------------------------------------------
// AccordionSection
// ---------------------------------------------------------------------------

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
}

const AccordionSection: FC<AccordionSectionProps> = ({ title, children }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.section}>
      <Pressable
        style={styles.sectionHeader}
        onPress={() => setExpanded((prev) => !prev)}
        accessibilityLabel={`${expanded ? "Collapse" : "Expand"} ${title}`}
      >
        <Text style={styles.sectionHeaderText}>{title}</Text>
        <Text style={styles.sectionChevron}>{expanded ? "▲" : "▼"}</Text>
      </Pressable>
      {expanded && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
};

// ---------------------------------------------------------------------------
// SettingsScreen
// ---------------------------------------------------------------------------

const SettingsScreen: FC<SettingsScreenProps> = () => {
  const vm = useWorkoutViewModel();
  const version = Constants.expoConfig?.version ?? "1.0.0";

  const handleExportBackup = async () => {
    try {
      const data = JSON.stringify({ workouts: vm.workouts, exercises: vm.exercises }, null, 2);
      await Share.share({
        message: data,
        title: "WorkoutPlanner Backup",
      });
    } catch {
      Alert.alert("Export Failed", "Could not export backup data.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* App info */}
        <View style={styles.appInfoRow}>
          <Text style={styles.appName}>WorkoutPlanner</Text>
          <Text style={styles.appVersion}>v{version}</Text>
        </View>

        {/* Backup */}
        <AccordionSection title="Backup">
          <Text style={styles.bodyText}>
            Export all your workout plans and exercises as a JSON file you can save or share.
          </Text>
          <Pressable
            style={styles.actionButton}
            onPress={handleExportBackup}
            accessibilityLabel="Export backup"
          >
            <Text style={styles.actionButtonText}>Export Backup</Text>
          </Pressable>
        </AccordionSection>

        {/* Help */}
        <AccordionSection title="Help">
          <Text style={styles.helpHeading}>Getting started</Text>
          <Text style={styles.bodyText}>
            Tap "Create Workout Plan" on the home screen to build a workout. Add exercises from the library, configure sets, reps, and optional rest timers, then save.
          </Text>

          <Text style={styles.helpHeading}>Starting a session</Text>
          <Text style={styles.bodyText}>
            Tap "Start Workout" from the home screen, select a workout, and follow the set-by-set guide. Use Manual mode to control each set yourself, or Auto mode to let the app time your sets automatically.
          </Text>

          <Text style={styles.helpHeading}>Auto Timer</Text>
          <Text style={styles.bodyText}>
            Configure the auto timer per workout (in the workout detail screen). Set how many seconds per set and rest periods between sets and exercises. Auto mode requires a configured timer before starting.
          </Text>

          <Text style={styles.helpHeading}>Calorie tracking</Text>
          <Text style={styles.bodyText}>
            Calories are estimated using MET values. Make sure to add your body weight in the Profile screen for accurate tracking.
          </Text>

          <Text style={styles.helpHeading}>History</Text>
          <Text style={styles.bodyText}>
            All completed and abandoned sessions appear in the History screen. Tap any session to view the full summary including sets logged and calories burned.
          </Text>
        </AccordionSection>

        {/* About */}
        <AccordionSection title="About">
          <Text style={styles.bodyText}>
            WorkoutPlanner is a personal fitness companion designed for strength training. Track your workouts, monitor your progress, and stay consistent.
          </Text>
          <Text style={styles.bodyText}>
            Version {version} — built with React Native + Expo.
          </Text>
        </AccordionSection>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

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
    paddingTop: 16,
    paddingBottom: 40,
  },
  appInfoRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  appName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  appVersion: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  sectionChevron: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  sectionBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  helpHeading: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 14,
    color: "#6B6B6B",
    lineHeight: 20,
    marginTop: 8,
  },
  actionButton: {
    marginTop: 12,
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
