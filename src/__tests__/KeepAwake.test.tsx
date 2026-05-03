/**
 * Tests for the useKeepAwake integration in ActiveSessionScreen.
 *
 * useKeepAwake() is called as the very first line of the component body,
 * before any early returns. This means it must be called regardless of
 * whether activeSession is null or not.
 *
 * Strategy:
 *   - Mock expo-keep-awake and verify useKeepAwake is called on every render.
 *   - Use the same full mock setup as AutoModeToggle.test.tsx to ensure the
 *     screen renders without crashing in both the active-session and
 *     no-session states.
 */

import React from "react";
import { render } from "@testing-library/react-native";

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

jest.mock("expo-keep-awake", () => ({
  useKeepAwake: jest.fn(),
}));

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => false) },
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

jest.mock("../hooks/useStopwatch", () => ({
  useStopwatch: jest.fn(() => ({
    elapsed: 0,
    start: jest.fn(),
    pause: jest.fn(),
    reset: jest.fn(),
  })),
}));

jest.mock("../hooks/useCountdown", () => ({
  useCountdown: jest.fn(() => ({
    remaining: 0,
    isDone: false,
    start: jest.fn(),
    reset: jest.fn(),
  })),
}));

jest.mock("../hooks/useWorkoutSound", () => ({
  useWorkoutSound: jest.fn(() => ({
    unlockAudio: jest.fn(),
    playSetStart: jest.fn(),
    playSetEnd: jest.fn(),
    playExerciseStart: jest.fn(),
    playExerciseEnd: jest.fn(),
    playTick: jest.fn(),
  })),
}));

jest.mock("../hooks/useAutoSession", () => ({
  useAutoSession: jest.fn(() => ({
    phase: "IDLE",
    currentExerciseIndex: 0,
    currentSetNumber: 1,
    graceRemaining: 0,
    setRemaining: 0,
    restRemaining: 0,
    start: jest.fn(),
    skipGrace: jest.fn(),
    skipRest: jest.fn(),
    stopEarly: jest.fn(),
  })),
  GRACE_PERIOD_MS: 3000,
}));

jest.mock("../hooks/useMetronomeTick", () => ({
  useMetronomeTick: jest.fn(),
}));

jest.mock("../utils/exerciseIcons", () => ({
  getExerciseIcon: jest.fn(() => 1),
}));

jest.mock("../components/GracePeriodOverlay", () => {
  const { View } = require("react-native");
  return () => <View testID="grace-period-overlay" />;
});

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import ActiveSessionScreen from "../screens/ActiveSessionScreen";
import { useKeepAwake } from "expo-keep-awake";
import { useSessionViewModel } from "../viewmodels/useSessionViewModel";
import { useWorkoutViewModel } from "../viewmodels/useWorkoutViewModel";
import { useUserProfileViewModel } from "../viewmodels/useUserProfileViewModel";

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

const EXERCISE_ID = "11111111-0000-0000-0000-000000000001";

const MOCK_WORKOUT = {
  id: "workout-1",
  name: "Push Day",
  exercises: [{ exerciseId: EXERCISE_ID, order: 0, sets: 3, reps: 10 }],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const MOCK_EXERCISE = {
  id: EXERCISE_ID,
  name: "Bench Press",
  muscleGroup: "CHEST" as const,
  isFavourite: false,
  createdAt: "2025-01-01T00:00:00.000Z",
};

function makeSessionVm(activeSession: object | null = null) {
  return {
    activeSession,
    sessionHistory: [],
    isSessionActive: activeSession !== null,
    sessionSets: [],
    sessionStatus: activeSession !== null ? ("IN_PROGRESS" as const) : null,
    autoMode: false,
    autoTimerConfig: null,
    startSession: jest.fn(),
    completeSession: jest.fn(),
    abandonSession: jest.fn(),
    logSet: jest.fn(),
    clearSession: jest.fn(),
    setAutoMode: jest.fn(),
    getSummaryForSession: jest.fn(),
  };
}

function makeWorkoutVm() {
  return {
    workouts: [MOCK_WORKOUT],
    exercises: [MOCK_EXERCISE],
    getWorkoutById: jest.fn((id: string) =>
      id === "workout-1" ? MOCK_WORKOUT : undefined
    ),
    getExerciseById: jest.fn((id: string) =>
      id === EXERCISE_ID ? MOCK_EXERCISE : undefined
    ),
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
  };
}

function makeProfileVm() {
  return {
    profile: { soundEnabled: false, weightKg: 75 },
    isProfileComplete: true,
    updateProfile: jest.fn(),
    setSoundEnabled: jest.fn(),
  };
}

const ACTIVE_SESSION = {
  id: "session-1",
  workoutId: "workout-1",
  status: "IN_PROGRESS" as const,
  startedAt: "2025-01-01T10:00:00.000Z",
  sets: [],
  autoMode: false,
};

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  (useWorkoutViewModel as jest.Mock).mockReturnValue(makeWorkoutVm());
  (useUserProfileViewModel as jest.Mock).mockReturnValue(makeProfileVm());
});

afterEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ActiveSessionScreen — useKeepAwake", () => {
  describe("when activeSession is non-null (main content rendered)", () => {
    it("should call useKeepAwake when the component renders with an active session", () => {
      (useSessionViewModel as jest.Mock).mockReturnValue(
        makeSessionVm(ACTIVE_SESSION)
      );

      render(<ActiveSessionScreen />);

      expect(useKeepAwake).toHaveBeenCalled();
    });
  });

  describe("when activeSession is null (early-return fallback rendered)", () => {
    it("should call useKeepAwake even when activeSession is null", () => {
      // useKeepAwake is the first call in the component body, before the early
      // return that guards against a null activeSession, so it must always run.
      (useSessionViewModel as jest.Mock).mockReturnValue(
        makeSessionVm(null)
      );

      render(<ActiveSessionScreen />);

      expect(useKeepAwake).toHaveBeenCalled();
    });
  });
});
