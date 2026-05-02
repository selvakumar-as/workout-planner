/**
 * Tests for the profile completeness gate on HomeScreen and WorkoutSelectScreen.
 *
 * When the user profile has no weightKg (or weightKg === 0) the app shows a
 * "Profile Incomplete" Alert instead of navigating.  When weightKg > 0 the app
 * navigates as expected.
 *
 * Strategy:
 *   - Mock all ViewModel hooks at module level so screens never touch stores.
 *   - Use jest.spyOn(Alert, 'alert') to verify Alert calls.
 *   - Access the mocked router via the imported module to verify navigation calls.
 */

import React from "react";
import { Alert } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";

// ---------------------------------------------------------------------------
// Module-level mocks — must be declared before any screen import.
// ---------------------------------------------------------------------------

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => false) },
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("../viewmodels/useSessionViewModel", () => ({
  useSessionViewModel: jest.fn(),
}));

jest.mock("../viewmodels/useWorkoutViewModel", () => ({
  useWorkoutViewModel: jest.fn(),
}));

jest.mock("../viewmodels/useUserProfileViewModel", () => ({
  useUserProfileViewModel: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import HomeScreen from "../screens/HomeScreen";
import WorkoutSelectScreen from "../screens/WorkoutSelectScreen";
import { useSessionViewModel } from "../viewmodels/useSessionViewModel";
import { useWorkoutViewModel } from "../viewmodels/useWorkoutViewModel";
import { useUserProfileViewModel } from "../viewmodels/useUserProfileViewModel";
import { router } from "expo-router";

// ---------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------

function makeSessionVm(overrides = {}) {
  return {
    activeSession: null,
    sessionHistory: [],
    isSessionActive: false,
    sessionSets: [],
    sessionStatus: null,
    autoMode: false,
    autoTimerConfig: null,
    startSession: jest.fn(),
    completeSession: jest.fn(),
    abandonSession: jest.fn(),
    logSet: jest.fn(),
    clearSession: jest.fn(),
    setAutoMode: jest.fn(),
    getSummaryForSession: jest.fn(),
    ...overrides,
  };
}

const MOCK_WORKOUT = {
  id: "workout-1",
  name: "Test",
  exercises: [{ exerciseId: "e1", sets: 3, reps: 10, order: 0 }],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

function makeWorkoutVm(overrides = {}) {
  return {
    workouts: [MOCK_WORKOUT],
    exercises: [],
    getWorkoutById: jest.fn((id: string) => (id === "workout-1" ? MOCK_WORKOUT : undefined)),
    getExerciseById: jest.fn(() => undefined),
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

function makeProfileVm(isProfileComplete: boolean) {
  return {
    profile: { soundEnabled: true },
    isProfileComplete,
    updateProfile: jest.fn(),
    setSoundEnabled: jest.fn(),
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  (useSessionViewModel as jest.Mock).mockReturnValue(makeSessionVm());
  (useWorkoutViewModel as jest.Mock).mockReturnValue(makeWorkoutVm());
  (useUserProfileViewModel as jest.Mock).mockReturnValue(makeProfileVm(true));
});

afterEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// HomeScreen — profile gate
// ---------------------------------------------------------------------------

describe("HomeScreen", () => {
  describe("handleStartWorkout", () => {
    it("should show a Profile Incomplete Alert when profile is incomplete", () => {
      (useUserProfileViewModel as jest.Mock).mockReturnValue(makeProfileVm(false));
      const alertSpy = jest.spyOn(Alert, "alert");

      const { getByLabelText } = render(<HomeScreen />);
      fireEvent.press(getByLabelText("Start a new workout session"));

      expect(alertSpy).toHaveBeenCalledWith(
        "Profile Incomplete",
        expect.any(String),
        expect.any(Array)
      );
    });

    it("should not navigate to /select-workout when profile is incomplete", () => {
      (useUserProfileViewModel as jest.Mock).mockReturnValue(makeProfileVm(false));
      jest.spyOn(Alert, "alert");

      const { getByLabelText } = render(<HomeScreen />);
      fireEvent.press(getByLabelText("Start a new workout session"));

      expect(router.push).not.toHaveBeenCalledWith("/select-workout");
    });

    it("should navigate to /select-workout when profile is complete", () => {
      (useUserProfileViewModel as jest.Mock).mockReturnValue(makeProfileVm(true));

      const { getByLabelText } = render(<HomeScreen />);
      fireEvent.press(getByLabelText("Start a new workout session"));

      expect(router.push).toHaveBeenCalledWith("/select-workout");
    });

    it("should not show an Alert when profile is complete", () => {
      (useUserProfileViewModel as jest.Mock).mockReturnValue(makeProfileVm(true));
      const alertSpy = jest.spyOn(Alert, "alert");

      const { getByLabelText } = render(<HomeScreen />);
      fireEvent.press(getByLabelText("Start a new workout session"));

      expect(alertSpy).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// WorkoutSelectScreen — profile gate
// ---------------------------------------------------------------------------

describe("WorkoutSelectScreen", () => {
  describe("handleSelectWorkout", () => {
    it("should show a Profile Incomplete Alert when profile is incomplete", () => {
      (useUserProfileViewModel as jest.Mock).mockReturnValue(makeProfileVm(false));
      const alertSpy = jest.spyOn(Alert, "alert");

      const { getByLabelText } = render(<WorkoutSelectScreen />);
      fireEvent.press(getByLabelText("Select workout Test"));

      expect(alertSpy).toHaveBeenCalledWith(
        "Profile Incomplete",
        expect.any(String),
        expect.any(Array)
      );
    });

    it("should not call startSession when profile is incomplete", () => {
      const startSession = jest.fn();
      (useSessionViewModel as jest.Mock).mockReturnValue(makeSessionVm({ startSession }));
      (useUserProfileViewModel as jest.Mock).mockReturnValue(makeProfileVm(false));

      const { getByLabelText } = render(<WorkoutSelectScreen />);
      fireEvent.press(getByLabelText("Select workout Test"));

      expect(startSession).not.toHaveBeenCalled();
    });

    it("should call startSession with the workout id when profile is complete", () => {
      const startSession = jest.fn();
      (useSessionViewModel as jest.Mock).mockReturnValue(makeSessionVm({ startSession }));
      (useUserProfileViewModel as jest.Mock).mockReturnValue(makeProfileVm(true));

      const { getByLabelText } = render(<WorkoutSelectScreen />);
      fireEvent.press(getByLabelText("Select workout Test"));

      expect(startSession).toHaveBeenCalledWith("workout-1", expect.any(Object));
    });

    it("should not show an Alert when profile is complete", () => {
      (useUserProfileViewModel as jest.Mock).mockReturnValue(makeProfileVm(true));
      const alertSpy = jest.spyOn(Alert, "alert");

      const { getByLabelText } = render(<WorkoutSelectScreen />);
      fireEvent.press(getByLabelText("Select workout Test"));

      expect(alertSpy).not.toHaveBeenCalled();
    });
  });
});
