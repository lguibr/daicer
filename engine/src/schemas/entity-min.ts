import { z } from 'zod';
import { EntitySheetSchema } from './entity-sheet';

// We need a lightweight EntitySchema for the world state to replace z.any()
export const MinEntitySchema = z
  .object({
    id: z.string(),
    documentId: z.string().optional(),
    name: z.string(),
    type: z.string(), // 'player' | 'monster' | 'npc'
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    hp: z.number().optional(),
    maxHp: z.number().optional(),
    currentHp: z.number().optional(), // Inconsistency in backend vs frontend usually
    sheet: EntitySheetSchema.optional(), // The full sheet
  })
  .passthrough(); // Allow extra props for now
