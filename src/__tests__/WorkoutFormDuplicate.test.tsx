/**
 * Tests for duplicate workout name prevention in WorkoutFormScreen.
 *
 * When the user enters a name that is already taken (isWorkoutNameTaken returns
 * true), saving shows an inline error message and does NOT call addWorkout.
 * When the name is unique, addWorkout is called and the screen navigates back.
 *
 * Strategy:
 *   - Mock useWorkoutViewModel at module level.
 *   - Drive UI interactions via fireEvent.changeText / fireEvent.press.
 *   - Access the mocked router via the imported module to verify navigation.
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
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

import WorkoutFormScreen from "../screens/WorkoutFormScreen";
import { useWorkoutViewModel } from "../viewmodels/useWorkoutViewModel";
import { router } from "expo-router";

// ---------------------------------------------------------------------------
// Fixture builder
// ---------------------------------------------------------------------------

function makeWorkoutVm(overrides = {}) {
  return {
    workouts: [],
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
  // Re-install the default canGoBack behaviour after clearAllMocks resets it.
  (router.canGoBack as jest.Mock).mockReturnValue(true);
  (useWorkoutViewModel as jest.Mock).mockReturnValue(makeWorkoutVm());
});

afterEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("WorkoutFormScreen", () => {
  describe("handleSave — duplicate name", () => {
    it("should show an error message when the workout name is already taken", () => {
      const isWorkoutNameTaken = jest.fn(() => true);
      (useWorkoutViewModel as jest.Mock).mockReturnValue(
        makeWorkoutVm({ isWorkoutNameTaken })
      );

      const { getByLabelText, getByText } = render(<WorkoutFormScreen />);

      fireEvent.changeText(getByLabelText("Workout name"), "Push Day");
      fireEvent.press(getByLabelText("Save workout"));

      expect(getByText("A workout with this name already exists")).toBeTruthy();
    });

    it("should not call addWorkout when the name is already taken", () => {
      const addWorkout = jest.fn();
      const isWorkoutNameTaken = jest.fn(() => true);
      (useWorkoutViewModel as jest.Mock).mockReturnValue(
        makeWorkoutVm({ addWorkout, isWorkoutNameTaken })
      );

      const { getByLabelText } = render(<WorkoutFormScreen />);

      fireEvent.changeText(getByLabelText("Workout name"), "Push Day");
      fireEvent.press(getByLabelText("Save workout"));

      expect(addWorkout).not.toHaveBeenCalled();
    });

    it("should not navigate when the name is already taken", () => {
      const isWorkoutNameTaken = jest.fn(() => true);
      (useWorkoutViewModel as jest.Mock).mockReturnValue(
        makeWorkoutVm({ isWorkoutNameTaken })
      );

      const { getByLabelText } = render(<WorkoutFormScreen />);

      fireEvent.changeText(getByLabelText("Workout name"), "Push Day");
      fireEvent.press(getByLabelText("Save workout"));

      expect(router.back).not.toHaveBeenCalled();
    });
  });

  describe("handleSave — unique name", () => {
    it("should call addWorkout with the entered name when name is unique", () => {
      const addWorkout = jest.fn();
      const isWorkoutNameTaken = jest.fn(() => false);
      (useWorkoutViewModel as jest.Mock).mockReturnValue(
        makeWorkoutVm({ addWorkout, isWorkoutNameTaken })
      );

      const { getByLabelText } = render(<WorkoutFormScreen />);

      fireEvent.changeText(getByLabelText("Workout name"), "Pull Day");
      fireEvent.press(getByLabelText("Save workout"));

      expect(addWorkout).toHaveBeenCalledWith("Pull Day", undefined);
    });

    it("should navigate back after saving a workout with a unique name", () => {
      const isWorkoutNameTaken = jest.fn(() => false);
      (router.canGoBack as jest.Mock).mockReturnValue(true);
      (useWorkoutViewModel as jest.Mock).mockReturnValue(
        makeWorkoutVm({ isWorkoutNameTaken })
      );

      const { getByLabelText } = render(<WorkoutFormScreen />);

      fireEvent.changeText(getByLabelText("Workout name"), "Pull Day");
      fireEvent.press(getByLabelText("Save workout"));

      expect(router.back).toHaveBeenCalled();
    });

    it("should not show the duplicate error when name is unique", () => {
      const isWorkoutNameTaken = jest.fn(() => false);
      (useWorkoutViewModel as jest.Mock).mockReturnValue(
        makeWorkoutVm({ isWorkoutNameTaken })
      );

      const { getByLabelText, queryByText } = render(<WorkoutFormScreen />);

      fireEvent.changeText(getByLabelText("Workout name"), "Pull Day");
      fireEvent.press(getByLabelText("Save workout"));

      expect(
        queryByText("A workout with this name already exists")
      ).toBeNull();
    });
  });

  describe("handleSave — empty name validation", () => {
    it("should show a name required error when the name field is empty", () => {
      const { getByLabelText, getByText } = render(<WorkoutFormScreen />);

      fireEvent.press(getByLabelText("Save workout"));

      expect(getByText("Name is required")).toBeTruthy();
    });

    it("should not call addWorkout when name is empty", () => {
      const addWorkout = jest.fn();
      (useWorkoutViewModel as jest.Mock).mockReturnValue(
        makeWorkoutVm({ addWorkout })
      );

      const { getByLabelText } = render(<WorkoutFormScreen />);
      fireEvent.press(getByLabelText("Save workout"));

      expect(addWorkout).not.toHaveBeenCalled();
    });
  });
});
