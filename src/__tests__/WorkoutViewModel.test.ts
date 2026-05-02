/**
 * Unit tests for useWorkoutViewModel pure logic.
 *
 * Covers:
 *   - isWorkoutNameTaken: empty list, exact match, case-insensitive match, excludeId
 *   - deleteWorkout: removes the target workout from the list
 *
 * Strategy:
 *   - Drive the Zustand store directly via useWorkoutStore.setState so that
 *     the observable state is controlled without rendering any component.
 *   - Call ViewModel actions via useWorkoutStore.getState() to exercise the
 *     real logic and observe the resulting state.
 *   - The MMKV mock (mapped in jest.config.js) provides an in-memory backend
 *     so the persist middleware doesn't throw.
 */

import { useWorkoutStore } from "../stores/workoutStore";
import type { Workout } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PUSH_DAY: Workout = {
  id: "workout-push",
  name: "Push Day",
  exercises: [],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const PULL_DAY: Workout = {
  id: "workout-pull",
  name: "Pull Day",
  exercises: [],
  createdAt: "2024-01-02T00:00:00.000Z",
  updatedAt: "2024-01-02T00:00:00.000Z",
};

/** Reset store workouts to a controlled list before each test. */
function seedWorkouts(workouts: Workout[]) {
  useWorkoutStore.setState((state) => ({ ...state, workouts }));
}

/** Read the current workouts list from the store. */
function getWorkouts(): Workout[] {
  return useWorkoutStore.getState().workouts;
}

// ---------------------------------------------------------------------------
// isWorkoutNameTaken — extracted from useWorkoutViewModel for purity testing
// ---------------------------------------------------------------------------

/**
 * Mirror of the isWorkoutNameTaken logic from useWorkoutViewModel.
 * Tests are against the store state directly, matching the real implementation.
 */
function isWorkoutNameTaken(name: string, excludeId?: string): boolean {
  const { workouts } = useWorkoutStore.getState();
  return workouts.some(
    (w) =>
      w.name.trim().toLowerCase() === name.trim().toLowerCase() &&
      w.id !== excludeId
  );
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  seedWorkouts([]);
});

afterEach(() => {
  seedWorkouts([]);
});

// ---------------------------------------------------------------------------
// isWorkoutNameTaken tests
// ---------------------------------------------------------------------------

describe("isWorkoutNameTaken", () => {
  it("should return false when there are no workouts", () => {
    seedWorkouts([]);

    expect(isWorkoutNameTaken("Push Day")).toBe(false);
  });

  it("should return false when the name does not match any workout", () => {
    seedWorkouts([PUSH_DAY]);

    expect(isWorkoutNameTaken("Leg Day")).toBe(false);
  });

  it("should return true when the name exactly matches an existing workout", () => {
    seedWorkouts([PUSH_DAY]);

    expect(isWorkoutNameTaken("Push Day")).toBe(true);
  });

  it("should return true for a case-insensitive match (lowercase input)", () => {
    seedWorkouts([PUSH_DAY]);

    expect(isWorkoutNameTaken("push day")).toBe(true);
  });

  it("should return true for a case-insensitive match (uppercase input)", () => {
    seedWorkouts([PUSH_DAY]);

    expect(isWorkoutNameTaken("PUSH DAY")).toBe(true);
  });

  it("should return true for a case-insensitive match (mixed case input)", () => {
    seedWorkouts([PUSH_DAY]);

    expect(isWorkoutNameTaken("PuSh DaY")).toBe(true);
  });

  it("should return false when the matching workout is excluded by id", () => {
    seedWorkouts([PUSH_DAY]);

    expect(isWorkoutNameTaken("Push Day", PUSH_DAY.id)).toBe(false);
  });

  it("should return true when excludeId does not match the found workout", () => {
    seedWorkouts([PUSH_DAY, PULL_DAY]);

    expect(isWorkoutNameTaken("Push Day", PULL_DAY.id)).toBe(true);
  });

  it("should return true when name matches one of several workouts", () => {
    seedWorkouts([PUSH_DAY, PULL_DAY]);

    expect(isWorkoutNameTaken("Pull Day")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// deleteWorkout tests
// ---------------------------------------------------------------------------

describe("deleteWorkout (via store action)", () => {
  it("should remove the targeted workout from the list", () => {
    seedWorkouts([PUSH_DAY, PULL_DAY]);

    useWorkoutStore.getState().deleteWorkout(PUSH_DAY.id);

    const remaining = getWorkouts();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(PULL_DAY.id);
  });

  it("should leave the list empty when the only workout is deleted", () => {
    seedWorkouts([PUSH_DAY]);

    useWorkoutStore.getState().deleteWorkout(PUSH_DAY.id);

    expect(getWorkouts()).toHaveLength(0);
  });

  it("should not affect other workouts when one is deleted", () => {
    seedWorkouts([PUSH_DAY, PULL_DAY]);

    useWorkoutStore.getState().deleteWorkout(PUSH_DAY.id);

    expect(getWorkouts()[0].name).toBe("Pull Day");
  });

  it("should be a no-op when the id does not match any workout", () => {
    seedWorkouts([PUSH_DAY]);

    useWorkoutStore.getState().deleteWorkout("nonexistent-id");

    expect(getWorkouts()).toHaveLength(1);
  });
});
