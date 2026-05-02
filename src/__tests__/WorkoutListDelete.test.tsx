/**
 * Tests for delete workout functionality in WorkoutListScreen.
 *
 * Covers:
 *  - Delete button rendered for each workout row.
 *  - Tapping delete shows a confirmation Alert with "Delete Workout" title.
 *  - Confirming deletion calls vm.deleteWorkout with the correct workout id.
 *  - Cancelling does not call deleteWorkout.
 *
 * Strategy:
 *   - Mock useWorkoutViewModel to return controlled workout data.
 *   - Spy on Alert.alert to intercept confirmation dialog and invoke its
 *     callbacks programmatically.
 */

import React from "react";
import { Alert } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => false) },
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("../viewmodels/useWorkoutViewModel", () => ({
  useWorkoutViewModel: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import WorkoutListScreen from "../screens/WorkoutListScreen";
import { useWorkoutViewModel } from "../viewmodels/useWorkoutViewModel";

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

const WORKOUT_A = {
  id: "workout-a",
  name: "Push Day",
  exercises: [{ exerciseId: "e1", order: 0, sets: 3, reps: 10 }],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const WORKOUT_B = {
  id: "workout-b",
  name: "Pull Day",
  exercises: [],
  createdAt: "2024-01-02T00:00:00.000Z",
  updatedAt: "2024-01-02T00:00:00.000Z",
};

function makeWorkoutVm(overrides = {}) {
  return {
    workouts: [WORKOUT_A, WORKOUT_B],
    exercises: [],
    getWorkoutById: jest.fn(),
    getExerciseById: jest.fn(),
    getExercisesByGroup: jest.fn(() => []),
    addWorkout: jest.fn(),
    addExercise: jest.fn(),
    addExerciseToWorkout: jest.fn(),
    removeExerciseFromWorkout: jest.fn(),
    updateWorkoutExercise: jest.fn(),
    updateWorkoutTimerConfig: jest.fn(),
    deleteWorkout: jest.fn(),
    isWorkoutNameTaken: jest.fn(() => false),
    toggleFavourite: jest.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  (useWorkoutViewModel as jest.Mock).mockReturnValue(makeWorkoutVm());
});

afterEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("WorkoutListScreen", () => {
  describe("delete button rendering", () => {
    it("should render a delete button for the first workout", () => {
      const { getByLabelText } = render(<WorkoutListScreen />);

      expect(getByLabelText("Delete workout Push Day")).toBeTruthy();
    });

    it("should render a delete button for the second workout", () => {
      const { getByLabelText } = render(<WorkoutListScreen />);

      expect(getByLabelText("Delete workout Pull Day")).toBeTruthy();
    });
  });

  describe("delete confirmation Alert", () => {
    it("should show a Delete Workout Alert when the delete button is pressed", () => {
      const alertSpy = jest.spyOn(Alert, "alert");

      const { getByLabelText } = render(<WorkoutListScreen />);
      fireEvent.press(getByLabelText("Delete workout Push Day"));

      expect(alertSpy).toHaveBeenCalledWith(
        "Delete Workout",
        expect.stringContaining("Push Day"),
        expect.any(Array)
      );
    });

    it("should include the workout name in the Alert message", () => {
      const alertSpy = jest.spyOn(Alert, "alert");

      const { getByLabelText } = render(<WorkoutListScreen />);
      fireEvent.press(getByLabelText("Delete workout Push Day"));

      const [, message] = alertSpy.mock.calls[0];
      expect(message).toContain("Push Day");
    });
  });

  describe("confirming deletion", () => {
    it("should call deleteWorkout with the correct workout id when Delete is confirmed", () => {
      const deleteWorkout = jest.fn();
      (useWorkoutViewModel as jest.Mock).mockReturnValue(
        makeWorkoutVm({ deleteWorkout })
      );

      const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(
        (_title, _msg, buttons) => {
          // Invoke the destructive "Delete" button (index 1)
          const deleteButton = (buttons as { text: string; onPress?: () => void }[]).find(
            (b) => b.text === "Delete"
          );
          deleteButton?.onPress?.();
        }
      );

      const { getByLabelText } = render(<WorkoutListScreen />);
      fireEvent.press(getByLabelText("Delete workout Push Day"));

      expect(deleteWorkout).toHaveBeenCalledWith("workout-a");
      alertSpy.mockRestore();
    });

    it("should call deleteWorkout with the correct id when the second workout is deleted", () => {
      const deleteWorkout = jest.fn();
      (useWorkoutViewModel as jest.Mock).mockReturnValue(
        makeWorkoutVm({ deleteWorkout })
      );

      const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(
        (_title, _msg, buttons) => {
          const deleteButton = (buttons as { text: string; onPress?: () => void }[]).find(
            (b) => b.text === "Delete"
          );
          deleteButton?.onPress?.();
        }
      );

      const { getByLabelText } = render(<WorkoutListScreen />);
      fireEvent.press(getByLabelText("Delete workout Pull Day"));

      expect(deleteWorkout).toHaveBeenCalledWith("workout-b");
      alertSpy.mockRestore();
    });
  });

  describe("cancelling deletion", () => {
    it("should not call deleteWorkout when Cancel is pressed", () => {
      const deleteWorkout = jest.fn();
      (useWorkoutViewModel as jest.Mock).mockReturnValue(
        makeWorkoutVm({ deleteWorkout })
      );

      // Intercept and invoke the Cancel button instead.
      const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(
        (_title, _msg, buttons) => {
          const cancelButton = (buttons as { text: string; onPress?: () => void }[]).find(
            (b) => b.text === "Cancel"
          );
          cancelButton?.onPress?.();
        }
      );

      const { getByLabelText } = render(<WorkoutListScreen />);
      fireEvent.press(getByLabelText("Delete workout Push Day"));

      expect(deleteWorkout).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });
});
