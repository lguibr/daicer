import { z } from 'zod';

export const SpeedSchema = z.union([
  z.number(), // Legacy support
  z.object({
    walk: z.number().default(30),
    fly: z.number().optional(),
    swim: z.number().optional(),
    climb: z.number().optional(),
    burrow: z.number().optional(),
    hover: z.boolean().optional(),
  }),
]);

export type Speed = z.infer<typeof SpeedSchema>;
