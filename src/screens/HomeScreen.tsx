import React, { FC } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSessionViewModel } from "../hooks/useSessionViewModel";
import type { Session } from "../types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Placeholder workoutId used until a real workout-selection flow is built. */
const PLACEHOLDER_WORKOUT_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const MAX_HISTORY_ITEMS = 5;

// ---------------------------------------------------------------------------
// Sub-component types
// ---------------------------------------------------------------------------

export interface SessionHistoryItemProps {
  session: Session;
}

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

// ---------------------------------------------------------------------------
// SessionHistoryItem (not exported as a screen, so SafeAreaView is NOT used)
// ---------------------------------------------------------------------------

const SessionHistoryItem: FC<SessionHistoryItemProps> = ({ session }) => {
  const badgeStyle =
    session.status === "COMPLETED"
      ? styles.badgeCompleted
      : session.status === "ABANDONED"
      ? styles.badgeAbandoned
      : styles.badgeInProgress;

  return (
    <View style={styles.historyItem}>
      <View style={[styles.badge, badgeStyle]}>
        <Text style={styles.badgeText}>{session.status}</Text>
      </View>
      <View style={styles.historyItemInfo}>
        <Text style={styles.historyItemDate}>{formatDate(session.startedAt)}</Text>
        <Text style={styles.historyItemSets}>{session.sets.length} sets logged</Text>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// HomeScreen props
// ---------------------------------------------------------------------------

export interface HomeScreenProps {}

// ---------------------------------------------------------------------------
// HomeScreen
// ---------------------------------------------------------------------------

const HomeScreen: FC<HomeScreenProps> = () => {
  const vm = useSessionViewModel();

  const recentSessions = vm.sessionHistory.slice(0, MAX_HISTORY_ITEMS);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.title}>WorkoutPlanner</Text>
      </View>

      {/* Active session section */}
      {vm.isSessionActive && (
        <View style={styles.activeSessionCard}>
          <Text style={styles.activeSessionTitle}>Active Session</Text>
          <Text style={styles.activeSessionStatus}>
            Status: {vm.sessionStatus ?? "—"}
          </Text>
          <View style={styles.activeSessionActions}>
            <Pressable
              style={[styles.button, styles.buttonComplete]}
              onPress={() => vm.completeSession()}
              accessibilityLabel="Complete active session"
            >
              <Text style={styles.buttonText}>Complete</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonAbandon]}
              onPress={() => vm.abandonSession()}
              accessibilityLabel="Abandon active session"
            >
              <Text style={styles.buttonText}>Abandon</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Start Workout button */}
      {!vm.isSessionActive && (
        <Pressable
          style={[styles.button, styles.buttonStart]}
          onPress={() => vm.startSession(PLACEHOLDER_WORKOUT_ID)}
          accessibilityLabel="Start a new workout session"
        >
          <Text style={styles.buttonText}>Start Workout</Text>
        </Pressable>
      )}

      {/* Recent sessions */}
      <Text style={styles.sectionTitle}>Recent Sessions</Text>
      <FlatList<Session>
        data={recentSessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SessionHistoryItem session={item} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No sessions yet. Start your first workout!</Text>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;

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
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  // ---- History item ----
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
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
  // ---- Status badges ----
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
  // ---- Buttons ----
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonStart: {
    backgroundColor: "#2563EB",
    marginHorizontal: 20,
    marginTop: 12,
  },
  buttonComplete: {
    flex: 1,
    backgroundColor: "#059669",
    marginRight: 8,
  },
  buttonAbandon: {
    flex: 1,
    backgroundColor: "#DC2626",
    marginLeft: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // ---- Active session card ----
  activeSessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeSessionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  activeSessionStatus: {
    fontSize: 14,
    color: "#6B6B6B",
    marginBottom: 12,
  },
  activeSessionActions: {
    flexDirection: "row",
  },
  // ---- Empty state ----
  emptyText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 24,
  },
});
