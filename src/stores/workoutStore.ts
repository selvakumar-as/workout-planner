import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKVLoader } from 'react-native-mmkv-storage';
import type { Exercise, ExerciseGroup, Workout, WorkoutExercise } from "../types";
import { randomUUID } from "../utils/uuid";

// ---------------------------------------------------------------------------
// MMKV storage adapter
// ---------------------------------------------------------------------------

const _workoutStorage = new MMKVLoader().withInstanceID('workout-store').initialize();
const workoutMMKVAdapter = {
  getItem: async (name: string): Promise<string | null> => (await _workoutStorage.getItem(name) as string) ?? null,
  setItem: (name: string, value: string): Promise<unknown> => _workoutStorage.setItem(name, value),
  removeItem: (name: string): Promise<unknown> => Promise.resolve(_workoutStorage.removeItem(name)),
};

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
  updateWorkoutExercise: (
    workoutId: string,
    exerciseId: string,
    patch: Partial<Pick<WorkoutExercise, 'sets' | 'reps' | 'weightKg' | 'restSeconds'>>
  ) => void;
  toggleFavourite: (exerciseId: string) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const S = "2026-01-01T00:00:00.000Z";
const id = (n: number) => `11111111-0000-0000-0000-${String(n).padStart(12, "0")}`;

const SEED_EXERCISES: Exercise[] = [
  // ── UPPER BODY — Chest ───────────────────────────────────────────────────
  { id: id(1),  name: "Bench Press",               muscleGroup: "UPPER_BODY", equipment: ["BARBELL"],             metValue: 5.0, defaultSets: 4, defaultReps: 8,  createdAt: S },
  { id: id(2),  name: "Incline Bench Press",        muscleGroup: "UPPER_BODY", equipment: ["BARBELL"],             metValue: 5.0, defaultSets: 4, defaultReps: 8,  createdAt: S },
  { id: id(3),  name: "Decline Bench Press",        muscleGroup: "UPPER_BODY", equipment: ["BARBELL"],             metValue: 5.0, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(4),  name: "Incline Dumbbell Press",     muscleGroup: "UPPER_BODY", equipment: ["DUMBBELL"],            metValue: 4.5, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(5),  name: "Dumbbell Fly",               muscleGroup: "UPPER_BODY", equipment: ["DUMBBELL"],            metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(6),  name: "Cable Fly",                  muscleGroup: "UPPER_BODY", equipment: ["CABLE"],               metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(7),  name: "Chest Press Machine",        muscleGroup: "UPPER_BODY", equipment: ["MACHINE"],             metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(8),  name: "Pec Deck",                   muscleGroup: "UPPER_BODY", equipment: ["MACHINE"],             metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(9),  name: "Push Up",                    muscleGroup: "UPPER_BODY", equipment: ["BODYWEIGHT"],          metValue: 3.8, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(10), name: "Dip",                        muscleGroup: "UPPER_BODY", equipment: ["BODYWEIGHT"],          metValue: 4.0, defaultSets: 3, defaultReps: 10, createdAt: S },

  // ── UPPER BODY — Back ────────────────────────────────────────────────────
  { id: id(11), name: "Pull Up",                    muscleGroup: "UPPER_BODY", equipment: ["BODYWEIGHT"],          metValue: 4.0, defaultSets: 3, defaultReps: 8,  createdAt: S },
  { id: id(12), name: "Chin Up",                    muscleGroup: "UPPER_BODY", equipment: ["BODYWEIGHT"],          metValue: 4.0, defaultSets: 3, defaultReps: 8,  createdAt: S },
  { id: id(13), name: "Barbell Row",                muscleGroup: "UPPER_BODY", equipment: ["BARBELL"],             metValue: 5.0, defaultSets: 4, defaultReps: 8,  createdAt: S },
  { id: id(14), name: "T-Bar Row",                  muscleGroup: "UPPER_BODY", equipment: ["BARBELL"],             metValue: 5.0, defaultSets: 4, defaultReps: 8,  createdAt: S },
  { id: id(15), name: "Dumbbell Row",               muscleGroup: "UPPER_BODY", equipment: ["DUMBBELL"],            metValue: 4.5, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(16), name: "Lat Pulldown",               muscleGroup: "UPPER_BODY", equipment: ["CABLE", "MACHINE"],   metValue: 4.0, defaultSets: 4, defaultReps: 10, createdAt: S },
  { id: id(17), name: "Seated Cable Row",           muscleGroup: "UPPER_BODY", equipment: ["CABLE"],               metValue: 4.0, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(18), name: "Face Pull",                  muscleGroup: "UPPER_BODY", equipment: ["CABLE"],               metValue: 3.5, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(19), name: "Machine Row",                muscleGroup: "UPPER_BODY", equipment: ["MACHINE"],             metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },

  // ── UPPER BODY — Shoulders ───────────────────────────────────────────────
  { id: id(20), name: "Overhead Press",             muscleGroup: "UPPER_BODY", equipment: ["BARBELL"],             metValue: 5.0, defaultSets: 4, defaultReps: 8,  createdAt: S },
  { id: id(21), name: "Dumbbell Shoulder Press",    muscleGroup: "UPPER_BODY", equipment: ["DUMBBELL"],            metValue: 4.5, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(22), name: "Arnold Press",               muscleGroup: "UPPER_BODY", equipment: ["DUMBBELL"],            metValue: 4.5, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(23), name: "Lateral Raise",              muscleGroup: "UPPER_BODY", equipment: ["DUMBBELL"],            metValue: 3.0, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(24), name: "Front Raise",                muscleGroup: "UPPER_BODY", equipment: ["DUMBBELL"],            metValue: 3.0, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(25), name: "Rear Delt Fly",              muscleGroup: "UPPER_BODY", equipment: ["DUMBBELL"],            metValue: 3.0, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(26), name: "Cable Lateral Raise",        muscleGroup: "UPPER_BODY", equipment: ["CABLE"],               metValue: 3.0, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(27), name: "Machine Shoulder Press",     muscleGroup: "UPPER_BODY", equipment: ["MACHINE"],             metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },

  // ── UPPER BODY — Biceps ──────────────────────────────────────────────────
  { id: id(28), name: "Barbell Curl",               muscleGroup: "UPPER_BODY", equipment: ["BARBELL"],             metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(29), name: "Dumbbell Curl",              muscleGroup: "UPPER_BODY", equipment: ["DUMBBELL"],            metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(30), name: "Hammer Curl",                muscleGroup: "UPPER_BODY", equipment: ["DUMBBELL"],            metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(31), name: "Preacher Curl",              muscleGroup: "UPPER_BODY", equipment: ["MACHINE", "BARBELL"],  metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(32), name: "Cable Curl",                 muscleGroup: "UPPER_BODY", equipment: ["CABLE"],               metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },

  // ── UPPER BODY — Triceps ─────────────────────────────────────────────────
  { id: id(33), name: "Tricep Pushdown",            muscleGroup: "UPPER_BODY", equipment: ["CABLE"],               metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(34), name: "Skull Crusher",              muscleGroup: "UPPER_BODY", equipment: ["BARBELL"],             metValue: 3.5, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(35), name: "Overhead Tricep Extension",  muscleGroup: "UPPER_BODY", equipment: ["DUMBBELL"],            metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(36), name: "Close Grip Bench Press",     muscleGroup: "UPPER_BODY", equipment: ["BARBELL"],             metValue: 4.5, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(37), name: "Tricep Dip",                 muscleGroup: "UPPER_BODY", equipment: ["BODYWEIGHT"],          metValue: 4.0, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(38), name: "Cable Overhead Extension",   muscleGroup: "UPPER_BODY", equipment: ["CABLE"],               metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },

  // ── CORE ─────────────────────────────────────────────────────────────────
  { id: id(39), name: "Plank",                      muscleGroup: "CORE",       equipment: ["BODYWEIGHT"],          metValue: 3.0, defaultSets: 3, defaultReps: 1,  createdAt: S },
  { id: id(40), name: "Side Plank",                 muscleGroup: "CORE",       equipment: ["BODYWEIGHT"],          metValue: 2.8, defaultSets: 3, defaultReps: 1,  createdAt: S },
  { id: id(41), name: "Crunches",                   muscleGroup: "CORE",       equipment: ["BODYWEIGHT"],          metValue: 2.8, defaultSets: 3, defaultReps: 20, createdAt: S },
  { id: id(42), name: "Bicycle Crunch",             muscleGroup: "CORE",       equipment: ["BODYWEIGHT"],          metValue: 3.2, defaultSets: 3, defaultReps: 20, createdAt: S },
  { id: id(43), name: "Reverse Crunch",             muscleGroup: "CORE",       equipment: ["BODYWEIGHT"],          metValue: 2.8, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(44), name: "Leg Raise",                  muscleGroup: "CORE",       equipment: ["BODYWEIGHT"],          metValue: 3.0, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(45), name: "Hanging Leg Raise",          muscleGroup: "CORE",       equipment: ["BODYWEIGHT"],          metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(46), name: "Russian Twist",              muscleGroup: "CORE",       equipment: ["BODYWEIGHT"],          metValue: 3.0, defaultSets: 3, defaultReps: 20, createdAt: S },
  { id: id(47), name: "Mountain Climber",           muscleGroup: "CORE",       equipment: ["BODYWEIGHT"],          metValue: 6.0, defaultSets: 3, defaultReps: 20, createdAt: S },
  { id: id(48), name: "Ab Wheel Rollout",           muscleGroup: "CORE",       equipment: ["BODYWEIGHT"],          metValue: 4.0, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(49), name: "Dead Bug",                   muscleGroup: "CORE",       equipment: ["BODYWEIGHT"],          metValue: 2.8, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(50), name: "Cable Crunch",               muscleGroup: "CORE",       equipment: ["CABLE"],               metValue: 3.5, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(51), name: "Woodchop",                   muscleGroup: "CORE",       equipment: ["CABLE"],               metValue: 4.0, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(52), name: "Decline Sit Up",             muscleGroup: "CORE",       equipment: ["MACHINE"],             metValue: 3.2, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(53), name: "Ab Machine",                 muscleGroup: "CORE",       equipment: ["MACHINE"],             metValue: 3.0, defaultSets: 3, defaultReps: 15, createdAt: S },

  // ── LOWER BODY ───────────────────────────────────────────────────────────
  { id: id(54), name: "Barbell Squat",              muscleGroup: "LOWER_BODY", equipment: ["BARBELL"],             metValue: 6.0, defaultSets: 4, defaultReps: 8,  createdAt: S },
  { id: id(55), name: "Front Squat",                muscleGroup: "LOWER_BODY", equipment: ["BARBELL"],             metValue: 6.0, defaultSets: 4, defaultReps: 6,  createdAt: S },
  { id: id(56), name: "Sumo Squat",                 muscleGroup: "LOWER_BODY", equipment: ["BARBELL"],             metValue: 5.5, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(57), name: "Goblet Squat",               muscleGroup: "LOWER_BODY", equipment: ["DUMBBELL"],            metValue: 5.0, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(58), name: "Deadlift",                   muscleGroup: "LOWER_BODY", equipment: ["BARBELL"],             metValue: 6.0, defaultSets: 4, defaultReps: 5,  createdAt: S },
  { id: id(59), name: "Romanian Deadlift",          muscleGroup: "LOWER_BODY", equipment: ["BARBELL"],             metValue: 5.5, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(60), name: "Sumo Deadlift",              muscleGroup: "LOWER_BODY", equipment: ["BARBELL"],             metValue: 6.0, defaultSets: 3, defaultReps: 8,  createdAt: S },
  { id: id(61), name: "Lunges",                     muscleGroup: "LOWER_BODY", equipment: ["DUMBBELL"],            metValue: 5.0, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(62), name: "Bulgarian Split Squat",      muscleGroup: "LOWER_BODY", equipment: ["DUMBBELL"],            metValue: 5.5, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(63), name: "Step Up",                    muscleGroup: "LOWER_BODY", equipment: ["DUMBBELL"],            metValue: 5.0, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(64), name: "Hip Thrust",                 muscleGroup: "LOWER_BODY", equipment: ["BARBELL"],             metValue: 4.5, defaultSets: 4, defaultReps: 10, createdAt: S },
  { id: id(65), name: "Glute Bridge",               muscleGroup: "LOWER_BODY", equipment: ["BODYWEIGHT"],          metValue: 3.5, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(66), name: "Leg Press",                  muscleGroup: "LOWER_BODY", equipment: ["MACHINE"],             metValue: 5.0, defaultSets: 4, defaultReps: 10, createdAt: S },
  { id: id(67), name: "Hack Squat",                 muscleGroup: "LOWER_BODY", equipment: ["MACHINE"],             metValue: 5.5, defaultSets: 4, defaultReps: 10, createdAt: S },
  { id: id(68), name: "Leg Extension",              muscleGroup: "LOWER_BODY", equipment: ["MACHINE"],             metValue: 3.5, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(69), name: "Leg Curl",                   muscleGroup: "LOWER_BODY", equipment: ["MACHINE"],             metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(70), name: "Seated Calf Raise",          muscleGroup: "LOWER_BODY", equipment: ["MACHINE"],             metValue: 2.8, defaultSets: 4, defaultReps: 15, createdAt: S },
  { id: id(71), name: "Standing Calf Raise",        muscleGroup: "LOWER_BODY", equipment: ["BODYWEIGHT"],          metValue: 3.0, defaultSets: 4, defaultReps: 20, createdAt: S },
  { id: id(72), name: "Cable Pull Through",         muscleGroup: "LOWER_BODY", equipment: ["CABLE"],               metValue: 4.5, defaultSets: 3, defaultReps: 12, createdAt: S },
];

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      workouts: [],
      exercises: SEED_EXERCISES,

      addWorkout: (workout) => {
        const now = new Date().toISOString();
        const newWorkout: Workout = {
          ...workout,
          id: randomUUID(),
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
          id: randomUUID(),
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

      updateWorkoutExercise: (workoutId, exerciseId, patch) => {
        const { workouts } = get();
        const updatedWorkouts = workouts.map((w) => {
          if (w.id !== workoutId) return w;
          return {
            ...w,
            exercises: w.exercises.map((e) =>
              e.exerciseId !== exerciseId ? e : { ...e, ...patch }
            ),
            updatedAt: new Date().toISOString(),
          };
        });
        set({ workouts: updatedWorkouts });
      },

      toggleFavourite: (exerciseId: string) => {
        set((state) => ({
          exercises: state.exercises.map((e) =>
            e.id !== exerciseId ? e : { ...e, isFavourite: !(e.isFavourite ?? false) }
          ),
        }));
      },
    }),
    {
      name: 'workout-store',
      storage: createJSONStorage(() => workoutMMKVAdapter),
    }
  )
);

// ---------------------------------------------------------------------------
// Vanilla store accessor (for use in ViewModel without React hooks)
// ---------------------------------------------------------------------------

export const workoutStoreApi = useWorkoutStore;
