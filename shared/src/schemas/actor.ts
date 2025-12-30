import { z } from 'zod';

export const SpeedSchema = z.union([
  z.number(), // Legacy support
  z.object({
    walkSpeed: z.number().default(30),
    flySpeed: z.number().optional(),
    swimSpeed: z.number().optional(),
    climbSpeed: z.number().optional(),
    burrowSpeed: z.number().optional(), // Added burrow
    hover: z.boolean().optional(), // Added hover
  }),
]);

export type Speed = z.infer<typeof SpeedSchema>;
