/**
 * Unit tests for useAutoSession hook.
 *
 * Tests phase transitions driven by countdown completion, the EXERCISE_REST
 * stale-closure regression, and all public API methods (start, skipRest,
 * skipGrace, stopEarly).
 *
 * Strategy:
 *   - Use real useCountdown (no mock) — fake timers drive setInterval ticks
 *     exactly as they would in production.
 *   - Every phase transition calls setTimeout(fn, 0) to defer the next
 *     timer's start().  Call flushDeferred() (which advances by 0 ms inside
 *     act) after every transition to fire those callbacks before advancing
 *     the fake clock further.
 *   - After advancing timers, wrap in act() so React flushes useEffect hooks
 *     that observe isDone and trigger state transitions.
 */

import React from "react";
import { act, create } from "react-test-renderer";
import {
  useAutoSession,
  GRACE_PERIOD_MS,
} from "../hooks/useAutoSession";
import type {
  AutoSessionConfig,
  AutoSessionState,
} from "../hooks/useAutoSession";
import type { WorkoutSoundCallbacks } from "../hooks/useWorkoutSound";
import type { AutoTimerConfig, WorkoutExercise } from "../types";

// Tell React's concurrent-mode scheduler that we are inside an act()-aware
// test environment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).IS_REACT_ACT_ENVIRONMENT = true;

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

/**
 * 2-exercise workout: exercise 1 has 2 sets, exercise 2 has 1 set.
 * This covers all phase transitions: SET_REST (between sets of ex1),
 * EXERCISE_REST (between ex1 and ex2), and DONE (after ex2's only set).
 */
const EXERCISES: WorkoutExercise[] = [
  { exerciseId: "ex1", order: 0, sets: 2, reps: 10 },
  { exerciseId: "ex2", order: 1, sets: 1, reps: 8 },
];

const AUTO_CONFIG: AutoTimerConfig = {
  secondsPerSet: 30,
  restBetweenSetsSecs: 15,
  restBetweenExercisesSecs: 20,
};

const SET_DURATION_MS = AUTO_CONFIG.secondsPerSet * 1000;             // 30 000
const SET_REST_MS = AUTO_CONFIG.restBetweenSetsSecs * 1000;           // 15 000
const EXERCISE_REST_MS = AUTO_CONFIG.restBetweenExercisesSecs * 1000; // 20 000

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const makeSounds = (): jest.Mocked<WorkoutSoundCallbacks> => ({
  unlockAudio: jest.fn(),
  playSetStart: jest.fn(),
  playSetEnd: jest.fn(),
  playExerciseStart: jest.fn(),
  playExerciseEnd: jest.fn(),
});

/**
 * Mounts useAutoSession and returns a live-reading handle.
 */
function makeSession(
  sounds: jest.Mocked<WorkoutSoundCallbacks>,
  overrides: Partial<AutoSessionConfig> = {}
) {
  let latestState!: AutoSessionState;

  const onSetComplete = jest.fn();
  const onSessionComplete = jest.fn();

  const config: AutoSessionConfig = {
    exercises: EXERCISES,
    autoTimerConfig: AUTO_CONFIG,
    onSetComplete,
    onSessionComplete,
    ...overrides,
  };

  function TestComponent() {
    latestState = useAutoSession(config, sounds);
    return null;
  }

  let renderer!: ReturnType<typeof create>;
  act(() => {
    renderer = create(React.createElement(TestComponent));
  });

  function read(): AutoSessionState {
    return latestState;
  }

  function unmount() {
    act(() => {
      renderer.unmount();
    });
  }

  return { read, unmount, onSetComplete, onSessionComplete };
}

/**
 * Advance the fake clock by `ms` milliseconds and flush React effects.
 */
function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

/**
 * Flush pending setTimeout(fn, 0) calls.
 *
 * useAutoSession defers every timer's start() call via setTimeout(fn, 0) so
 * that the reset() state update propagates to the hook before start() runs.
 * This must be called after every phase transition before advancing the clock.
 */
function flushDeferred() {
  advance(0);
}

// ---------------------------------------------------------------------------
// Composite helpers — each builds on the previous
// ---------------------------------------------------------------------------

/** IDLE → GRACE, arms the grace countdown. */
function doStart(read: () => AutoSessionState) {
  act(() => { read().start(); });
  flushDeferred(); // fires setTimeout(() => grace.start(), 0)
}

/** Drives the grace countdown to completion (GRACE → RUNNING effect). */
function doCompleteGrace() {
  advance(GRACE_PERIOD_MS + 200);
  flushDeferred(); // fires setTimeout(() => setTimer.start(), 0) from startSet()
}

/** Drives the set timer to completion (RUNNING → next phase effect). */
function doCompleteSet() {
  advance(SET_DURATION_MS + 200);
  flushDeferred(); // fires deferred start() for SET_REST or EXERCISE_REST timer
}

/** Drives the SET_REST timer to completion (SET_REST → GRACE effect). */
function doCompleteSetRest() {
  advance(SET_REST_MS + 200);
  flushDeferred(); // fires setTimeout(() => grace.start(), 0) from startGrace()
}

/** Drives the EXERCISE_REST timer to completion (EXERCISE_REST → GRACE effect). */
function doCompleteExerciseRest() {
  advance(EXERCISE_REST_MS + 200);
  flushDeferred(); // fires setTimeout(() => grace.start(), 0) from startGrace()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useAutoSession", () => {
  let sounds: jest.Mocked<WorkoutSoundCallbacks>;

  beforeEach(() => {
    sounds = makeSounds();
    jest.useFakeTimers();
    jest.setSystemTime(0);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  describe("initial state", () => {
    it('should have phase "IDLE" initially', () => {
      const { read, unmount } = makeSession(sounds);
      expect(read().phase).toBe("IDLE");
      unmount();
    });

    it("should have currentExerciseIndex 0 initially", () => {
      const { read, unmount } = makeSession(sounds);
      expect(read().currentExerciseIndex).toBe(0);
      unmount();
    });

    it("should have currentSetNumber 1 initially", () => {
      const { read, unmount } = makeSession(sounds);
      expect(read().currentSetNumber).toBe(1);
      unmount();
    });
  });

  // -------------------------------------------------------------------------
  // start() → GRACE
  // -------------------------------------------------------------------------

  describe("start()", () => {
    it('should transition phase to "GRACE" when called from IDLE', () => {
      const { read, unmount } = makeSession(sounds);

      doStart(read);

      expect(read().phase).toBe("GRACE");
      unmount();
    });

    it("should be a no-op when called from a non-IDLE phase", () => {
      const { read, unmount } = makeSession(sounds);

      doStart(read);
      expect(read().phase).toBe("GRACE");

      // Calling start() again while in GRACE must not change the phase.
      act(() => { read().start(); });

      expect(read().phase).toBe("GRACE");
      unmount();
    });
  });

  // -------------------------------------------------------------------------
  // GRACE → RUNNING when grace completes
  // -------------------------------------------------------------------------

  describe("GRACE → RUNNING on grace countdown completion", () => {
    it('should transition to "RUNNING" when grace isDone fires', () => {
      const { read, unmount } = makeSession(sounds);

      doStart(read);
      doCompleteGrace();

      expect(read().phase).toBe("RUNNING");
      unmount();
    });

    it("should call sounds.playSetStart when transitioning to RUNNING", () => {
      const { read, unmount } = makeSession(sounds);

      doStart(read);
      doCompleteGrace();

      expect(sounds.playSetStart).toHaveBeenCalledTimes(1);
      unmount();
    });
  });

  // -------------------------------------------------------------------------
  // RUNNING → SET_REST when set completes (not last set)
  // -------------------------------------------------------------------------

  describe("RUNNING → SET_REST on set completion (not last set)", () => {
    it('should transition to "SET_REST" after set 1 of 2 completes', () => {
      const { read, unmount } = makeSession(sounds);

      doStart(read);
      doCompleteGrace();
      doCompleteSet(); // ex1 set 1 → SET_REST

      expect(read().phase).toBe("SET_REST");
      unmount();
    });

    it("should call onSetComplete with correct args after set 1 completes", () => {
      const { read, unmount, onSetComplete } = makeSession(sounds);

      doStart(read);
      doCompleteGrace();
      doCompleteSet();

      expect(onSetComplete).toHaveBeenCalledWith("ex1", 1, 10, undefined);
      unmount();
    });

    it("should call sounds.playSetEnd when set completes", () => {
      const { read, unmount } = makeSession(sounds);

      doStart(read);
      doCompleteGrace();
      doCompleteSet();

      expect(sounds.playSetEnd).toHaveBeenCalledTimes(1);
      unmount();
    });

    it("should increment currentSetNumber after moving to SET_REST", () => {
      const { read, unmount } = makeSession(sounds);

      doStart(read);
      doCompleteGrace();
      doCompleteSet();

      expect(read().currentSetNumber).toBe(2);
      unmount();
    });
  });

  // -------------------------------------------------------------------------
  // SET_REST → GRACE (next set)
  // -------------------------------------------------------------------------

  describe("SET_REST → GRACE on rest countdown completion", () => {
    it('should transition back to "GRACE" when SET_REST isDone fires', () => {
      const { read, unmount } = makeSession(sounds);

      doStart(read);
      doCompleteGrace();
      doCompleteSet();     // → SET_REST
      doCompleteSetRest(); // → GRACE

      expect(read().phase).toBe("GRACE");
      unmount();
    });

    it("should keep currentSetNumber at 2 when entering GRACE for set 2", () => {
      const { read, unmount } = makeSession(sounds);

      doStart(read);
      doCompleteGrace();
      doCompleteSet();
      doCompleteSetRest();

      expect(read().currentSetNumber).toBe(2);
      unmount();
    });
  });

  // -------------------------------------------------------------------------
  // RUNNING → EXERCISE_REST when last set of non-last exercise completes
  // -------------------------------------------------------------------------

  describe("RUNNING → EXERCISE_REST on last set of non-last exercise", () => {
    /** Drive through ex1 both sets, arriving at EXERCISE_REST. */
    function driveToExerciseRest(read: () => AutoSessionState) {
      doStart(read);       // IDLE → GRACE
      doCompleteGrace();   // GRACE → RUNNING (ex1, set 1)
      doCompleteSet();     // RUNNING → SET_REST
      doCompleteSetRest(); // SET_REST → GRACE
      doCompleteGrace();   // GRACE → RUNNING (ex1, set 2)
      doCompleteSet();     // RUNNING → EXERCISE_REST (last set of ex1)
    }

    it('should transition to "EXERCISE_REST" after last set of exercise 1', () => {
      const { read, unmount } = makeSession(sounds);

      driveToExerciseRest(read);

      expect(read().phase).toBe("EXERCISE_REST");
      unmount();
    });

    it("should call onSetComplete for both sets of ex1", () => {
      const { read, unmount, onSetComplete } = makeSession(sounds);

      driveToExerciseRest(read);

      expect(onSetComplete).toHaveBeenCalledTimes(2);
      expect(onSetComplete).toHaveBeenNthCalledWith(2, "ex1", 2, 10, undefined);
      unmount();
    });

    it("should call sounds.playExerciseEnd when EXERCISE_REST begins", () => {
      const { read, unmount } = makeSession(sounds);

      driveToExerciseRest(read);

      expect(sounds.playExerciseEnd).toHaveBeenCalledTimes(1);
      unmount();
    });
  });

  // -------------------------------------------------------------------------
  // EXERCISE_REST → GRACE (next exercise) — the stale-closure regression test
  //
  // Bug: after restTimer completed once (SET_REST → GRACE transition), calling
  // restTimer.reset(exerciseRestMs) then restTimer.start() would not correctly
  // reinitialise remainingAtSegmentStartRef.  The first tick computed
  // 0 − elapsed = 0 and fired isDone immediately, skipping the full rest.
  // -------------------------------------------------------------------------

  describe("EXERCISE_REST → GRACE (next exercise) — stale-closure regression", () => {
    function driveToExerciseRest(read: () => AutoSessionState) {
      doStart(read);
      doCompleteGrace();
      doCompleteSet();
      doCompleteSetRest();
      doCompleteGrace();
      doCompleteSet(); // → EXERCISE_REST
    }

    it('should transition to "GRACE" (for exercise 2) when EXERCISE_REST isDone fires', () => {
      const { read, unmount } = makeSession(sounds);

      driveToExerciseRest(read);
      doCompleteExerciseRest(); // EXERCISE_REST → GRACE

      expect(read().phase).toBe("GRACE");
      unmount();
    });

    it("should increment currentExerciseIndex to 1 after EXERCISE_REST", () => {
      const { read, unmount } = makeSession(sounds);

      driveToExerciseRest(read);
      doCompleteExerciseRest();

      expect(read().currentExerciseIndex).toBe(1);
      unmount();
    });

    it("should reset currentSetNumber to 1 after EXERCISE_REST", () => {
      const { read, unmount } = makeSession(sounds);

      driveToExerciseRest(read);
      doCompleteExerciseRest();

      expect(read().currentSetNumber).toBe(1);
      unmount();
    });

    it("should call sounds.playExerciseStart when EXERCISE_REST completes", () => {
      const { read, unmount } = makeSession(sounds);

      driveToExerciseRest(read);
      doCompleteExerciseRest();

      expect(sounds.playExerciseStart).toHaveBeenCalledTimes(1);
      unmount();
    });

    it("should NOT complete EXERCISE_REST instantly (regression guard)", () => {
      const { read, unmount } = makeSession(sounds);

      driveToExerciseRest(read);
      // flushDeferred() inside doCompleteSet() already armed the rest timer.
      // Advance only halfway through the exercise rest — must stay in EXERCISE_REST.
      advance(EXERCISE_REST_MS / 2);

      expect(read().phase).toBe("EXERCISE_REST");
      unmount();
    });
  });

  // -------------------------------------------------------------------------
  // Single-set exercise: no SET_REST phase
  // -------------------------------------------------------------------------

  describe("single-set exercise goes directly to EXERCISE_REST", () => {
    it('should skip SET_REST and go to EXERCISE_REST when sets === 1', () => {
      const singleSetExercises: WorkoutExercise[] = [
        { exerciseId: "single", order: 0, sets: 1, reps: 5 },
        { exerciseId: "second", order: 1, sets: 1, reps: 5 },
      ];
      const { read, unmount } = makeSession(sounds, {
        exercises: singleSetExercises,
      });

      doStart(read);
      doCompleteGrace();
      doCompleteSet(); // set 1 of 1 → must go to EXERCISE_REST, not SET_REST

      expect(read().phase).toBe("EXERCISE_REST");
      unmount();
    });
  });

  // -------------------------------------------------------------------------
  // Last exercise, last set → DONE
  // -------------------------------------------------------------------------

  describe("last exercise, last set → DONE", () => {
    /** Drive all the way to RUNNING for ex2 set 1 (the final set). */
    function driveToFinalSet(read: () => AutoSessionState) {
      doStart(read);           // → GRACE
      doCompleteGrace();       // → RUNNING (ex1, set 1)
      doCompleteSet();         // → SET_REST
      doCompleteSetRest();     // → GRACE
      doCompleteGrace();       // → RUNNING (ex1, set 2)
      doCompleteSet();         // → EXERCISE_REST
      doCompleteExerciseRest(); // → GRACE (ex2)
      doCompleteGrace();       // → RUNNING (ex2, set 1) — the final set
    }

    it('should transition to "DONE" after the last set of the last exercise', () => {
      const { read, unmount } = makeSession(sounds);

      driveToFinalSet(read);
      doCompleteSet(); // ex2, set 1 (last) → DONE

      expect(read().phase).toBe("DONE");
      unmount();
    });

    it("should call onSessionComplete when DONE", () => {
      const { read, unmount, onSessionComplete } = makeSession(sounds);

      driveToFinalSet(read);
      doCompleteSet();

      expect(onSessionComplete).toHaveBeenCalledTimes(1);
      unmount();
    });

    it("should call sounds.playExerciseEnd when DONE", () => {
      const { read, unmount } = makeSession(sounds);

      driveToFinalSet(read);
      doCompleteSet();

      // playExerciseEnd is called once for ex1→EXERCISE_REST and once at DONE
      expect(sounds.playExerciseEnd).toHaveBeenCalledTimes(2);
      unmount();
    });
  });

  // -------------------------------------------------------------------------
  // skipRest()
  // -------------------------------------------------------------------------

  describe("skipRest()", () => {
    it('should transition from SET_REST to GRACE when skipRest() is called', () => {
      const { read, unmount } = makeSession(sounds);

      doStart(read);
      doCompleteGrace();
      doCompleteSet(); // → SET_REST

      act(() => { read().skipRest(); });
      flushDeferred();

      expect(read().phase).toBe("GRACE");
      unmount();
    });

    it('should transition from EXERCISE_REST to GRACE when skipRest() is called', () => {
      const { read, unmount } = makeSession(sounds);

      doStart(read);
      doCompleteGrace();
      doCompleteSet();
      doCompleteSetRest();
      doCompleteGrace();
      doCompleteSet(); // → EXERCISE_REST

      act(() => { read().skipRest(); });
      flushDeferred();

      expect(read().phase).toBe("GRACE");
      unmount();
    });

    it("should increment currentExerciseIndex when skipRest() is called in EXERCISE_REST", () => {
      const { read, unmount } = makeSession(sounds);

      doStart(read);
      doCompleteGrace();
      doCompleteSet();
      doCompleteSetRest();
      doCompleteGrace();
      doCompleteSet(); // → EXERCISE_REST (ex1 done, ex2 next)

      act(() => { read().skipRest(); });

      expect(read().currentExerciseIndex).toBe(1);
      unmount();
    });

    it("should be a no-op when called outside a rest phase (e.g. GRACE)", () => {
      const { read, unmount } = makeSession(sounds);

      doStart(read);
      expect(read().phase).toBe("GRACE");

      act(() => { read().skipRest(); });

      expect(read().phase).toBe("GRACE");
      unmount();
    });
  });

  // -------------------------------------------------------------------------
  // skipGrace()
  // -------------------------------------------------------------------------

  describe("skipGrace()", () => {
    it('should transition from GRACE to RUNNING when skipGrace() is called', () => {
      const { read, unmount } = makeSession(sounds);

      doStart(read);
      expect(read().phase).toBe("GRACE");

      act(() => { read().skipGrace(); });

      expect(read().phase).toBe("RUNNING");
      unmount();
    });

    it("should be a no-op when called from IDLE", () => {
      const { read, unmount } = makeSession(sounds);

      expect(read().phase).toBe("IDLE");

      act(() => { read().skipGrace(); });

      expect(read().phase).toBe("IDLE");
      unmount();
    });

    it("should be a no-op when called during RUNNING", () => {
      const { read, unmount } = makeSession(sounds);

      doStart(read);
      doCompleteGrace(); // → RUNNING

      act(() => { read().skipGrace(); });

      expect(read().phase).toBe("RUNNING");
      unmount();
    });
  });

  // -------------------------------------------------------------------------
  // stopEarly()
  // -------------------------------------------------------------------------

  describe("stopEarly()", () => {
    it("should log the current set and transition out of RUNNING when called", () => {
      const { read, unmount, onSetComplete } = makeSession(sounds);

      doStart(read);
      doCompleteGrace(); // → RUNNING (ex1, set 1)

      act(() => { read().stopEarly(); });

      expect(read().phase).not.toBe("RUNNING");
      expect(onSetComplete).toHaveBeenCalledTimes(1);
      unmount();
    });

    it("should transition to SET_REST when stopEarly() is called during set 1 of 2", () => {
      const { read, unmount } = makeSession(sounds);

      doStart(read);
      doCompleteGrace(); // → RUNNING (ex1, set 1 — not last set)

      act(() => { read().stopEarly(); });

      expect(read().phase).toBe("SET_REST");
      unmount();
    });

    it("should be a no-op when called outside RUNNING (e.g. GRACE)", () => {
      const { read, unmount } = makeSession(sounds);

      doStart(read);
      expect(read().phase).toBe("GRACE");

      act(() => { read().stopEarly(); });

      expect(read().phase).toBe("GRACE");
      unmount();
    });

    it("should be a no-op when called from IDLE", () => {
      const { read, unmount } = makeSession(sounds);

      expect(read().phase).toBe("IDLE");

      act(() => { read().stopEarly(); });

      expect(read().phase).toBe("IDLE");
      unmount();
    });
  });
});
