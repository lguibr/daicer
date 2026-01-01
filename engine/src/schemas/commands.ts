import { z } from 'zod';
import { CoordinatesSchema } from './voxel';
import { AttributeSchema } from './entity-sheet';

// === Base Command Types ===

export const BaseCommandSchema = z.object({
  id: z.string().uuid().optional(), // Optional client-side ID for tracking
  timestamp: z.number().optional(),
});

// === Specific Commands ===

export const MoveCommandSchema = BaseCommandSchema.extend({
  type: z.literal('MOVE'),
  payload: z.object({
    actorId: z.string(),
    targetPosition: CoordinatesSchema,
    mode: z.enum(['walk', 'dash', 'teleport', 'fly']).optional().default('walk'),
  }),
});

export const AttackCommandSchema = BaseCommandSchema.extend({
  type: z.literal('ATTACK'),
  payload: z.object({
    actorId: z.string(),
    targetId: z.string(),
    weaponId: z.string().optional(), // If undefined, use equipped or unarmed
    offhand: z.boolean().optional(),
  }),
});

export const SkillCheckCommandSchema = BaseCommandSchema.extend({
  type: z.literal('SKILL_CHECK'),
  payload: z.object({
    actorId: z.string(),
    skillId: z.string().optional(),
    attribute: AttributeSchema.optional(), // Can fallback to attribute check
    difficultyClass: z.number().optional(), // DC
    advantage: z.boolean().optional(),
    disadvantage: z.boolean().optional(),
  }),
});

export const CastSpellCommandSchema = BaseCommandSchema.extend({
  type: z.literal('CAST_SPELL'),
  payload: z.object({
    actorId: z.string(),
    spellId: z.string(),
    targetId: z.string().optional(),
    targetPosition: CoordinatesSchema.optional(),
    level: z.number().optional(), // Upcasting
  }),
});

export const InteractCommandSchema = BaseCommandSchema.extend({
  type: z.literal('INTERACT'),
  payload: z.object({
    actorId: z.string(),
    targetId: z.string(),
    interactionType: z.enum(['open', 'close', 'lock', 'unlock', 'loot', 'talk']),
  }),
});

export const EndTurnCommandSchema = BaseCommandSchema.extend({
  type: z.literal('END_TURN'),
  payload: z.object({
    actorId: z.string(),
  }),
});

export const LongRestCommandSchema = BaseCommandSchema.extend({
  type: z.literal('LONG_REST'),
  payload: z.object({
    actorId: z.string(), // Party leader or area? Maybe just list of actors or single actor triggering it.
    // Agent tool uses payload directly. Let's assume actorId.
    // tool-registry simply passes payload.
    // Let's make payload flexible or minimal.
    duration: z.number().optional(),
  }),
});

export const ModifyTerrainCommandSchema = BaseCommandSchema.extend({
  type: z.literal('MODIFY_TERRAIN'),
  payload: z
    .object({
      position: CoordinatesSchema.optional(),
      blockType: z.string().optional(),
      action: z.enum(['set', 'remove', 'fill']).optional(),
    })
    .passthrough(), // Allow flexible payload for voxel engine
});

// === Union of All Commands ===

export const CommandSchema = z.union([
  MoveCommandSchema,
  AttackCommandSchema,
  SkillCheckCommandSchema,
  CastSpellCommandSchema,
  InteractCommandSchema,
  InteractCommandSchema,
  EndTurnCommandSchema,
  LongRestCommandSchema,
  ModifyTerrainCommandSchema,
]);

// Helper to infer discriminated union type
// export type Command = z.infer<typeof CommandSchema>; // Moved to types/index.ts
