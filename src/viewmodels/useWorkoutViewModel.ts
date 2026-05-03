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
  const updateWorkoutExerciseAction = useWorkoutStore((s) => s.updateWorkoutExercise);
  const updateWorkoutAction = useWorkoutStore((s) => s.updateWorkout);
  const deleteWorkoutAction = useWorkoutStore((s) => s.deleteWorkout);
  const deleteWorkoutsAction = useWorkoutStore((s) => s.deleteWorkouts);
  const toggleFavouriteAction = useWorkoutStore((s) => s.toggleFavourite);
  const reorderExercisesAction = useWorkoutStore((s) => s.reorderExercises);

  const sortedExercises = [...exercises].sort((a, b) => {
    const aFav = a.isFavourite ?? false;
    const bFav = b.isFavourite ?? false;
    if (aFav !== bFav) return aFav ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const getWorkoutById = (id: string): Workout | undefined =>
    workouts.find((w) => w.id === id);

  const getExerciseById = (id: string): Exercise | undefined =>
    exercises.find((e) => e.id === id);

  const getExercisesByGroup = (group: ExerciseGroup): Exercise[] =>
    sortedExercises.filter((e) => e.muscleGroup === group);

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

  const updateWorkoutExercise = (
    workoutId: string,
    exerciseId: string,
    patch: Partial<Pick<WorkoutExercise, 'sets' | 'reps' | 'weightKg' | 'restSeconds' | 'durationPerSetSecs'>>
  ): void => {
    updateWorkoutExerciseAction(workoutId, exerciseId, patch);
  };

  const deleteWorkout = (workoutId: string): void => {
    deleteWorkoutAction(workoutId);
  };

  const deleteWorkouts = (workoutIds: string[]): void => {
    deleteWorkoutsAction(workoutIds);
  };

  const isWorkoutNameTaken = (name: string, excludeId?: string): boolean =>
    workouts.some(
      (w) => w.name.trim().toLowerCase() === name.trim().toLowerCase() && w.id !== excludeId
    );

  const updateWorkoutTimerConfig = (
    workoutId: string,
    config: AutoTimerConfig | undefined
  ): void => {
    updateWorkoutAction(workoutId, { autoTimerConfig: config });
  };

  const toggleFavourite = (exerciseId: string): void => {
    toggleFavouriteAction(exerciseId);
  };

  const reorderExercises = (workoutId: string, orderedExerciseIds: string[]): void => {
    reorderExercisesAction(workoutId, orderedExerciseIds);
  };

  return {
    // Data
    workouts,
    exercises: sortedExercises,
    // Handlers
    getWorkoutById,
    getExerciseById,
    getExercisesByGroup,
    addWorkout,
    addExercise,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    updateWorkoutExercise,
    updateWorkoutTimerConfig,
    deleteWorkout,
    deleteWorkouts,
    isWorkoutNameTaken,
    toggleFavourite,
    reorderExercises,
  };
}
