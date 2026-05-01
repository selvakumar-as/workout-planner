import { z } from "zod";

export const GenderSchema = z.enum(["MALE", "FEMALE", "OTHER"]);
export type Gender = z.infer<typeof GenderSchema>;

export const UserProfileSchema = z.object({
  name:         z.string().optional(),
  age:          z.number().int().positive().optional(),
  gender:       GenderSchema.optional(),
  heightCm:     z.number().positive().optional(),
  weightKg:     z.number().positive().optional(),
  soundEnabled: z.boolean(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;
