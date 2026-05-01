import React, { FC } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useSessionViewModel } from "../viewmodels/useSessionViewModel";
import type { ExerciseSummaryItem } from "../types/sessionSummary";
import type { SessionSet } from "../types/session";

export interface SessionSummaryScreenProps {}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(totalSecs: number): string {
  const minutes = Math.floor(totalSecs / 60);
  const seconds = totalSecs % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${mm}:${ss}`;
}

interface SetRowProps {
  set: SessionSet;
  index: number;
}

const SetRow: FC<SetRowProps> = ({ set, index }) => (
  <View style={styles.setRow}>
    <Text style={styles.setRowLabel}>Set {index + 1}</Text>
    <Text style={styles.setRowDetail}>
      {set.reps} reps
      {set.weightKg !== undefined ? ` · ${set.weightKg} kg` : ""}
      {set.durationSecs !== undefined && set.durationSecs > 0
        ? ` · ${formatDuration(set.durationSecs)}`
        : ""}
      {set.caloriesBurnt !== undefined && set.caloriesBurnt > 0
        ? ` · ${set.caloriesBurnt.toFixed(1)} cal`
        : ""}
    </Text>
  </View>
);

interface ExerciseRowProps {
  item: ExerciseSummaryItem;
}

const ExerciseRow: FC<ExerciseRowProps> = ({ item }) => (
  <View style={styles.exerciseRow}>
    <View style={styles.exerciseRowHeader}>
      <View style={styles.exerciseRowLeft}>
        <Text style={styles.exerciseRowName}>{item.exerciseName}</Text>
        <Text style={styles.exerciseRowSets}>
          {item.setsCompleted} sets · {item.totalReps} reps
        </Text>
      </View>
      <View style={styles.exerciseRowRight}>
        {item.totalDurationSecs > 0 && (
          <Text style={styles.exerciseRowStat}>{formatDuration(item.totalDurationSecs)}</Text>
        )}
        {item.totalCalories > 0 && (
          <Text style={styles.exerciseRowCalories}>{item.totalCalories.toFixed(1)} cal</Text>
        )}
      </View>
    </View>
    {item.sets.length > 0 && (
      <View style={styles.setRowsContainer}>
        {item.sets.map((set, idx) => (
          <SetRow key={set.id} set={set} index={idx} />
        ))}
      </View>
    )}
  </View>
);

const SessionSummaryScreen: FC<SessionSummaryScreenProps> = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vm = useSessionViewModel();

  const sessionId = Array.isArray(id) ? id[0] : id;
  const summary = sessionId !== undefined ? vm.getSummaryForSession(sessionId) : null;

  if (summary === null) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <Stack.Screen
          options={{
            title: "Session Summary",
            headerLeft: () => (
              <Pressable
                onPress={() => router.replace("/")}
                accessibilityLabel="Go back to home"
                style={styles.headerBackButton}
              >
                <Text style={styles.headerBackButtonText}>‹ Home</Text>
              </Pressable>
            ),
          }}
        />
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>Session not found</Text>
          <Pressable
            style={styles.backButton}
            onPress={() => router.replace("/")}
            accessibilityLabel="Go back to home"
          >
            <Text style={styles.backButtonText}>Back to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: "Session Summary",
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace("/")}
              accessibilityLabel="Go back to home"
              style={styles.headerBackButton}
            >
              <Text style={styles.headerBackButtonText}>‹ Home</Text>
            </Pressable>
          ),
        }}
      />
      <FlatList<ExerciseSummaryItem>
        data={summary.exercises}
        keyExtractor={(item) => item.exerciseId}
        renderItem={({ item }) => <ExerciseRow item={item} />}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <Text style={styles.workoutName}>{summary.workoutName}</Text>
            <Text style={styles.date}>{formatDate(summary.startedAt)}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatDuration(summary.totalDurationSecs)}</Text>
                <Text style={styles.statLabel}>Total Time</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, styles.statValueCalories]}>
                  {summary.totalCalories.toFixed(1)}
                </Text>
                <Text style={styles.statLabel}>cal</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Exercises</Text>
          </>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No sets logged in this session.</Text>
        }
        ListFooterComponent={
          <Pressable
            style={styles.homeButton}
            onPress={() => router.replace("/")}
            accessibilityLabel="Go back to home"
          >
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </Pressable>
        }
      />
    </SafeAreaView>
  );
};

export default SessionSummaryScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  notFoundText: {
    fontSize: 16,
    color: "#6B6B6B",
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  workoutName: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: "#6B6B6B",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2563EB",
    fontVariant: ["tabular-nums"],
  },
  statValueCalories: {
    color: "#D97706",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B6B6B",
    marginTop: 4,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 10,
  },
  exerciseRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  exerciseRowHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseRowLeft: {
    flex: 1,
  },
  exerciseRowName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  exerciseRowSets: {
    fontSize: 13,
    color: "#6B6B6B",
    marginTop: 2,
  },
  exerciseRowRight: {
    alignItems: "flex-end",
  },
  exerciseRowStat: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  exerciseRowCalories: {
    fontSize: 12,
    color: "#D97706",
    fontWeight: "500",
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 16,
  },
  homeButton: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  homeButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  headerBackButton: { paddingHorizontal: 4, paddingVertical: 4 },
  headerBackButtonText: { fontSize: 17, color: "#2563EB", fontWeight: "500" },
  setRowsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    paddingVertical: 4,
  },
  setRowLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B6B6B",
    width: 42,
  },
  setRowDetail: {
    fontSize: 12,
    color: "#374151",
    flex: 1,
  },
});
