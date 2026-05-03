/**
 * Tests for the F5 delete exercise feature in WorkoutDetailScreen.
 *
 * Covers:
 *  - Both delete buttons are visible when a workout has two exercises.
 *  - Pressing a delete button opens an Alert with a "Remove" button.
 *  - Confirming the Alert calls vm.removeExerciseFromWorkout with the correct
 *    workoutId and exerciseId.
 *
 * Strategy:
 *  - Mock useWorkoutViewModel and useLocalSearchParams.
 *  - Spy on Alert.alert to intercept confirmation dialogs.
 */

import React from "react";
import { Alert } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({ id: "workout-1" })),
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

import WorkoutDetailScreen from "../screens/WorkoutDetailScreen";
import { useWorkoutViewModel } from "../viewmodels/useWorkoutViewModel";

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

const EXERCISE_BENCH = {
  id: "ex-bench-1",
  name: "Bench Press",
  muscleGroup: "CHEST" as const,
  isTimeBased: false,
  isFavourite: false,
  createdAt: "2025-01-01T00:00:00.000Z",
};

const EXERCISE_SQUAT = {
  id: "ex-squat-1",
  name: "Barbell Squat",
  muscleGroup: "LEGS" as const,
  isTimeBased: false,
  isFavourite: false,
  createdAt: "2025-01-01T00:00:00.000Z",
};

const WORKOUT_WITH_TWO_EXERCISES = {
  id: "workout-1",
  name: "Full Body",
  exercises: [
    {
      exerciseId: EXERCISE_BENCH.id,
      order: 0,
      sets: 3,
      reps: 10,
    },
    {
      exerciseId: EXERCISE_SQUAT.id,
      order: 1,
      sets: 4,
      reps: 8,
    },
  ],
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

function makeWorkoutVm(overrides = {}) {
  return {
    workouts: [WORKOUT_WITH_TWO_EXERCISES],
    exercises: [EXERCISE_BENCH, EXERCISE_SQUAT],
    getWorkoutById: jest.fn((id: string) =>
      id === "workout-1" ? WORKOUT_WITH_TWO_EXERCISES : undefined
    ),
    getExerciseById: jest.fn((id: string) => {
      if (id === EXERCISE_BENCH.id) return EXERCISE_BENCH;
      if (id === EXERCISE_SQUAT.id) return EXERCISE_SQUAT;
      return undefined;
    }),
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
    reorderExercises: jest.fn(),
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

describe("WorkoutDetailScreen — delete exercise", () => {
  describe("delete button rendering", () => {
    it("should render the delete button for the first exercise", () => {
      const { getByLabelText } = render(<WorkoutDetailScreen />);

      expect(getByLabelText(`Delete exercise ${EXERCISE_BENCH.name}`)).toBeTruthy();
    });

    it("should render the delete button for the second exercise", () => {
      const { getByLabelText } = render(<WorkoutDetailScreen />);

      expect(getByLabelText(`Delete exercise ${EXERCISE_SQUAT.name}`)).toBeTruthy();
    });
  });

  describe("Alert on delete press", () => {
    it("should open an Alert when the delete button is pressed", () => {
      const alertSpy = jest.spyOn(Alert, "alert");

      const { getByLabelText } = render(<WorkoutDetailScreen />);
      fireEvent.press(getByLabelText(`Delete exercise ${EXERCISE_BENCH.name}`));

      expect(alertSpy).toHaveBeenCalledWith(
        "Remove Exercise",
        expect.stringContaining(EXERCISE_BENCH.name),
        expect.any(Array)
      );
    });

    it("should include a Remove button in the Alert", () => {
      const alertSpy = jest.spyOn(Alert, "alert");

      const { getByLabelText } = render(<WorkoutDetailScreen />);
      fireEvent.press(getByLabelText(`Delete exercise ${EXERCISE_BENCH.name}`));

      const [, , buttons] = alertSpy.mock.calls[0] as [
        string,
        string,
        Array<{ text: string; onPress?: () => void }>
      ];
      const removeButton = buttons.find((b) => b.text === "Remove");
      expect(removeButton).toBeDefined();
    });
  });

  describe("confirming removal", () => {
    it("should call removeExerciseFromWorkout with the correct workoutId and exerciseId when Remove is confirmed", () => {
      const removeExerciseFromWorkout = jest.fn();
      (useWorkoutViewModel as jest.Mock).mockReturnValue(
        makeWorkoutVm({ removeExerciseFromWorkout })
      );

      const alertSpy = jest
        .spyOn(Alert, "alert")
        .mockImplementation((_title, _msg, buttons) => {
          const removeBtn = (
            buttons as Array<{ text: string; onPress?: () => void }>
          ).find((b) => b.text === "Remove");
          removeBtn?.onPress?.();
        });

      const { getByLabelText } = render(<WorkoutDetailScreen />);
      fireEvent.press(getByLabelText(`Delete exercise ${EXERCISE_BENCH.name}`));

      expect(removeExerciseFromWorkout).toHaveBeenCalledWith(
        "workout-1",
        EXERCISE_BENCH.id
      );
      alertSpy.mockRestore();
    });

    it("should call removeExerciseFromWorkout with the correct id for the second exercise", () => {
      const removeExerciseFromWorkout = jest.fn();
      (useWorkoutViewModel as jest.Mock).mockReturnValue(
        makeWorkoutVm({ removeExerciseFromWorkout })
      );

      const alertSpy = jest
        .spyOn(Alert, "alert")
        .mockImplementation((_title, _msg, buttons) => {
          const removeBtn = (
            buttons as Array<{ text: string; onPress?: () => void }>
          ).find((b) => b.text === "Remove");
          removeBtn?.onPress?.();
        });

      const { getByLabelText } = render(<WorkoutDetailScreen />);
      fireEvent.press(getByLabelText(`Delete exercise ${EXERCISE_SQUAT.name}`));

      expect(removeExerciseFromWorkout).toHaveBeenCalledWith(
        "workout-1",
        EXERCISE_SQUAT.id
      );
      alertSpy.mockRestore();
    });
  });

  describe("cancelling removal", () => {
    it("should not call removeExerciseFromWorkout when Cancel is pressed", () => {
      const removeExerciseFromWorkout = jest.fn();
      (useWorkoutViewModel as jest.Mock).mockReturnValue(
        makeWorkoutVm({ removeExerciseFromWorkout })
      );

      const alertSpy = jest
        .spyOn(Alert, "alert")
        .mockImplementation((_title, _msg, buttons) => {
          const cancelBtn = (
            buttons as Array<{ text: string; onPress?: () => void }>
          ).find((b) => b.text === "Cancel");
          cancelBtn?.onPress?.();
        });

      const { getByLabelText } = render(<WorkoutDetailScreen />);
      fireEvent.press(getByLabelText(`Delete exercise ${EXERCISE_BENCH.name}`));

      expect(removeExerciseFromWorkout).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });
});
