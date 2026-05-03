/**
 * Tests for exercise icon rendering in AddExerciseToWorkoutScreen and
 * ActiveSessionScreen.
 *
 * Strategy:
 *   - Mock both ViewModel hooks at the module level so screens never touch
 *     real Zustand stores or MMKV.
 *   - Mock getExerciseIcon to return a stable number (1) so Image source
 *     assertions are deterministic without real asset resolution.
 *   - Use getByLabelText() to find icons via accessibilityLabel — the same
 *     property the production code sets on every exercise Image.
 */

import React from "react";
import { render } from "@testing-library/react-native";

// ---------------------------------------------------------------------------
// Module-level mocks — established before any import of the screens.
// ---------------------------------------------------------------------------

// exerciseIcons — returns a stable number so Image source is predictable.
jest.mock("../utils/exerciseIcons", () => ({
  getExerciseIcon: jest.fn(() => 1),
}));

// expo-keep-awake — ActiveSessionScreen calls useKeepAwake() at the top of
// its component body; mock it to prevent the native module from loading.
jest.mock("expo-keep-awake", () => ({
  useKeepAwake: jest.fn(),
}));

// expo-router
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => false) },
  useLocalSearchParams: jest.fn(() => ({ id: "workout-1" })),
}));

// safe-area-context — passthrough wrappers
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ViewModel hooks — mocked so screens get controlled data
jest.mock("../viewmodels/useWorkoutViewModel", () => ({
  useWorkoutViewModel: jest.fn(),
}));

jest.mock("../viewmodels/useSessionViewModel", () => ({
  useSessionViewModel: jest.fn(),
}));

jest.mock("../viewmodels/useUserProfileViewModel", () => ({
  useUserProfileViewModel: jest.fn(),
}));

// Hooks used inside ActiveSessionScreen that have side effects / timers
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

// Sub-components that are not under test
jest.mock("../components/AutoModeToggle", () => {
  const { View } = require("react-native");
  return ({ isAuto }: { isAuto: boolean }) => <View testID={`auto-toggle-${isAuto}`} />;
});

jest.mock("../components/GracePeriodOverlay", () => {
  const { View } = require("react-native");
  return () => <View testID="grace-period-overlay" />;
});

// Child components used in AddExerciseToWorkoutScreen
jest.mock("../components/SetRepInput", () => {
  const { View } = require("react-native");
  return () => <View testID="set-rep-input" />;
});

jest.mock("../components/RestTimerInput", () => {
  const { View } = require("react-native");
  return () => <View testID="rest-timer-input" />;
});

// ---------------------------------------------------------------------------
// Imports — after mocks are registered
// ---------------------------------------------------------------------------

import { useWorkoutViewModel } from "../viewmodels/useWorkoutViewModel";
import { useSessionViewModel } from "../viewmodels/useSessionViewModel";
import { useUserProfileViewModel } from "../viewmodels/useUserProfileViewModel";
import { getExerciseIcon } from "../utils/exerciseIcons";
import { useLocalSearchParams } from "expo-router";

import AddExerciseToWorkoutScreen from "../screens/AddExerciseToWorkoutScreen";
import ActiveSessionScreen from "../screens/ActiveSessionScreen";

// ---------------------------------------------------------------------------
// Shared fixture data
// ---------------------------------------------------------------------------

const BENCH_PRESS_ID = "11111111-0000-0000-0000-000000000001"; // maps to "bench" icon
const SQUAT_ID = "11111111-0000-0000-0000-000000000054";       // maps to "squat" icon
const USER_CREATED_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"; // UUID not in seed map

const MOCK_EXERCISES = [
  {
    id: BENCH_PRESS_ID,
    name: "Bench Press",
    muscleGroup: "CHEST" as const,
    isFavourite: false,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: SQUAT_ID,
    name: "Squat",
    muscleGroup: "LEGS" as const,
    isFavourite: false,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: USER_CREATED_ID,
    name: "My Custom Exercise",
    muscleGroup: "CORE" as const,
    isFavourite: false,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
];

const MOCK_WORKOUT = {
  id: "workout-1",
  name: "Full Body",
  exercises: [
    { exerciseId: BENCH_PRESS_ID, order: 0, sets: 3, reps: 10 },
    { exerciseId: SQUAT_ID, order: 1, sets: 4, reps: 8 },
  ],
  createdAt: "2025-01-01T00:00:00.000Z",
};

/** Minimal workout ViewModel return value for AddExerciseToWorkoutScreen. */
function makeWorkoutVm(overrides = {}) {
  return {
    workouts: [MOCK_WORKOUT],
    exercises: MOCK_EXERCISES,
    getWorkoutById: jest.fn((id: string) =>
      id === "workout-1" ? MOCK_WORKOUT : undefined
    ),
    getExerciseById: jest.fn((id: string) =>
      MOCK_EXERCISES.find((e) => e.id === id)
    ),
    getExercisesByGroup: jest.fn((group: string) =>
      MOCK_EXERCISES.filter((e) => e.muscleGroup === group)
    ),
    addWorkout: jest.fn(),
    addExercise: jest.fn(),
    addExerciseToWorkout: jest.fn(),
    removeExerciseFromWorkout: jest.fn(),
    updateWorkoutExercise: jest.fn(),
    updateWorkoutTimerConfig: jest.fn(),
    toggleFavourite: jest.fn(),
    ...overrides,
  };
}

/** Minimal session ViewModel return value for ActiveSessionScreen. */
function makeSessionVm(overrides = {}) {
  return {
    activeSession: {
      id: "session-1",
      workoutId: "workout-1",
      status: "IN_PROGRESS" as const,
      startedAt: "2025-01-01T10:00:00.000Z",
      sets: [],
      autoMode: false,
    },
    sessionHistory: [],
    isSessionActive: true,
    sessionSets: [],
    sessionStatus: "IN_PROGRESS" as const,
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

/** Minimal user profile ViewModel. */
function makeProfileVm() {
  return {
    profile: { soundEnabled: false, weightKg: 75 },
    updateProfile: jest.fn(),
    setSoundEnabled: jest.fn(),
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();

  // Default params: add mode (no exerciseId)
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "workout-1" });

  // Default VM setups
  (useWorkoutViewModel as jest.Mock).mockReturnValue(makeWorkoutVm());
  (useSessionViewModel as jest.Mock).mockReturnValue(makeSessionVm());
  (useUserProfileViewModel as jest.Mock).mockReturnValue(makeProfileVm());
});

afterEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// AddExerciseToWorkoutScreen icon tests
// ---------------------------------------------------------------------------

describe("AddExerciseToWorkoutScreen", () => {
  describe("exercise list icons", () => {
    it("should render an icon for each exercise shown in the list", () => {
      const { getByLabelText } = render(<AddExerciseToWorkoutScreen />);

      // The screen renders in add mode by default — all exercises are listed.
      // Each Image has accessibilityLabel={exercise.name}.
      expect(getByLabelText("Bench Press")).toBeTruthy();
      expect(getByLabelText("Squat")).toBeTruthy();
    });

    it("should call getExerciseIcon with the exercise ID for each listed exercise", () => {
      render(<AddExerciseToWorkoutScreen />);

      const calledIds = (getExerciseIcon as jest.Mock).mock.calls.map(
        (call: [string]) => call[0]
      );

      expect(calledIds).toContain(BENCH_PRESS_ID);
    });

    it("should render an icon for an exercise whose ID has no mapping in the seed map", () => {
      // USER_CREATED_ID is not in ICON_BY_EXERCISE_ID — getExerciseIcon falls
      // back to the bodyweight icon. The icon must still appear in the UI.
      const { getByLabelText } = render(<AddExerciseToWorkoutScreen />);

      expect(getByLabelText("My Custom Exercise")).toBeTruthy();
    });

    it("should pass the return value of getExerciseIcon as the image source", () => {
      // getExerciseIcon is mocked to return 1. Verify the Image element that
      // has accessibilityLabel "Bench Press" receives source={1}.
      const { getByLabelText } = render(<AddExerciseToWorkoutScreen />);

      const image = getByLabelText("Bench Press");
      // React Native Testing Library exposes props on the element.
      expect(image.props.source).toBe(1);
    });

    it("should call getExerciseIcon with the user-created exercise ID", () => {
      render(<AddExerciseToWorkoutScreen />);

      const calledIds = (getExerciseIcon as jest.Mock).mock.calls.map(
        (call: [string]) => call[0]
      );

      expect(calledIds).toContain(USER_CREATED_ID);
    });
  });
});

// ---------------------------------------------------------------------------
// ActiveSessionScreen icon tests
// ---------------------------------------------------------------------------

describe("ActiveSessionScreen", () => {
  describe("manual mode exercise icon", () => {
    it("should render an image with accessibilityLabel matching the current exercise name", () => {
      // Default session is manual mode (autoMode: false).
      // Workout's first exercise is BENCH_PRESS_ID → name "Bench Press".
      const { getByLabelText } = render(<ActiveSessionScreen />);

      // The icon sits inside the exercise progress card.
      expect(getByLabelText("Bench Press")).toBeTruthy();
    });

    it("should call getExerciseIcon with the first exercise's ID in manual mode", () => {
      render(<ActiveSessionScreen />);

      const calledIds = (getExerciseIcon as jest.Mock).mock.calls.map(
        (call: [string]) => call[0]
      );

      // The first exercise in MOCK_WORKOUT.exercises has exerciseId = BENCH_PRESS_ID.
      expect(calledIds).toContain(BENCH_PRESS_ID);
    });

    it("should pass the return value of getExerciseIcon as the image source in manual mode", () => {
      const { getByLabelText } = render(<ActiveSessionScreen />);

      const image = getByLabelText("Bench Press");
      expect(image.props.source).toBe(1);
    });
  });

  describe("no active session", () => {
    it("should render the no-session fallback when activeSession is null", () => {
      (useSessionViewModel as jest.Mock).mockReturnValue(
        makeSessionVm({ activeSession: null, isSessionActive: false })
      );

      const { getByLabelText } = render(<ActiveSessionScreen />);

      expect(getByLabelText("Go back to home")).toBeTruthy();
    });
  });
});
