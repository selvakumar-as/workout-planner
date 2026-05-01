import { useWorkoutStore } from '../stores/workoutStore';
import type {
  AutoTimerConfig,
  Equipment,
  Exercise,
  ExerciseGroup,
  Workout,
  WorkoutExercise,
} from '../types';

export function useWorkoutViewModel() {
  const workouts = useWorkoutStore((s) => s.workouts);
  const exercises = useWorkoutStore((s) => s.exercises);
  const addWorkoutAction = useWorkoutStore((s) => s.addWorkout);
  const addExerciseAction = useWorkoutStore((s) => s.addExercise);
  const addExerciseToWorkoutAction = useWorkoutStore((s) => s.addExerciseToWorkout);
  const removeExerciseFromWorkoutAction = useWorkoutStore((s) => s.removeExerciseFromWorkout);
  const updateWorkoutAction = useWorkoutStore((s) => s.updateWorkout);

  const getWorkoutById = (id: string): Workout | undefined =>
    workouts.find((w) => w.id === id);

  const getExerciseById = (id: string): Exercise | undefined =>
    exercises.find((e) => e.id === id);

  const getExercisesByGroup = (group: ExerciseGroup): Exercise[] =>
    exercises.filter((e) => e.muscleGroup === group);

  const addWorkout = (name: string, description?: string): void => {
    addWorkoutAction({ name, description, exercises: [] });
  };

  const addExercise = (
    name: string,
    muscleGroup: ExerciseGroup,
    equipment?: Equipment[]
  ): void => {
    addExerciseAction({ name, muscleGroup, equipment });
  };

  const addExerciseToWorkout = (
    workoutId: string,
    entry: Omit<WorkoutExercise, 'order'>
  ): void => {
    addExerciseToWorkoutAction(workoutId, entry);
  };

  const removeExerciseFromWorkout = (workoutId: string, exerciseId: string): void => {
    removeExerciseFromWorkoutAction(workoutId, exerciseId);
  };

  const updateWorkoutTimerConfig = (
    workoutId: string,
    config: AutoTimerConfig | undefined
  ): void => {
    updateWorkoutAction(workoutId, { autoTimerConfig: config });
  };

  return {
    // Data
    workouts,
    exercises,
    // Handlers
    getWorkoutById,
    getExerciseById,
    getExercisesByGroup,
    addWorkout,
    addExercise,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    updateWorkoutTimerConfig,
  };
}
