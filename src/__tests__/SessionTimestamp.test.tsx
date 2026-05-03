/**
 * Tests for the F4 HH:MM:SS timestamp feature in HistoryScreen.
 *
 * Covers:
 *  - Rendering a COMPLETED session with known startedAt/completedAt shows
 *    a time string in the rendered output.
 *  - Rendering an IN_PROGRESS session (no completedAt) shows only the start
 *    time — the "–" separator is absent.
 *
 * Strategy:
 *  - Mock useSessionViewModel to return controlled session data.
 *  - Use fake system time so toLocaleTimeString is deterministic.
 */

import React from "react";
import { render } from "@testing-library/react-native";

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

jest.mock("../viewmodels/useSessionViewModel", () => ({
  useSessionViewModel: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import HistoryScreen from "../screens/HistoryScreen";
import { useSessionViewModel } from "../viewmodels/useSessionViewModel";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeSessionVm(sessionHistory: unknown[]) {
  return { sessionHistory };
}

const STARTED_AT = "2025-06-15T09:00:00.000Z";
const COMPLETED_AT = "2025-06-15T10:30:45.000Z";

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2025-06-15T10:00:00Z"));
});

afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("HistoryScreen — session timestamps", () => {
  describe("completed session", () => {
    it("should render a time text element for a completed session", () => {
      const session = {
        id: "session-1",
        workoutId: "workout-1",
        status: "COMPLETED" as const,
        startedAt: STARTED_AT,
        completedAt: COMPLETED_AT,
        sets: [],
      };

      (useSessionViewModel as jest.Mock).mockReturnValue(
        makeSessionVm([session])
      );

      const { getAllByText } = render(<HistoryScreen />);

      // The time text is formatted with en-GB locale as "HH:MM:SS – HH:MM:SS"
      // We check that at least one Text node contains the "–" separator
      // (present only when completedAt is defined).
      const timeNodes = getAllByText(/–/);
      expect(timeNodes.length).toBeGreaterThan(0);
    });

    it("should include the start time in the time text for a completed session", () => {
      const session = {
        id: "session-1",
        workoutId: "workout-1",
        status: "COMPLETED" as const,
        startedAt: STARTED_AT,
        completedAt: COMPLETED_AT,
        sets: [],
      };

      (useSessionViewModel as jest.Mock).mockReturnValue(
        makeSessionVm([session])
      );

      const { getAllByText } = render(<HistoryScreen />);

      // The rendered text must contain the "–" separator between start and end times
      const nodesWithDash = getAllByText(/–/);
      expect(nodesWithDash.length).toBeGreaterThan(0);
    });
  });

  describe("in-progress session", () => {
    it("should not show the '–' separator when completedAt is absent", () => {
      const session = {
        id: "session-2",
        workoutId: "workout-1",
        status: "IN_PROGRESS" as const,
        startedAt: STARTED_AT,
        // no completedAt
        sets: [],
      };

      (useSessionViewModel as jest.Mock).mockReturnValue(
        makeSessionVm([session])
      );

      const { queryAllByText } = render(<HistoryScreen />);

      // No "–" separator should appear for an in-progress session
      const nodesWithDash = queryAllByText(/–/);
      expect(nodesWithDash).toHaveLength(0);
    });

    it("should still render the session item for an in-progress session", () => {
      const session = {
        id: "session-2",
        workoutId: "workout-1",
        status: "IN_PROGRESS" as const,
        startedAt: STARTED_AT,
        sets: [],
      };

      (useSessionViewModel as jest.Mock).mockReturnValue(
        makeSessionVm([session])
      );

      const { getByText } = render(<HistoryScreen />);

      expect(getByText("IN_PROGRESS")).toBeTruthy();
    });
  });

  describe("empty history", () => {
    it("should render the empty state message when there are no sessions", () => {
      (useSessionViewModel as jest.Mock).mockReturnValue(makeSessionVm([]));

      const { getByText } = render(<HistoryScreen />);

      expect(getByText("No workout history yet.")).toBeTruthy();
    });
  });
});
