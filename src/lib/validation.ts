import { z } from "zod";

export const SetInputSchema = z.object({
  reps: z.number().int().nonnegative().nullable().optional(),
  weight: z.number().nonnegative().nullable().optional(),
  weight_unit: z.enum(["kg", "lbs"]).nullable().optional(),
  time_seconds: z.number().nonnegative().nullable().optional(),
  distance: z.number().nonnegative().nullable().optional(),
  distance_unit: z.enum(["m", "km", "mi"]).nullable().optional(),
  rpe: z.number().min(1).max(10).nullable().optional(),
  is_warmup: z.boolean().optional(),
  notes: z.string().max(500).nullable().optional(),
});
export type SetInput = z.infer<typeof SetInputSchema>;

export const TemplateInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  notes: z.string().max(2000).nullable().optional(),
});
export type TemplateInput = z.infer<typeof TemplateInputSchema>;

export const SessionDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const SessionUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  performed_on: SessionDateSchema.optional(),
  notes: z.string().max(2000).nullable().optional(),
  bodyweight: z.number().positive().nullable().optional(),
  ended_at: z.string().datetime().nullable().optional(),
});
export type SessionUpdate = z.infer<typeof SessionUpdateSchema>;
