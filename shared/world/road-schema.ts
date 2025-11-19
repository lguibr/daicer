import { z } from 'zod';

export const WaypointSchema = z.object({
  x: z.number(),
  y: z.number(),
  type: z.enum(['junction', 'waystation', 'bridge', 'path']),
});

export const RoadSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  waypoints: z.array(WaypointSchema),
  terrain: z.enum(['flat', 'hilly', 'mountain', 'forest']),
  quality: z.enum(['trail', 'path', 'road', 'highway']),
});

export type Waypoint = z.infer<typeof WaypointSchema>;
export type Road = z.infer<typeof RoadSchema>;
