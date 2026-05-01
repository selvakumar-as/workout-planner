/**
 * Unit tests for useCountdown hook.
 *
 * Tests the fixed start() behaviour, the stale-closure regression (reset + start),
 * pause/resume, and idempotency.
 *
 * Uses react-test-renderer's `act` to flush React state updates and
 * jest.useFakeTimers() to drive setInterval ticks and Date.now().
 */

import React from "react";
import { act, create } from "react-test-renderer";
import { useCountdown } from "../hooks/useCountdown";
import type { CountdownState } from "../hooks/useCountdown";

// Tell React's concurrent-mode scheduler that we are inside an act()-aware
// test environment.  Without this, React emits a noisy console.error for
// every state update triggered inside act().
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).IS_REACT_ACT_ENVIRONMENT = true;

// ---------------------------------------------------------------------------
// Minimal hook harness using react-test-renderer
// ---------------------------------------------------------------------------

/**
 * Mounts a component that calls `useCountdown(initialMs)` and returns
 * helpers to read the latest hook state, trigger re-renders, and unmount.
 */
function makeCountdown(initialMs: number) {
  let latestState!: CountdownState;

  function TestComponent() {
    latestState = useCountdown(initialMs);
    return null;
  }

  let renderer!: ReturnType<typeof create>;
  act(() => {
    renderer = create(React.createElement(TestComponent));
  });

  /** Read the most recent hook return value. */
  function read(): CountdownState {
    return latestState;
  }

  /** Unmount the test component (clears intervals via cleanup effects). */
  function unmount() {
    act(() => {
      renderer.unmount();
    });
  }

  return { read, unmount };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const INITIAL_MS = 5000;

describe("useCountdown", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Basic initial state
  // -------------------------------------------------------------------------

  describe("initial state", () => {
    it("should have remaining equal to initialMs", () => {
      const { read, unmount } = makeCountdown(INITIAL_MS);
      expect(read().remaining).toBe(INITIAL_MS);
      unmount();
    });

    it("should have isDone as false", () => {
      const { read, unmount } = makeCountdown(INITIAL_MS);
      expect(read().isDone).toBe(false);
      unmount();
    });

    it("should have isRunning as false", () => {
      const { read, unmount } = makeCountdown(INITIAL_MS);
      expect(read().isRunning).toBe(false);
      unmount();
    });
  });

  // -------------------------------------------------------------------------
  // start() and tick behaviour
  // -------------------------------------------------------------------------

  describe("start() and tick behaviour", () => {
    it("should set isRunning to true after start()", () => {
      const { read, unmount } = makeCountdown(INITIAL_MS);

      act(() => {
        read().start();
      });

      expect(read().isRunning).toBe(true);
      unmount();
    });

    it("should decrease remaining as fake time advances", () => {
      const { read, unmount } = makeCountdown(INITIAL_MS);

      act(() => {
        read().start();
      });
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(read().remaining).toBeLessThan(INITIAL_MS);
      expect(read().remaining).toBeGreaterThanOrEqual(0);
      unmount();
    });

    it("should set isDone to true when remaining reaches 0", () => {
      const { read, unmount } = makeCountdown(INITIAL_MS);

      act(() => {
        read().start();
      });
      act(() => {
        jest.advanceTimersByTime(INITIAL_MS + 200);
      });

      expect(read().isDone).toBe(true);
      unmount();
    });

    it("should set isRunning to false when done", () => {
      const { read, unmount } = makeCountdown(INITIAL_MS);

      act(() => {
        read().start();
      });
      act(() => {
        jest.advanceTimersByTime(INITIAL_MS + 200);
      });

      expect(read().isRunning).toBe(false);
      unmount();
    });

    it("should set remaining to 0 when countdown completes", () => {
      const { read, unmount } = makeCountdown(INITIAL_MS);

      act(() => {
        read().start();
      });
      act(() => {
        jest.advanceTimersByTime(INITIAL_MS + 200);
      });

      expect(read().remaining).toBe(0);
      unmount();
    });
  });

  // -------------------------------------------------------------------------
  // reset() + start() — the stale-closure regression
  //
  // Root cause of the EXERCISE_REST timer completing instantly:
  // After a countdown completed (remaining === 0), calling reset(newMs) then
  // start() would not correctly update remainingAtSegmentStartRef before the
  // first tick, so the tick computed 0 − elapsed = 0 and fired isDone
  // immediately on the very next interval.
  // -------------------------------------------------------------------------

  describe("reset() + start() — stale-closure regression", () => {
    it("should run for the full new duration after reset(), not 0 ms", () => {
      const SECOND_MS = 10000;
      const { read, unmount } = makeCountdown(INITIAL_MS);

      // Step 1: Run the first countdown to completion.
      act(() => { read().start(); });
      act(() => { jest.advanceTimersByTime(INITIAL_MS + 200); });

      expect(read().isDone).toBe(true);
      expect(read().remaining).toBe(0);

      // Step 2: Reset to a new, larger duration.
      act(() => { read().reset(SECOND_MS); });

      expect(read().remaining).toBe(SECOND_MS);
      expect(read().isDone).toBe(false);

      // Step 3: Start again.  Must NOT immediately complete using the stale
      //         remaining=0 from the previous run.
      act(() => { read().start(); });

      // Step 4: Advance halfway — should still be running.
      act(() => { jest.advanceTimersByTime(SECOND_MS / 2); });

      expect(read().remaining).toBeGreaterThan(0);
      expect(read().isDone).toBe(false);
      expect(read().isRunning).toBe(true);

      // Step 5: Exhaust the remaining time — should now be done.
      act(() => { jest.advanceTimersByTime(SECOND_MS / 2 + 200); });

      expect(read().isDone).toBe(true);
      expect(read().remaining).toBe(0);
      expect(read().isRunning).toBe(false);
      unmount();
    });

    it("should not fire isDone on the very first tick after reset(newMs) + start()", () => {
      const { read, unmount } = makeCountdown(INITIAL_MS);

      // Complete the first run.
      act(() => { read().start(); });
      act(() => { jest.advanceTimersByTime(INITIAL_MS + 200); });

      // Reset to a fresh 10 s duration and start immediately.
      act(() => { read().reset(10000); });
      act(() => { read().start(); });

      // Tick once (100 ms) — isDone must still be false.
      act(() => { jest.advanceTimersByTime(100); });

      expect(read().isDone).toBe(false);
      expect(read().remaining).toBeGreaterThan(0);
      unmount();
    });
  });

  // -------------------------------------------------------------------------
  // pause() + start() (resume)
  // -------------------------------------------------------------------------

  describe("pause() and resume via start()", () => {
    it("should set isRunning to false after pause()", () => {
      const { read, unmount } = makeCountdown(INITIAL_MS);

      act(() => { read().start(); });
      act(() => { jest.advanceTimersByTime(1000); });
      act(() => { read().pause(); });

      expect(read().isRunning).toBe(false);
      unmount();
    });

    it("should freeze remaining at the paused value after pause()", () => {
      const { read, unmount } = makeCountdown(INITIAL_MS);

      act(() => { read().start(); });
      act(() => { jest.advanceTimersByTime(1000); });
      act(() => { read().pause(); });

      const frozenRemaining = read().remaining;
      expect(frozenRemaining).toBeGreaterThan(0);
      expect(frozenRemaining).toBeLessThan(INITIAL_MS);

      // Advance more time — remaining must not change while paused.
      act(() => { jest.advanceTimersByTime(2000); });

      expect(read().remaining).toBe(frozenRemaining);
      unmount();
    });

    it("should resume from the paused remaining after start()", () => {
      const { read, unmount } = makeCountdown(INITIAL_MS);

      act(() => { read().start(); });
      act(() => { jest.advanceTimersByTime(1000); });
      act(() => { read().pause(); });

      const pausedRemaining = read().remaining;

      act(() => { read().start(); });

      expect(read().isRunning).toBe(true);

      // Advance enough time to exhaust the paused remaining.
      act(() => { jest.advanceTimersByTime(pausedRemaining + 500); });

      expect(read().isDone).toBe(true);
      expect(read().remaining).toBe(0);
      unmount();
    });

    it("should not restart from initialMs when resuming after pause", () => {
      const { read, unmount } = makeCountdown(INITIAL_MS);

      act(() => { read().start(); });
      // Consume 2 seconds worth.
      act(() => { jest.advanceTimersByTime(2000); });
      act(() => { read().pause(); });

      // Resume and immediately read — remaining must not jump back to INITIAL_MS.
      act(() => { read().start(); });
      act(() => { jest.advanceTimersByTime(100); });

      // Should be continuing from the paused point (~3000 ms left), not from 5000.
      expect(read().remaining).toBeLessThan(INITIAL_MS - 1500);
      unmount();
    });
  });

  // -------------------------------------------------------------------------
  // reset() with no argument
  // -------------------------------------------------------------------------

  describe("reset() with no argument", () => {
    it("should restore remaining to initialMs", () => {
      const { read, unmount } = makeCountdown(INITIAL_MS);

      act(() => { read().start(); });
      act(() => { jest.advanceTimersByTime(2000); });
      act(() => { read().reset(); });

      expect(read().remaining).toBe(INITIAL_MS);
      unmount();
    });

    it("should set isDone to false after reset()", () => {
      const { read, unmount } = makeCountdown(INITIAL_MS);

      act(() => { read().start(); });
      act(() => { jest.advanceTimersByTime(INITIAL_MS + 200); });

      expect(read().isDone).toBe(true);

      act(() => { read().reset(); });

      expect(read().isDone).toBe(false);
      unmount();
    });

    it("should set isRunning to false after reset()", () => {
      const { read, unmount } = makeCountdown(INITIAL_MS);

      act(() => { read().start(); });
      act(() => { read().reset(); });

      expect(read().isRunning).toBe(false);
      unmount();
    });
  });

  // -------------------------------------------------------------------------
  // Idempotency: calling start() when already running
  // -------------------------------------------------------------------------

  describe("idempotency: start() when already running", () => {
    it("should not reset remaining to initialMs when start() is called while running", () => {
      const { read, unmount } = makeCountdown(INITIAL_MS);

      act(() => { read().start(); });
      // Advance 2 seconds so remaining is clearly below INITIAL_MS.
      act(() => { jest.advanceTimersByTime(2000); });

      const remainingMidRun = read().remaining;
      expect(remainingMidRun).toBeLessThan(INITIAL_MS);

      // Duplicate start() call — should be a no-op.
      act(() => { read().start(); });

      // Remaining must continue from where it was, not jump back to INITIAL_MS.
      expect(read().remaining).toBeLessThanOrEqual(remainingMidRun);
      expect(read().remaining).toBeGreaterThan(0);
      unmount();
    });

    it("should remain isRunning after a duplicate start() call", () => {
      const { read, unmount } = makeCountdown(INITIAL_MS);

      act(() => { read().start(); });
      act(() => { read().start(); });

      expect(read().isRunning).toBe(true);
      unmount();
    });
  });
});
