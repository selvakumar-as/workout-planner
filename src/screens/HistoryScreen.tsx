import React, { FC } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useSessionViewModel } from "../viewmodels/useSessionViewModel";
import type { Session, SessionSet } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface HistoryScreenProps {}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sumCalories(sets: SessionSet[]): number {
  return sets.reduce((total, s) => total + (s.caloriesBurnt ?? 0), 0);
}

// ---------------------------------------------------------------------------
// SessionHistoryItem
// ---------------------------------------------------------------------------

interface SessionHistoryItemProps {
  session: Session;
}

const SessionHistoryItem: FC<SessionHistoryItemProps> = ({ session }) => {
  const badgeStyle =
    session.status === "COMPLETED"
      ? styles.badgeCompleted
      : session.status === "ABANDONED"
      ? styles.badgeAbandoned
      : styles.badgeInProgress;

  const totalCalories = sumCalories(session.sets);

  return (
    <Pressable
      style={styles.historyItem}
      onPress={() => router.push(`/session-summary?id=${session.id}`)}
      accessibilityLabel={`View summary for session on ${formatDate(session.startedAt)}`}
    >
      <View style={[styles.badge, badgeStyle]}>
        <Text style={styles.badgeText}>{session.status}</Text>
      </View>
      <View style={styles.historyItemInfo}>
        <Text style={styles.historyItemDate}>{formatDate(session.startedAt)}</Text>
        <Text style={styles.historyItemSets}>{session.sets.length} sets logged</Text>
        {totalCalories > 0 && (
          <Text style={styles.historyItemCalories}>{totalCalories.toFixed(1)} cal</Text>
        )}
      </View>
    </Pressable>
  );
};

// ---------------------------------------------------------------------------
// HistoryScreen
// ---------------------------------------------------------------------------

const HistoryScreen: FC<HistoryScreenProps> = () => {
  const vm = useSessionViewModel();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.push("/")}
          accessibilityLabel="Go back to home"
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Workout History</Text>
      </View>

      <FlatList<Session>
        data={vm.sessionHistory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SessionHistoryItem session={item} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No workout history yet.</Text>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

export default HistoryScreen;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2563EB",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    elevation: 2,
  },
  historyItemInfo: {
    marginLeft: 12,
  },
  historyItemDate: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  historyItemSets: {
    fontSize: 13,
    color: "#6B6B6B",
    marginTop: 2,
  },
  historyItemCalories: {
    fontSize: 12,
    color: "#D97706",
    marginTop: 2,
    fontWeight: "500",
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 90,
    alignItems: "center",
  },
  badgeCompleted: {
    backgroundColor: "#D1FAE5",
  },
  badgeAbandoned: {
    backgroundColor: "#FEE2E2",
  },
  badgeInProgress: {
    backgroundColor: "#DBEAFE",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    color: "#374151",
  },
  emptyText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 48,
  },
});
