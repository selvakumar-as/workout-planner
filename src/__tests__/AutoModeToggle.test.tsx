/**
 * Tests for the AutoModeToggle restriction in ActiveSessionScreen.
 *
 * When autoTimerConfig === null and the session is not in auto mode, the toggle
 * is disabled and a hint text "Configure auto timer first" is visible.
 * When autoTimerConfig is set (non-null), the toggle is enabled.
 *
 * Strategy:
 *   - Mock all ViewModel hooks and side-effect hooks at module level.
 *   - Use real AutoModeToggle (not mocked) so that the Switch's disabled prop
 *     and the hint text from ActiveSessionScreen are observable.
 *   - activeSession is always non-null so the screen renders its main content.
 */

import React from "react";
import { render } from "@testing-library/react-native";

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
import { useSessionViewModel } from "../viewmodels/useSessionViewModel";
import { useWorkoutViewModel } from "../viewmodels/useWorkoutViewModel";
import { useUserProfileViewModel } from "../viewmodels/useUserProfileViewModel";
import type { AutoTimerConfig } from "../types";

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
  muscleGroup: "UPPER_BODY" as const,
  isFavourite: false,
  createdAt: "2025-01-01T00:00:00.000Z",
};

const AUTO_TIMER_CONFIG: AutoTimerConfig = {
  secondsPerSet: 45,
  restBetweenSetsSecs: 60,
  restBetweenExercisesSecs: 90,
};

function makeSessionVm(autoTimerConfig: AutoTimerConfig | null, autoMode = false) {
  return {
    activeSession: {
      id: "session-1",
      workoutId: "workout-1",
      status: "IN_PROGRESS" as const,
      startedAt: "2025-01-01T10:00:00.000Z",
      sets: [],
      autoMode,
    },
    sessionHistory: [],
    isSessionActive: true,
    sessionSets: [],
    sessionStatus: "IN_PROGRESS" as const,
    autoMode,
    autoTimerConfig,
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

describe("ActiveSessionScreen", () => {
  describe("AutoModeToggle restriction", () => {
    it("should render the hint text when autoTimerConfig is null and not in auto mode", () => {
      (useSessionViewModel as jest.Mock).mockReturnValue(
        makeSessionVm(null, false)
      );

      const { getByText } = render(<ActiveSessionScreen />);

      expect(getByText("Configure auto timer first")).toBeTruthy();
    });

    it("should disable the Switch when autoTimerConfig is null and not in auto mode", () => {
      (useSessionViewModel as jest.Mock).mockReturnValue(
        makeSessionVm(null, false)
      );

      const { getByLabelText } = render(<ActiveSessionScreen />);

      // The Switch has accessibilityLabel "Switch to auto mode" when isAuto is false.
      const switchEl = getByLabelText("Switch to auto mode");
      expect(switchEl.props.disabled).toBe(true);
    });

    it("should not render the hint text when autoTimerConfig is set", () => {
      (useSessionViewModel as jest.Mock).mockReturnValue(
        makeSessionVm(AUTO_TIMER_CONFIG, false)
      );

      const { queryByText } = render(<ActiveSessionScreen />);

      expect(queryByText("Configure auto timer first")).toBeNull();
    });

    it("should enable the Switch when autoTimerConfig is set", () => {
      (useSessionViewModel as jest.Mock).mockReturnValue(
        makeSessionVm(AUTO_TIMER_CONFIG, false)
      );

      const { getByLabelText } = render(<ActiveSessionScreen />);

      const switchEl = getByLabelText("Switch to auto mode");
      expect(switchEl.props.disabled).toBe(false);
    });

    it("should not render the hint text when in auto mode (even without config)", () => {
      // When already in auto mode the screen shows the AutoModeContent instead.
      // The hint is only shown when NOT in auto mode and config is null.
      (useSessionViewModel as jest.Mock).mockReturnValue(
        makeSessionVm(null, true)
      );

      const { queryByText } = render(<ActiveSessionScreen />);

      expect(queryByText("Configure auto timer first")).toBeNull();
    });
  });
});
