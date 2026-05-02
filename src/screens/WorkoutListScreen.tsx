import { router, Stack } from "expo-router";
import React, { FC, useState, useCallback } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWorkoutViewModel } from "../viewmodels/useWorkoutViewModel";
import type { Workout } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface WorkoutListScreenProps {}

// ---------------------------------------------------------------------------
// WorkoutRow
// ---------------------------------------------------------------------------

export interface WorkoutRowProps {
  workout: Workout;
  onPress: () => void;
  onDelete: () => void;
  isSelectMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}

const WorkoutRow: FC<WorkoutRowProps> = ({
  workout,
  onPress,
  onDelete,
  isSelectMode,
  isSelected,
  onToggleSelect,
}) => {
  const rowContent = (
    <View style={styles.rowContent}>
      <Text style={styles.rowTitle}>{workout.name}</Text>
      {workout.description ? (
        <Text style={styles.rowDescription} numberOfLines={2}>
          {workout.description}
        </Text>
      ) : null}
      <Text style={styles.rowMeta}>
        {workout.exercises.length}{" "}
        {workout.exercises.length === 1 ? "exercise" : "exercises"}
      </Text>
    </View>
  );

  if (isSelectMode) {
    return (
      <Pressable
        style={styles.row}
        onPress={onToggleSelect}
        accessibilityLabel={`${isSelected ? "Deselect" : "Select"} workout ${workout.name}`}
      >
        <View
          style={[styles.checkbox, isSelected && styles.checkboxSelected]}
        >
          {isSelected ? <View style={styles.checkboxInner} /> : null}
        </View>
        {rowContent}
      </Pressable>
    );
  }

  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityLabel={`Open workout ${workout.name}`}
    >
      {rowContent}
      <Text style={styles.rowChevron}>›</Text>
      <Pressable
        style={styles.deleteButton}
        onPress={onDelete}
        accessibilityLabel={`Delete workout ${workout.name}`}
        hitSlop={8}
      >
        <Text style={styles.deleteButtonText}>⌫</Text>
      </Pressable>
    </Pressable>
  );
};

// ---------------------------------------------------------------------------
// SelectionToolbar
// ---------------------------------------------------------------------------

interface SelectionToolbarProps {
  totalCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onUnselectAll: () => void;
  onDeleteSelected: () => void;
  onCancel: () => void;
}

const SelectionToolbar: FC<SelectionToolbarProps> = ({
  totalCount: _totalCount,
  selectedCount,
  onSelectAll,
  onUnselectAll,
  onDeleteSelected,
  onCancel,
}) => (
  <View style={styles.toolbar}>
    <Pressable
      style={styles.toolbarButton}
      onPress={onSelectAll}
      accessibilityLabel="Select all workouts"
    >
      <Text style={styles.toolbarButtonText}>Select All</Text>
    </Pressable>

    <Pressable
      style={styles.toolbarButton}
      onPress={onUnselectAll}
      accessibilityLabel="Unselect all workouts"
    >
      <Text style={styles.toolbarButtonText}>Unselect All</Text>
    </Pressable>

    <Pressable
      style={[
        styles.toolbarDeleteButton,
        selectedCount === 0 && styles.toolbarDeleteButtonDisabled,
      ]}
      onPress={onDeleteSelected}
      accessibilityLabel="Delete selected workouts"
      disabled={selectedCount === 0}
    >
      <Text style={styles.toolbarDeleteButtonText}>
        Delete Selected ({selectedCount})
      </Text>
    </Pressable>

    <Pressable
      style={styles.toolbarCancelButton}
      onPress={onCancel}
      accessibilityLabel="Cancel selection"
    >
      <Text style={styles.toolbarCancelButtonText}>Cancel</Text>
    </Pressable>
  </View>
);

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const WorkoutListScreen: FC<WorkoutListScreenProps> = () => {
  const vm = useWorkoutViewModel();

  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    new Set<string>()
  );

  const selectedCount = selectedIds.size;

  const enterSelectMode = useCallback(() => {
    setIsSelectMode(true);
    setSelectedIds(new Set<string>());
  }, []);

  const exitSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedIds(new Set<string>());
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set<string>(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set<string>(vm.workouts.map((w) => w.id)));
  }, [vm.workouts]);

  const handleUnselectAll = useCallback(() => {
    setSelectedIds(new Set<string>());
  }, []);

  const handleDeleteSelected = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    Alert.alert(
      "Delete Workouts",
      `Delete ${ids.length} workout${ids.length === 1 ? "" : "s"}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            vm.deleteWorkouts(ids);
            exitSelectMode();
          },
        },
      ]
    );
  }, [selectedIds, vm, exitSelectMode]);

  const handleRowPress = (id: string) => {
    router.push({ pathname: "/workouts/[id]", params: { id } });
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Workout",
      `Are you sure you want to delete "${name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => vm.deleteWorkout(id) },
      ]
    );
  };

  const handleFAB = () => {
    router.push("/workouts/new");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <Stack.Screen
        options={{
          headerRight: () =>
            !isSelectMode ? (
              <Pressable
                onPress={enterSelectMode}
                accessibilityLabel="Enter select mode"
                style={styles.headerSelectButton}
              >
                <Text style={styles.headerSelectButtonText}>Select</Text>
              </Pressable>
            ) : null,
        }}
      />

      {isSelectMode && (
        <SelectionToolbar
          totalCount={vm.workouts.length}
          selectedCount={selectedCount}
          onSelectAll={handleSelectAll}
          onUnselectAll={handleUnselectAll}
          onDeleteSelected={handleDeleteSelected}
          onCancel={exitSelectMode}
        />
      )}

      <FlatList<Workout>
        data={vm.workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WorkoutRow
            workout={item}
            isSelectMode={isSelectMode}
            isSelected={selectedIds.has(item.id)}
            onToggleSelect={() => toggleSelect(item.id)}
            onPress={() => handleRowPress(item.id)}
            onDelete={() => handleDelete(item.id, item.name)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No workouts yet. Tap + to create one.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {!isSelectMode && (
        <Pressable
          style={styles.fab}
          onPress={handleFAB}
          accessibilityLabel="Create new workout"
        >
          <Text style={styles.fabLabel}>+</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
};

export default WorkoutListScreen;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    elevation: 2,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  rowDescription: {
    fontSize: 13,
    color: "#6B6B6B",
    marginBottom: 4,
  },
  rowMeta: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  rowChevron: {
    fontSize: 22,
    color: "#D1D5DB",
    marginLeft: 8,
  },
  deleteButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  deleteButtonText: {
    fontSize: 16,
    color: "#DC2626",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: "#9CA3AF",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
    elevation: 6,
  },
  fabLabel: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "400",
  },
  // Header select button
  headerSelectButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerSelectButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563EB",
  },
  // Toolbar container
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F0F4FF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#BFDBFE",
    gap: 8,
  },
  // Toolbar buttons
  toolbarButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
  },
  toolbarButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
  },
  toolbarDeleteButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#DC2626",
    borderWidth: 0,
  },
  toolbarDeleteButtonDisabled: {
    opacity: 0.4,
  },
  toolbarDeleteButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  toolbarCancelButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 0,
  },
  toolbarCancelButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  // Checkbox
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "#FFFFFF",
  },
  checkboxSelected: {
    backgroundColor: "#2563EB",
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },
});
