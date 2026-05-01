import { create } from "zustand";
import type { Exercise, ExerciseGroup, Workout, WorkoutExercise } from "../types";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface WorkoutState {
  workouts: Workout[];
  exercises: Exercise[];
  // actions
  addWorkout: (workout: Omit<Workout, "id" | "createdAt" | "updatedAt">) => void;
  updateWorkout: (workoutId: string, patch: Partial<Omit<Workout, "id" | "createdAt">>) => void;
  addExercise: (exercise: Omit<Exercise, "id" | "createdAt">) => void;
  addExerciseToWorkout: (workoutId: string, entry: Omit<WorkoutExercise, "order">) => void;
  removeExerciseFromWorkout: (workoutId: string, exerciseId: string) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const SEED_EXERCISES: Exercise[] = [
  // Upper Body
  { id: "11111111-0000-0000-0000-000000000001", name: "Bench Press", muscleGroup: "UPPER_BODY", equipment: ["BARBELL"], defaultSets: 4, defaultReps: 8, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "11111111-0000-0000-0000-000000000002", name: "Push Up", muscleGroup: "UPPER_BODY", equipment: ["BODYWEIGHT"], defaultSets: 3, defaultReps: 15, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "11111111-0000-0000-0000-000000000003", name: "Shoulder Press", muscleGroup: "UPPER_BODY", equipment: ["DUMBBELL"], defaultSets: 3, defaultReps: 10, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "11111111-0000-0000-0000-000000000004", name: "Pull Up", muscleGroup: "UPPER_BODY", equipment: ["BODYWEIGHT"], defaultSets: 3, defaultReps: 8, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "11111111-0000-0000-0000-000000000005", name: "Bicep Curl", muscleGroup: "UPPER_BODY", equipment: ["DUMBBELL"], defaultSets: 3, defaultReps: 12, createdAt: "2026-01-01T00:00:00.000Z" },
  // Core
  { id: "11111111-0000-0000-0000-000000000006", name: "Plank", muscleGroup: "CORE", equipment: ["BODYWEIGHT"], defaultSets: 3, defaultReps: 1, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "11111111-0000-0000-0000-000000000007", name: "Crunches", muscleGroup: "CORE", equipment: ["BODYWEIGHT"], defaultSets: 3, defaultReps: 20, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "11111111-0000-0000-0000-000000000008", name: "Russian Twist", muscleGroup: "CORE", equipment: ["BODYWEIGHT"], defaultSets: 3, defaultReps: 16, createdAt: "2026-01-01T00:00:00.000Z" },
  // Lower Body
  { id: "11111111-0000-0000-0000-000000000009", name: "Squat", muscleGroup: "LOWER_BODY", equipment: ["BARBELL"], defaultSets: 4, defaultReps: 8, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "11111111-0000-0000-0000-000000000010", name: "Deadlift", muscleGroup: "LOWER_BODY", equipment: ["BARBELL"], defaultSets: 3, defaultReps: 6, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "11111111-0000-0000-0000-000000000011", name: "Lunges", muscleGroup: "LOWER_BODY", equipment: ["DUMBBELL"], defaultSets: 3, defaultReps: 12, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "11111111-0000-0000-0000-000000000012", name: "Leg Press", muscleGroup: "LOWER_BODY", equipment: ["MACHINE"], defaultSets: 4, defaultReps: 10, createdAt: "2026-01-01T00:00:00.000Z" },
];

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workouts: [],
  exercises: SEED_EXERCISES,

  addWorkout: (workout) => {
    const now = new Date().toISOString();
    const newWorkout: Workout = {
      ...workout,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ workouts: [newWorkout, ...state.workouts] }));
  },

  updateWorkout: (workoutId, patch) => {
    set((state) => ({
      workouts: state.workouts.map((w) =>
        w.id !== workoutId
          ? w
          : { ...w, ...patch, updatedAt: new Date().toISOString() }
      ),
    }));
  },

  addExercise: (exercise) => {
    const newExercise: Exercise = {
      ...exercise,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ exercises: [newExercise, ...state.exercises] }));
  },

  addExerciseToWorkout: (workoutId, entry) => {
    const { workouts } = get();
    const updatedWorkouts = workouts.map((w) => {
      if (w.id !== workoutId) return w;
      const order = w.exercises.length;
      const newEntry: WorkoutExercise = { ...entry, order };
      return {
        ...w,
        exercises: [...w.exercises, newEntry],
        updatedAt: new Date().toISOString(),
      };
    });
    set({ workouts: updatedWorkouts });
  },

  removeExerciseFromWorkout: (workoutId, exerciseId) => {
    const { workouts } = get();
    const updatedWorkouts = workouts.map((w) => {
      if (w.id !== workoutId) return w;
      const filtered = w.exercises
        .filter((e) => e.exerciseId !== exerciseId)
        .map((e, idx) => ({ ...e, order: idx }));
      return {
        ...w,
        exercises: filtered,
        updatedAt: new Date().toISOString(),
      };
    });
    set({ workouts: updatedWorkouts });
  },
}));

// ---------------------------------------------------------------------------
// Vanilla store accessor (for use in ViewModel without React hooks)
// ---------------------------------------------------------------------------

export const workoutStoreApi = useWorkoutStore;
