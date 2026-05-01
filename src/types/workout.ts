import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const ExerciseGroupSchema = z.enum(["UPPER_BODY", "CORE", "LOWER_BODY"]);
export type ExerciseGroup = z.infer<typeof ExerciseGroupSchema>;
export const ExerciseGroupValues = ExerciseGroupSchema.enum;

export const EquipmentSchema = z.enum(["BARBELL", "DUMBBELL", "BODYWEIGHT", "CABLE", "MACHINE"]);
export type Equipment = z.infer<typeof EquipmentSchema>;
export const EquipmentValues = EquipmentSchema.enum;

// ---------------------------------------------------------------------------
// Exercise (template)
// ---------------------------------------------------------------------------

export const ExerciseSchema = z.object({
  id:              z.uuid(),
  name:            z.string().min(1),
  muscleGroup:     ExerciseGroupSchema,
  description:     z.string().min(1).optional(),
  equipment:       z.array(EquipmentSchema).optional(),
  defaultSets:     z.number().int().positive().optional(),
  defaultReps:     z.number().int().positive().optional(),
  defaultWeightKg: z.number().nonnegative().optional(),
  createdAt:       z.iso.datetime(),
});
export type Exercise = z.infer<typeof ExerciseSchema>;

// ---------------------------------------------------------------------------
// WorkoutExercise (join entity: Workout → Exercise with set/rep config)
// ---------------------------------------------------------------------------

export const WorkoutExerciseSchema = z.object({
  exerciseId:  z.uuid(),
  order:       z.number().int().nonnegative(),
  sets:        z.number().int().positive(),
  reps:        z.number().int().positive(),
  weightKg:    z.number().nonnegative().optional(),
  restSeconds: z.number().int().nonnegative().optional(),
});
export type WorkoutExercise = z.infer<typeof WorkoutExerciseSchema>;

// ---------------------------------------------------------------------------
// AutoTimerConfig (optional auto-mode timer settings attached to a Workout)
// ---------------------------------------------------------------------------

export const AutoTimerConfigSchema = z.object({
  secondsPerSet:              z.number().int().positive(),
  restBetweenSetsSecs:        z.number().int().nonnegative(),
  restBetweenExercisesSecs:   z.number().int().nonnegative(),
});
export type AutoTimerConfig = z.infer<typeof AutoTimerConfigSchema>;

// ---------------------------------------------------------------------------
// Workout (template: named collection of exercises)
// ---------------------------------------------------------------------------

export const WorkoutSchema = z.object({
  id:              z.uuid(),
  name:            z.string().min(1),
  description:     z.string().min(1).optional(),
  exercises:       z.array(WorkoutExerciseSchema),
  autoTimerConfig: AutoTimerConfigSchema.optional(),
  createdAt:       z.iso.datetime(),
  updatedAt:       z.iso.datetime(),
});
export type Workout = z.infer<typeof WorkoutSchema>;

// ---------------------------------------------------------------------------
// Parse helpers
// ---------------------------------------------------------------------------

export function parseExercise(data: unknown): Exercise {
  return ExerciseSchema.parse(data);
}

export function parseWorkout(data: unknown): Workout {
  return WorkoutSchema.parse(data);
}
