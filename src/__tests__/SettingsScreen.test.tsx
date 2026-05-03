/**
 * Tests for the F7 SettingsScreen.
 *
 * Covers:
 *  - Section headers "Backup", "Help", "About" are visible on render.
 *  - Tapping "Backup" expands the section and reveals the "Export Backup" button.
 *  - Tapping "Export Backup" calls Share.share with a JSON payload containing
 *    "workouts" and "exercises" keys.
 *  - The app version string (mocked as "9.9.9") is displayed.
 *
 * Strategy:
 *  - Mock useWorkoutViewModel to return empty arrays.
 *  - Mock Share.share with jest.fn().
 *  - Mock expo-constants to inject version "9.9.9".
 */

import React from "react";
import { Share } from "react-native";
import { render, fireEvent, act } from "@testing-library/react-native";

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("../viewmodels/useWorkoutViewModel", () => ({
  useWorkoutViewModel: jest.fn(),
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: { version: "9.9.9" },
  },
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import SettingsScreen from "../screens/SettingsScreen";
import { useWorkoutViewModel } from "../viewmodels/useWorkoutViewModel";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeWorkoutVm(overrides = {}) {
  return {
    workouts: [],
    exercises: [],
    getWorkoutById: jest.fn(() => undefined),
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

describe("SettingsScreen", () => {
  describe("section headers", () => {
    it("should render the Backup section header", () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText("Backup")).toBeTruthy();
    });

    it("should render the Help section header", () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText("Help")).toBeTruthy();
    });

    it("should render the About section header", () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText("About")).toBeTruthy();
    });
  });

  describe("Backup accordion", () => {
    it("should not show the Export Backup button before expanding Backup", () => {
      const { queryByLabelText } = render(<SettingsScreen />);

      expect(queryByLabelText("Export backup")).toBeNull();
    });

    it("should show the Export Backup button after tapping the Backup header", () => {
      const { getByLabelText } = render(<SettingsScreen />);

      fireEvent.press(getByLabelText("Expand Backup"));

      expect(getByLabelText("Export backup")).toBeTruthy();
    });

    it("should hide the Export Backup button after collapsing Backup", () => {
      const { getByLabelText, queryByLabelText } = render(<SettingsScreen />);

      fireEvent.press(getByLabelText("Expand Backup"));
      expect(getByLabelText("Export backup")).toBeTruthy();

      fireEvent.press(getByLabelText("Collapse Backup"));
      expect(queryByLabelText("Export backup")).toBeNull();
    });
  });

  describe("Export Backup", () => {
    it("should call Share.share when Export Backup is pressed", async () => {
      const shareSpy = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" });

      const { getByLabelText } = render(<SettingsScreen />);
      fireEvent.press(getByLabelText("Expand Backup"));

      await act(async () => {
        fireEvent.press(getByLabelText("Export backup"));
      });

      expect(shareSpy).toHaveBeenCalledTimes(1);
      shareSpy.mockRestore();
    });

    it("should call Share.share with a JSON payload containing a workouts key", async () => {
      const shareSpy = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" });

      const { getByLabelText } = render(<SettingsScreen />);
      fireEvent.press(getByLabelText("Expand Backup"));

      await act(async () => {
        fireEvent.press(getByLabelText("Export backup"));
      });

      expect(shareSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('"workouts"'),
        })
      );
      shareSpy.mockRestore();
    });

    it("should call Share.share with a JSON payload containing an exercises key", async () => {
      const shareSpy = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" });

      const { getByLabelText } = render(<SettingsScreen />);
      fireEvent.press(getByLabelText("Expand Backup"));

      await act(async () => {
        fireEvent.press(getByLabelText("Export backup"));
      });

      expect(shareSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('"exercises"'),
        })
      );
      shareSpy.mockRestore();
    });
  });

  describe("app version", () => {
    it("should display the mocked version number 9.9.9", () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText("v9.9.9")).toBeTruthy();
    });
  });
});
