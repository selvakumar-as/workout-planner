import { z } from "zod";

// ---------------------------------------------------------------------------
// Enum
// ---------------------------------------------------------------------------

export const SessionStatusSchema = z.enum(["IN_PROGRESS", "COMPLETED", "ABANDONED"]);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;
export const SessionStatusValues = SessionStatusSchema.enum;

// ---------------------------------------------------------------------------
// SessionSet (one logged set within a session)
// ---------------------------------------------------------------------------

export const SessionSetSchema = z.object({
  id:          z.uuid(),
  exerciseId:  z.uuid(),
  setNumber:   z.number().int().positive(),    // 1-indexed (Set 1, Set 2...)
  reps:        z.number().int().nonnegative(), // 0 allowed for failed sets
  weightKg:    z.number().nonnegative().optional(),
  completedAt: z.iso.datetime(),
});
export type SessionSet = z.infer<typeof SessionSetSchema>;

// ---------------------------------------------------------------------------
// Session (in-progress or completed workout instance)
// ---------------------------------------------------------------------------

export const SessionSchema = z.object({
  id:          z.uuid(),
  workoutId:   z.uuid(),
  startedAt:   z.iso.datetime(),
  completedAt: z.iso.datetime().optional(), // absent while IN_PROGRESS
  status:      SessionStatusSchema,
  sets:        z.array(SessionSetSchema),
  notes:       z.string().min(1).optional(),
});
export type Session = z.infer<typeof SessionSchema>;

// ---------------------------------------------------------------------------
// Parse helper
// ---------------------------------------------------------------------------

export function parseSession(data: unknown): Session {
  return SessionSchema.parse(data);
}
