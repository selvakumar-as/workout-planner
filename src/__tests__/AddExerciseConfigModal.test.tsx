/**
 * Tests for the F3 config modal in AddExerciseToWorkoutScreen.
 *
 * Covers:
 *  - Tapping an exercise in add mode opens the modal ("Add to Workout" button
 *    becomes visible inside the modal).
 *  - Pressing Cancel in the modal dismisses it.
 *  - Duration stepper arithmetic: starting at (0 min, 30 sec), pressing
 *    "Increase minutes" once advances durationMins to 1 (visible in the tree).
 *  - Submitting with 0 total duration shows a duration error.
 *
 * Strategy:
 *  - Mock useWorkoutViewModel to return a minimal exercise list.
 *  - One time-based exercise (Plank) and one rep-based exercise (Bench Press).
 *  - Use accessibilityLabel / text queries — no snapshot tests.
 */

import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  },
  useLocalSearchParams: jest.fn(() => ({ id: "workout-1" })),
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("../viewmodels/useWorkoutViewModel", () => ({
  useWorkoutViewModel: jest.fn(),
}));

jest.mock("../utils/exerciseIcons", () => ({
  getExerciseIcon: jest.fn(() => 1),
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import AddExerciseToWorkoutScreen from "../screens/AddExerciseToWorkoutScreen";
import { useWorkoutViewModel } from "../viewmodels/useWorkoutViewModel";

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

const REP_EXERCISE = {
  id: "ex-rep-1",
  name: "Bench Press",
  muscleGroup: "CHEST" as const,
  isTimeBased: false,
  isFavourite: false,
  createdAt: "2025-01-01T00:00:00.000Z",
};

const TIME_EXERCISE = {
  id: "ex-time-1",
  name: "Plank",
  muscleGroup: "CORE" as const,
  isTimeBased: true,
  isFavourite: false,
  createdAt: "2025-01-01T00:00:00.000Z",
};

function makeWorkoutVm(overrides = {}) {
  return {
    workouts: [],
    exercises: [REP_EXERCISE, TIME_EXERCISE],
    getWorkoutById: jest.fn(() => undefined),
    getExerciseById: jest.fn((id: string) => {
      if (id === REP_EXERCISE.id) return REP_EXERCISE;
      if (id === TIME_EXERCISE.id) return TIME_EXERCISE;
      return undefined;
    }),
    getExercisesByGroup: jest.fn(() => [REP_EXERCISE, TIME_EXERCISE]),
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

describe("AddExerciseToWorkoutScreen — config modal", () => {
  describe("opening the modal", () => {
    it("should show the Add to Workout button after tapping a rep-based exercise", () => {
      const { getByLabelText } = render(<AddExerciseToWorkoutScreen />);

      fireEvent.press(getByLabelText(`Select exercise ${REP_EXERCISE.name}`));

      expect(getByLabelText("Add exercise to workout")).toBeTruthy();
    });

    it("should show the Add to Workout button after tapping a time-based exercise", () => {
      const { getByLabelText } = render(<AddExerciseToWorkoutScreen />);

      fireEvent.press(getByLabelText(`Select exercise ${TIME_EXERCISE.name}`));

      expect(getByLabelText("Add exercise to workout")).toBeTruthy();
    });
  });

  describe("Cancel button", () => {
    it("should dismiss the modal when Cancel is pressed", () => {
      const { getByLabelText, queryByLabelText } = render(
        <AddExerciseToWorkoutScreen />
      );

      fireEvent.press(getByLabelText(`Select exercise ${REP_EXERCISE.name}`));
      expect(getByLabelText("Add exercise to workout")).toBeTruthy();

      fireEvent.press(getByLabelText("Cancel"));

      expect(queryByLabelText("Add exercise to workout")).toBeNull();
    });
  });

  describe("duration stepper arithmetic", () => {
    it("should display minutes as 1 after pressing Increase minutes once (starting from 0)", async () => {
      const { getByLabelText, getAllByText } = render(<AddExerciseToWorkoutScreen />);

      fireEvent.press(getByLabelText(`Select exercise ${TIME_EXERCISE.name}`));

      await act(async () => {
        fireEvent.press(getByLabelText("Increase minutes"));
      });

      // The component renders durationMins as a Text node: <Text>{durationMins}</Text>
      // After one press from 0, the value is 1.
      const oneNodes = getAllByText("1");
      expect(oneNodes.length).toBeGreaterThan(0);
    });

    it("should call addExerciseToWorkout with durationPerSetSecs=90 when 1 min 30 sec is configured", async () => {
      const addExerciseToWorkout = jest.fn();
      (useWorkoutViewModel as jest.Mock).mockReturnValue(
        makeWorkoutVm({ addExerciseToWorkout })
      );

      const { getByLabelText } = render(<AddExerciseToWorkoutScreen />);

      // Open modal for time-based exercise (default: 0 min, 30 sec)
      fireEvent.press(getByLabelText(`Select exercise ${TIME_EXERCISE.name}`));

      // Set minutes to 1 → total = 1*60 + 30 = 90
      await act(async () => {
        fireEvent.press(getByLabelText("Increase minutes"));
      });

      // Fill in sets via the Sets * TextInput (accessibilityLabel = "Sets *")
      await act(async () => {
        fireEvent.changeText(getByLabelText("Sets *"), "3");
      });

      await act(async () => {
        fireEvent.press(getByLabelText("Add exercise to workout"));
      });

      expect(addExerciseToWorkout).toHaveBeenCalledWith(
        "workout-1",
        expect.objectContaining({ durationPerSetSecs: 90 })
      );
    });
  });

  describe("duration validation", () => {
    it("should show a duration error when submitting with 0 total duration", async () => {
      const { getByLabelText, queryByText } = render(<AddExerciseToWorkoutScreen />);

      // Open modal for time-based exercise
      fireEvent.press(getByLabelText(`Select exercise ${TIME_EXERCISE.name}`));

      // Decrease seconds from 30 to 0 (6 presses of 5 secs each)
      await act(async () => {
        fireEvent.press(getByLabelText("Decrease seconds"));
        fireEvent.press(getByLabelText("Decrease seconds"));
        fireEvent.press(getByLabelText("Decrease seconds"));
        fireEvent.press(getByLabelText("Decrease seconds"));
        fireEvent.press(getByLabelText("Decrease seconds"));
        fireEvent.press(getByLabelText("Decrease seconds"));
      });

      // Fill sets so Zod doesn't fail on sets first
      await act(async () => {
        fireEvent.changeText(getByLabelText("Sets *"), "3");
      });

      // Try to save — should show a duration-related error
      await act(async () => {
        fireEvent.press(getByLabelText("Add exercise to workout"));
      });

      // When durationPerSetSecs=0, Zod's min(1) fires with "Too small…" under
      // the durationPerSetSecs key.  The custom "Duration must be at least 1
      // second" message only fires when Zod passes (not reachable with 0).
      // Both indicate the same invalid state, so we accept either.
      const customError = queryByText("Duration must be at least 1 second");
      const zodError = queryByText(/Too small/);
      expect(customError ?? zodError).toBeTruthy();
    });

    it("should not call addExerciseToWorkout when duration is 0", async () => {
      const addExerciseToWorkout = jest.fn();
      (useWorkoutViewModel as jest.Mock).mockReturnValue(
        makeWorkoutVm({ addExerciseToWorkout })
      );

      const { getByLabelText } = render(<AddExerciseToWorkoutScreen />);

      fireEvent.press(getByLabelText(`Select exercise ${TIME_EXERCISE.name}`));

      // Decrease seconds from 30 to 0
      await act(async () => {
        for (let i = 0; i < 6; i++) {
          fireEvent.press(getByLabelText("Decrease seconds"));
        }
      });

      // Fill sets
      await act(async () => {
        fireEvent.changeText(getByLabelText("Sets *"), "3");
      });

      await act(async () => {
        fireEvent.press(getByLabelText("Add exercise to workout"));
      });

      expect(addExerciseToWorkout).not.toHaveBeenCalled();
    });
  });
});
