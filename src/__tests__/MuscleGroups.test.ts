/**
 * Tests for the F2 muscle group enum refactor.
 *
 * Covers:
 *  - ExerciseGroupSchema accepts all 7 new values.
 *  - ExerciseGroupSchema rejects the removed UPPER_BODY and LOWER_BODY values.
 *  - Seed exercises no longer contain muscleGroup UPPER_BODY or LOWER_BODY.
 *  - Spot-check: id(1) → CHEST, id(11) → BACK, id(28) → ARMS, id(54) → LEGS,
 *    id(82) → FOREARMS.
 */

import { ExerciseGroupSchema } from "../types/workout";
import { useWorkoutStore } from "../stores/workoutStore";

// ---------------------------------------------------------------------------
// Helper: the same id() function used in workoutStore seed data
// ---------------------------------------------------------------------------

function seedId(n: number): string {
  return `11111111-0000-0000-0000-${String(n).padStart(12, "0")}`;
}

// ---------------------------------------------------------------------------
// ExerciseGroupSchema validation
// ---------------------------------------------------------------------------

describe("ExerciseGroupSchema", () => {
  describe("accepted values", () => {
    const valid = ["CHEST", "BACK", "SHOULDERS", "ARMS", "CORE", "LEGS", "FOREARMS"] as const;

    valid.forEach((group) => {
      it(`should accept "${group}"`, () => {
        expect(ExerciseGroupSchema.safeParse(group).success).toBe(true);
      });
    });
  });

  describe("rejected values", () => {
    it('should reject "UPPER_BODY"', () => {
      expect(ExerciseGroupSchema.safeParse("UPPER_BODY").success).toBe(false);
    });

    it('should reject "LOWER_BODY"', () => {
      expect(ExerciseGroupSchema.safeParse("LOWER_BODY").success).toBe(false);
    });

    it("should reject an empty string", () => {
      expect(ExerciseGroupSchema.safeParse("").success).toBe(false);
    });

    it("should reject a completely unknown value", () => {
      expect(ExerciseGroupSchema.safeParse("CARDIO").success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Seed exercises — no legacy groups
// ---------------------------------------------------------------------------

describe("seed exercises", () => {
  let exercises: ReturnType<typeof useWorkoutStore.getState>["exercises"];

  beforeAll(() => {
    exercises = useWorkoutStore.getState().exercises;
  });

  it("should contain at least one exercise", () => {
    expect(exercises.length).toBeGreaterThan(0);
  });

  it('should not contain any exercise with muscleGroup "UPPER_BODY"', () => {
    const found = exercises.filter((e) => e.muscleGroup === ("UPPER_BODY" as never));
    expect(found).toHaveLength(0);
  });

  it('should not contain any exercise with muscleGroup "LOWER_BODY"', () => {
    const found = exercises.filter((e) => e.muscleGroup === ("LOWER_BODY" as never));
    expect(found).toHaveLength(0);
  });

  describe("spot-checks", () => {
    it("should map id(1) to CHEST (Bench Press)", () => {
      const ex = exercises.find((e) => e.id === seedId(1));
      expect(ex).toBeDefined();
      expect(ex?.muscleGroup).toBe("CHEST");
    });

    it("should map id(11) to BACK (Pull Up)", () => {
      const ex = exercises.find((e) => e.id === seedId(11));
      expect(ex).toBeDefined();
      expect(ex?.muscleGroup).toBe("BACK");
    });

    it("should map id(28) to ARMS (Barbell Curl)", () => {
      const ex = exercises.find((e) => e.id === seedId(28));
      expect(ex).toBeDefined();
      expect(ex?.muscleGroup).toBe("ARMS");
    });

    it("should map id(54) to LEGS (Barbell Squat)", () => {
      const ex = exercises.find((e) => e.id === seedId(54));
      expect(ex).toBeDefined();
      expect(ex?.muscleGroup).toBe("LEGS");
    });

    it("should map id(82) to FOREARMS (Farmer's Walk)", () => {
      const ex = exercises.find((e) => e.id === seedId(82));
      expect(ex).toBeDefined();
      expect(ex?.muscleGroup).toBe("FOREARMS");
    });
  });
});
