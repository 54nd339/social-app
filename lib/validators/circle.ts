import { z } from 'zod/v4';

export const createCircleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  emoji: z.string().max(10).optional(),
});

export const updateCircleSchema = z.object({
  circleId: z.string().uuid(),
  name: z.string().min(1).max(50),
  emoji: z.string().max(10).optional(),
});

export const addCircleMemberSchema = z.object({
  circleId: z.string().uuid(),
  userId: z.string().uuid(),
});

export type CreateCircleInput = z.infer<typeof createCircleSchema>;
export type UpdateCircleInput = z.infer<typeof updateCircleSchema>;
export type AddCircleMemberInput = z.infer<typeof addCircleMemberSchema>;
