/**
 * @file backend/src/tactical/state/schema.ts
 * @description Zod schemas for tactical combat state management
 */

import { z } from 'zod';

// Re-export types from existing tactical types
const GridPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const TerrainTypeSchema = z.enum([
  'floor',
  'wall',
  'difficult',
  'cover_half',
  'cover_full',
  'hazard',
  'elevation_high',
  'elevation_low',
]);

const GridCellSchema = z.object({
  x: z.number(),
  y: z.number(),
  terrain: TerrainTypeSchema,
  blocksLOS: z.boolean(),
  blocksMovement: z.boolean(),
  movementCost: z.number(),
  coverBonus: z.number(),
  hazardDamage: z.string().optional(),
});

const SpawnZonesSchema = z.object({
  players: z.array(GridPositionSchema),
  enemies: z.array(GridPositionSchema),
});

const TacticalArenaSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  gridWidth: z.number(),
  gridHeight: z.number(),
  cells: z.array(GridCellSchema),
  spawnZones: SpawnZonesSchema,
  sourceType: z.enum(['hand_crafted', 'world_generated']).default('hand_crafted'),
  worldCoordinates: z.object({ x: z.number(), y: z.number() }).nullable().default(null),
});

const TacticalUnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  hp: z.number(),
  maxHp: z.number(),
  tempHp: z.number().default(0),
  armorClass: z.number(),
  initiative: z.number(),

  strength: z.number(),
  dexterity: z.number(),
  constitution: z.number(),
  intelligence: z.number(),
  wisdom: z.number(),
  charisma: z.number(),

  proficiencyBonus: z.number(),
  speed: z.number(),
  reach: z.number(),

  position: GridPositionSchema,
  facing: z.number().optional(),

  allegiance: z.enum(['player', 'enemy', 'neutral']),
  isPlayer: z.boolean(),

  avatar: z.string().optional(),
  conditions: z.array(z.string()).default([]),

  movementRemaining: z.number(),
  hasAction: z.boolean().default(true),
  hasBonusAction: z.boolean().default(true),
  hasReaction: z.boolean().default(true),
  hasMoved: z.boolean().default(false),
  hasActed: z.boolean().default(false),

  deathSaves: z
    .object({
      successes: z.number().default(0),
      failures: z.number().default(0),
    })
    .optional(),

  spellSlots: z
    .array(
      z.object({
        level: z.number(),
        total: z.number(),
        used: z.number(),
      })
    )
    .optional(),

  behaviorTags: z.array(z.string()).optional(),
});

const ParsedCommandSchema = z.object({
  actorName: z.string(),
  actorId: z.string().nullable(),
  intent: z.string(),
  target: z
    .object({
      unitName: z.string().optional(),
      unitId: z.string().nullable().optional(),
      position: GridPositionSchema.optional(),
    })
    .optional(),
  spellName: z.string().optional(),
  confidence: z.number(),
});

const PredictedDamageSchema = z.object({
  min: z.number(),
  max: z.number(),
  avg: z.number(),
});

const ActionPlanSchema = z.object({
  id: z.string(),
  commandText: z.string(),
  parsed: ParsedCommandSchema,
  validation: z.object({
    valid: z.boolean(),
    errors: z.array(z.string()),
    warnings: z.array(z.string()),
  }),
  preview: z.object({
    movementPath: z.array(GridPositionSchema).optional(),
    affectedUnits: z.array(
      z.object({
        unitId: z.string(),
        effect: z.string(),
        predictedDamage: PredictedDamageSchema.optional(),
      })
    ),
    diceNeeded: z.array(z.string()),
    resourceCost: z.string().optional(),
    hitChance: z.number().optional(),
  }),
});

const CombatLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  round: z.number(),
  actorId: z.string().optional(),
  actorName: z.string().optional(),
  type: z.enum(['movement', 'attack', 'spell', 'damage', 'healing', 'condition', 'turn', 'initiative', 'system']),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

const DiceRollSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  notation: z.string(),
  result: z.number(),
  rolls: z.array(z.number()),
  modifier: z.number().default(0),
  purpose: z.string().optional(),
});

/**
 * Complete tactical state schema
 */
const TacticalStateSchema = z.object({
  // State engine versioning
  version: z.number().default(0),
  lastEventId: z.string().nullable().default(null),

  // Encounter basics
  encounterId: z.string(),
  arenaId: z.string(),
  phase: z.enum(['setup', 'initiative', 'in_progress', 'complete']).default('setup'),

  // Arena
  arena: TacticalArenaSchema.nullable().default(null),

  // Units
  units: z.array(TacticalUnitSchema).default([]),

  // Turn management
  turnOrder: z.array(z.string()).default([]),
  activeUnitId: z.string().nullable().default(null),
  round: z.number().default(0),

  // Natural language command flow
  pendingCommand: z.string().nullable().default(null),
  parsedCommand: ParsedCommandSchema.nullable().default(null),
  actionPlan: ActionPlanSchema.nullable().default(null),

  // Combat results
  isCombatOver: z.boolean().default(false),
  winner: z.enum(['player', 'enemy', 'neutral']).nullable().default(null),

  // History
  log: z.array(CombatLogEntrySchema).default([]),
  diceHistory: z.array(DiceRollSchema).default([]),
  diceRollerSeed: z.number(),
});

export type TacticalState = z.infer<typeof TacticalStateSchema>;
export type GridCell = z.infer<typeof GridCellSchema>;
export type TacticalArena = z.infer<typeof TacticalArenaSchema>;
export type TacticalUnit = z.infer<typeof TacticalUnitSchema>;
export type ParsedCommand = z.infer<typeof ParsedCommandSchema>;
export type ActionPlan = z.infer<typeof ActionPlanSchema>;

// Export schemas for use in other modules
export { TacticalStateSchema, TacticalArenaSchema, TacticalUnitSchema };
export type CombatLogEntry = z.infer<typeof CombatLogEntrySchema>;
export type DiceRoll = z.infer<typeof DiceRollSchema>;
export type GridPosition = z.infer<typeof GridPositionSchema>;
