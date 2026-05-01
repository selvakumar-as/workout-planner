import { workoutStoreApi } from "../store/workoutStore";
import type {
  AutoTimerConfig,
  Equipment,
  Exercise,
  ExerciseGroup,
  Workout,
  WorkoutExercise,
} from "../types";

// ---------------------------------------------------------------------------
// WorkoutViewModel
// Pure TypeScript class — NO React imports.
// State is read from the Zustand store via getState().
// Actions delegate to the store's action methods.
// ---------------------------------------------------------------------------

export class WorkoutViewModel {
  // -------------------------------------------------------------------------
  // Getters — read from store snapshot
  // -------------------------------------------------------------------------

  get workouts(): Workout[] {
    return workoutStoreApi.getState().workouts;
  }

  get exercises(): Exercise[] {
    return workoutStoreApi.getState().exercises;
  }

  getWorkoutById(id: string): Workout | undefined {
    return workoutStoreApi.getState().workouts.find((w) => w.id === id);
  }

  getExerciseById(id: string): Exercise | undefined {
    return workoutStoreApi.getState().exercises.find((e) => e.id === id);
  }

  getExercisesByGroup(group: ExerciseGroup): Exercise[] {
    return workoutStoreApi
      .getState()
      .exercises.filter((e) => e.muscleGroup === group);
  }

  // -------------------------------------------------------------------------
  // Actions — delegate to store
  // -------------------------------------------------------------------------

  addWorkout(name: string, description?: string): void {
    workoutStoreApi.getState().addWorkout({
      name,
      description,
      exercises: [],
    });
  }

  addExercise(
    name: string,
    muscleGroup: ExerciseGroup,
    equipment?: Equipment[]
  ): void {
    workoutStoreApi.getState().addExercise({
      name,
      muscleGroup,
      equipment,
    });
  }

  addExerciseToWorkout(
    workoutId: string,
    entry: Omit<WorkoutExercise, "order">
  ): void {
    workoutStoreApi.getState().addExerciseToWorkout(workoutId, entry);
  }

  removeExerciseFromWorkout(workoutId: string, exerciseId: string): void {
    workoutStoreApi.getState().removeExerciseFromWorkout(workoutId, exerciseId);
  }

  updateWorkoutTimerConfig(workoutId: string, config: AutoTimerConfig | undefined): void {
    workoutStoreApi.getState().updateWorkout(workoutId, { autoTimerConfig: config });
  }
}
