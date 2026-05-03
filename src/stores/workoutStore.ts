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
    patch: Partial<Pick<WorkoutExercise, 'sets' | 'reps' | 'weightKg' | 'restSeconds' | 'durationPerSetSecs'>>
  ) => void;
  deleteWorkout: (workoutId: string) => void;
  deleteWorkouts: (workoutIds: string[]) => void;
  toggleFavourite: (exerciseId: string) => void;
  reorderExercises: (workoutId: string, orderedExerciseIds: string[]) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const S = "2026-01-01T00:00:00.000Z";
const id = (n: number) => `11111111-0000-0000-0000-${String(n).padStart(12, "0")}`;

const SEED_EXERCISES: Exercise[] = [
  // ── CHEST ─────────────────────────────────────────────────────────────────
  { id: id(1),  name: "Bench Press",               muscleGroup: "CHEST",     equipment: ["BARBELL"],             metValue: 5.0, defaultSets: 4, defaultReps: 8,  createdAt: S },
  { id: id(2),  name: "Incline Bench Press",        muscleGroup: "CHEST",     equipment: ["BARBELL"],             metValue: 5.0, defaultSets: 4, defaultReps: 8,  createdAt: S },
  { id: id(3),  name: "Decline Bench Press",        muscleGroup: "CHEST",     equipment: ["BARBELL"],             metValue: 5.0, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(4),  name: "Incline Dumbbell Press",     muscleGroup: "CHEST",     equipment: ["DUMBBELL"],            metValue: 4.5, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(5),  name: "Dumbbell Fly",               muscleGroup: "CHEST",     equipment: ["DUMBBELL"],            metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(6),  name: "Cable Fly",                  muscleGroup: "CHEST",     equipment: ["CABLE"],               metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(7),  name: "Chest Press Machine",        muscleGroup: "CHEST",     equipment: ["MACHINE"],             metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(8),  name: "Pec Deck",                   muscleGroup: "CHEST",     equipment: ["MACHINE"],             metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(9),  name: "Push Up",                    muscleGroup: "CHEST",     equipment: ["BODYWEIGHT"],          metValue: 3.8, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(10), name: "Dip",                        muscleGroup: "CHEST",     equipment: ["BODYWEIGHT"],          metValue: 4.0, defaultSets: 3, defaultReps: 10, createdAt: S },

  // ── BACK ──────────────────────────────────────────────────────────────────
  { id: id(11), name: "Pull Up",                    muscleGroup: "BACK",      equipment: ["BODYWEIGHT"],          metValue: 4.0, defaultSets: 3, defaultReps: 8,  createdAt: S },
  { id: id(12), name: "Chin Up",                    muscleGroup: "BACK",      equipment: ["BODYWEIGHT"],          metValue: 4.0, defaultSets: 3, defaultReps: 8,  createdAt: S },
  { id: id(13), name: "Barbell Row",                muscleGroup: "BACK",      equipment: ["BARBELL"],             metValue: 5.0, defaultSets: 4, defaultReps: 8,  createdAt: S },
  { id: id(14), name: "T-Bar Row",                  muscleGroup: "BACK",      equipment: ["BARBELL"],             metValue: 5.0, defaultSets: 4, defaultReps: 8,  createdAt: S },
  { id: id(15), name: "Dumbbell Row",               muscleGroup: "BACK",      equipment: ["DUMBBELL"],            metValue: 4.5, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(16), name: "Lat Pulldown",               muscleGroup: "BACK",      equipment: ["CABLE", "MACHINE"],   metValue: 4.0, defaultSets: 4, defaultReps: 10, createdAt: S },
  { id: id(17), name: "Seated Cable Row",           muscleGroup: "BACK",      equipment: ["CABLE"],               metValue: 4.0, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(18), name: "Face Pull",                  muscleGroup: "BACK",      equipment: ["CABLE"],               metValue: 3.5, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(19), name: "Machine Row",                muscleGroup: "BACK",      equipment: ["MACHINE"],             metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },

  // ── SHOULDERS ─────────────────────────────────────────────────────────────
  { id: id(20), name: "Overhead Press",             muscleGroup: "SHOULDERS", equipment: ["BARBELL"],             metValue: 5.0, defaultSets: 4, defaultReps: 8,  createdAt: S },
  { id: id(21), name: "Dumbbell Shoulder Press",    muscleGroup: "SHOULDERS", equipment: ["DUMBBELL"],            metValue: 4.5, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(22), name: "Arnold Press",               muscleGroup: "SHOULDERS", equipment: ["DUMBBELL"],            metValue: 4.5, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(23), name: "Lateral Raise",              muscleGroup: "SHOULDERS", equipment: ["DUMBBELL"],            metValue: 3.0, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(24), name: "Front Raise",                muscleGroup: "SHOULDERS", equipment: ["DUMBBELL"],            metValue: 3.0, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(25), name: "Rear Delt Fly",              muscleGroup: "SHOULDERS", equipment: ["DUMBBELL"],            metValue: 3.0, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(26), name: "Cable Lateral Raise",        muscleGroup: "SHOULDERS", equipment: ["CABLE"],               metValue: 3.0, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(27), name: "Machine Shoulder Press",     muscleGroup: "SHOULDERS", equipment: ["MACHINE"],             metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },

  // ── ARMS ──────────────────────────────────────────────────────────────────
  { id: id(28), name: "Barbell Curl",               muscleGroup: "ARMS",      equipment: ["BARBELL"],             metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(29), name: "Dumbbell Curl",              muscleGroup: "ARMS",      equipment: ["DUMBBELL"],            metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(30), name: "Hammer Curl",                muscleGroup: "ARMS",      equipment: ["DUMBBELL"],            metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(31), name: "Preacher Curl",              muscleGroup: "ARMS",      equipment: ["MACHINE", "BARBELL"],  metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(32), name: "Cable Curl",                 muscleGroup: "ARMS",      equipment: ["CABLE"],               metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(33), name: "Tricep Pushdown",            muscleGroup: "ARMS",      equipment: ["CABLE"],               metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(34), name: "Skull Crusher",              muscleGroup: "ARMS",      equipment: ["BARBELL"],             metValue: 3.5, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(35), name: "Overhead Tricep Extension",  muscleGroup: "ARMS",      equipment: ["DUMBBELL"],            metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(36), name: "Close Grip Bench Press",     muscleGroup: "ARMS",      equipment: ["BARBELL"],             metValue: 4.5, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(37), name: "Tricep Dip",                 muscleGroup: "ARMS",      equipment: ["BODYWEIGHT"],          metValue: 4.0, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(38), name: "Cable Overhead Extension",   muscleGroup: "ARMS",      equipment: ["CABLE"],               metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },

  // ── CORE ──────────────────────────────────────────────────────────────────
  { id: id(39), name: "Plank",                      muscleGroup: "CORE",      equipment: ["BODYWEIGHT"],          metValue: 3.0, defaultSets: 3, defaultReps: 1,  isTimeBased: true, createdAt: S },
  { id: id(40), name: "Side Plank",                 muscleGroup: "CORE",      equipment: ["BODYWEIGHT"],          metValue: 2.8, defaultSets: 3, defaultReps: 1,  isTimeBased: true, createdAt: S },
  { id: id(41), name: "Crunches",                   muscleGroup: "CORE",      equipment: ["BODYWEIGHT"],          metValue: 2.8, defaultSets: 3, defaultReps: 20, createdAt: S },
  { id: id(42), name: "Bicycle Crunch",             muscleGroup: "CORE",      equipment: ["BODYWEIGHT"],          metValue: 3.2, defaultSets: 3, defaultReps: 20, createdAt: S },
  { id: id(43), name: "Reverse Crunch",             muscleGroup: "CORE",      equipment: ["BODYWEIGHT"],          metValue: 2.8, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(44), name: "Leg Raise",                  muscleGroup: "CORE",      equipment: ["BODYWEIGHT"],          metValue: 3.0, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(45), name: "Hanging Leg Raise",          muscleGroup: "CORE",      equipment: ["BODYWEIGHT"],          metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(46), name: "Russian Twist",              muscleGroup: "CORE",      equipment: ["BODYWEIGHT"],          metValue: 3.0, defaultSets: 3, defaultReps: 20, createdAt: S },
  { id: id(47), name: "Mountain Climber",           muscleGroup: "CORE",      equipment: ["BODYWEIGHT"],          metValue: 6.0, defaultSets: 3, defaultReps: 20, createdAt: S },
  { id: id(48), name: "Ab Wheel Rollout",           muscleGroup: "CORE",      equipment: ["BODYWEIGHT"],          metValue: 4.0, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(49), name: "Dead Bug",                   muscleGroup: "CORE",      equipment: ["BODYWEIGHT"],          metValue: 2.8, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(50), name: "Cable Crunch",               muscleGroup: "CORE",      equipment: ["CABLE"],               metValue: 3.5, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(51), name: "Woodchop",                   muscleGroup: "CORE",      equipment: ["CABLE"],               metValue: 4.0, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(52), name: "Decline Sit Up",             muscleGroup: "CORE",      equipment: ["MACHINE"],             metValue: 3.2, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(53), name: "Ab Machine",                 muscleGroup: "CORE",      equipment: ["MACHINE"],             metValue: 3.0, defaultSets: 3, defaultReps: 15, createdAt: S },

  // ── LEGS ──────────────────────────────────────────────────────────────────
  { id: id(54), name: "Barbell Squat",              muscleGroup: "LEGS",      equipment: ["BARBELL"],             metValue: 6.0, defaultSets: 4, defaultReps: 8,  createdAt: S },
  { id: id(55), name: "Front Squat",                muscleGroup: "LEGS",      equipment: ["BARBELL"],             metValue: 6.0, defaultSets: 4, defaultReps: 6,  createdAt: S },
  { id: id(56), name: "Sumo Squat",                 muscleGroup: "LEGS",      equipment: ["BARBELL"],             metValue: 5.5, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(57), name: "Goblet Squat",               muscleGroup: "LEGS",      equipment: ["DUMBBELL"],            metValue: 5.0, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(58), name: "Deadlift",                   muscleGroup: "LEGS",      equipment: ["BARBELL"],             metValue: 6.0, defaultSets: 4, defaultReps: 5,  createdAt: S },
  { id: id(59), name: "Romanian Deadlift",          muscleGroup: "LEGS",      equipment: ["BARBELL"],             metValue: 5.5, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(60), name: "Sumo Deadlift",              muscleGroup: "LEGS",      equipment: ["BARBELL"],             metValue: 6.0, defaultSets: 3, defaultReps: 8,  createdAt: S },
  { id: id(61), name: "Lunges",                     muscleGroup: "LEGS",      equipment: ["DUMBBELL"],            metValue: 5.0, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(62), name: "Bulgarian Split Squat",      muscleGroup: "LEGS",      equipment: ["DUMBBELL"],            metValue: 5.5, defaultSets: 3, defaultReps: 10, createdAt: S },
  { id: id(63), name: "Step Up",                    muscleGroup: "LEGS",      equipment: ["DUMBBELL"],            metValue: 5.0, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(64), name: "Hip Thrust",                 muscleGroup: "LEGS",      equipment: ["BARBELL"],             metValue: 4.5, defaultSets: 4, defaultReps: 10, createdAt: S },
  { id: id(65), name: "Glute Bridge",               muscleGroup: "LEGS",      equipment: ["BODYWEIGHT"],          metValue: 3.5, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(66), name: "Leg Press",                  muscleGroup: "LEGS",      equipment: ["MACHINE"],             metValue: 5.0, defaultSets: 4, defaultReps: 10, createdAt: S },
  { id: id(67), name: "Hack Squat",                 muscleGroup: "LEGS",      equipment: ["MACHINE"],             metValue: 5.5, defaultSets: 4, defaultReps: 10, createdAt: S },
  { id: id(68), name: "Leg Extension",              muscleGroup: "LEGS",      equipment: ["MACHINE"],             metValue: 3.5, defaultSets: 3, defaultReps: 15, createdAt: S },
  { id: id(69), name: "Leg Curl",                   muscleGroup: "LEGS",      equipment: ["MACHINE"],             metValue: 3.5, defaultSets: 3, defaultReps: 12, createdAt: S },
  { id: id(70), name: "Seated Calf Raise",          muscleGroup: "LEGS",      equipment: ["MACHINE"],             metValue: 2.8, defaultSets: 4, defaultReps: 15, createdAt: S },
  { id: id(71), name: "Standing Calf Raise",        muscleGroup: "LEGS",      equipment: ["BODYWEIGHT"],          metValue: 3.0, defaultSets: 4, defaultReps: 20, createdAt: S },
  { id: id(72), name: "Cable Pull Through",         muscleGroup: "LEGS",      equipment: ["CABLE"],               metValue: 4.5, defaultSets: 3, defaultReps: 12, createdAt: S },

  // ── TIME-BASED EXERCISES ──────────────────────────────────────────────────
  { id: id(73), name: "Wall Sit",             muscleGroup: "LEGS",      equipment: ["BODYWEIGHT"], metValue: 4.0,  defaultSets: 3, defaultReps: 1, isTimeBased: true, createdAt: S },
  { id: id(74), name: "Shadow Boxing",        muscleGroup: "ARMS",      equipment: ["BODYWEIGHT"], metValue: 7.8,  defaultSets: 3, defaultReps: 1, isTimeBased: true, createdAt: S },
  { id: id(75), name: "Jump Rope",            muscleGroup: "LEGS",      equipment: ["BODYWEIGHT"], metValue: 12.3, defaultSets: 3, defaultReps: 1, isTimeBased: true, createdAt: S },
  { id: id(76), name: "Flutter Kicks",        muscleGroup: "CORE",      equipment: ["BODYWEIGHT"], metValue: 4.0,  defaultSets: 3, defaultReps: 1, isTimeBased: true, createdAt: S },
  { id: id(77), name: "Leg Raise 30°",        muscleGroup: "CORE",      equipment: ["BODYWEIGHT"], metValue: 3.5,  defaultSets: 3, defaultReps: 1, isTimeBased: true, createdAt: S },
  { id: id(78), name: "Leg Raise 45°",        muscleGroup: "CORE",      equipment: ["BODYWEIGHT"], metValue: 3.5,  defaultSets: 3, defaultReps: 1, isTimeBased: true, createdAt: S },
  { id: id(79), name: "Leg Raise 90°",        muscleGroup: "CORE",      equipment: ["BODYWEIGHT"], metValue: 3.5,  defaultSets: 3, defaultReps: 1, isTimeBased: true, createdAt: S },
  { id: id(80), name: "Marching in Place",    muscleGroup: "LEGS",      equipment: ["BODYWEIGHT"], metValue: 3.5,  defaultSets: 3, defaultReps: 1, isTimeBased: true, createdAt: S },
  { id: id(81), name: "Running in Place",     muscleGroup: "LEGS",      equipment: ["BODYWEIGHT"], metValue: 8.0,  defaultSets: 3, defaultReps: 1, isTimeBased: true, createdAt: S },
  { id: id(82), name: "Farmer's Walk",        muscleGroup: "FOREARMS",  equipment: ["DUMBBELL"],   metValue: 5.0,  defaultSets: 3, defaultReps: 1, isTimeBased: true, createdAt: S },
  { id: id(83), name: "Superman Hold",        muscleGroup: "CORE",      equipment: ["BODYWEIGHT"], metValue: 3.0,  defaultSets: 3, defaultReps: 1, isTimeBased: true, createdAt: S },
  { id: id(84), name: "Battle Ropes",         muscleGroup: "SHOULDERS", equipment: ["BODYWEIGHT"], metValue: 10.0, defaultSets: 3, defaultReps: 1, isTimeBased: true, createdAt: S },
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
          if (w.exercises.some((e) => e.exerciseId === entry.exerciseId)) return w;
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

      deleteWorkout: (workoutId: string) => {
        set((state) => ({
          workouts: state.workouts.filter((w) => w.id !== workoutId),
        }));
      },

      deleteWorkouts: (workoutIds: string[]) => {
        const idSet = new Set(workoutIds);
        set((state) => ({
          workouts: state.workouts.filter((w) => !idSet.has(w.id)),
        }));
      },

      toggleFavourite: (exerciseId: string) => {
        set((state) => ({
          exercises: state.exercises.map((e) =>
            e.id !== exerciseId ? e : { ...e, isFavourite: !(e.isFavourite ?? false) }
          ),
        }));
      },

      reorderExercises: (workoutId: string, orderedExerciseIds: string[]) => {
        const { workouts } = get();
        const updatedWorkouts = workouts.map((w) => {
          if (w.id !== workoutId) return w;
          const reordered = orderedExerciseIds
            .map((exId, idx) => {
              const existing = w.exercises.find((e) => e.exerciseId === exId);
              if (existing === undefined) return null;
              return { ...existing, order: idx };
            })
            .filter((e): e is WorkoutExercise => e !== null);
          const specifiedSet = new Set(orderedExerciseIds);
          const unspecified = w.exercises
            .filter((e) => !specifiedSet.has(e.exerciseId))
            .map((e, idx) => ({ ...e, order: reordered.length + idx }));
          return {
            ...w,
            exercises: [...reordered, ...unspecified],
            updatedAt: new Date().toISOString(),
          };
        });
        set({ workouts: updatedWorkouts });
      },
    }),
    {
      name: 'workout-store',
      storage: createJSONStorage(() => workoutMMKVAdapter),
      version: 2,
      migrate: (state: unknown, fromVersion: number) => {
        let s = state as Record<string, unknown>;
        if (fromVersion < 1) {
          // Reset exercises to fresh seeds (migrates old UPPER_BODY/CORE/LOWER_BODY enum values)
          s = { ...s, exercises: SEED_EXERCISES };
        }
        if (fromVersion < 2) {
          // Deduplicate exercises within each workout (keep first occurrence by order)
          type RawWorkout = { exercises: { exerciseId: string; order: number }[] };
          const workouts = (s.workouts as RawWorkout[] | undefined) ?? [];
          s = {
            ...s,
            workouts: workouts.map((w) => {
              const seen = new Set<string>();
              const deduped = w.exercises
                .sort((a, b) => a.order - b.order)
                .filter((e) => {
                  if (seen.has(e.exerciseId)) return false;
                  seen.add(e.exerciseId);
                  return true;
                })
                .map((e, idx) => ({ ...e, order: idx }));
              return { ...w, exercises: deduped };
            }),
          };
        }
        return s as unknown as WorkoutState;
      },
    }
  )
);

// ---------------------------------------------------------------------------
// Vanilla store accessor (for use in ViewModel without React hooks)
// ---------------------------------------------------------------------------

export const workoutStoreApi = useWorkoutStore;
