/**
 * Game state schema using Zod for LangGraph StateGraph
 * Defines the complete game state with reducers for state management
 */

import * as z from 'zod';
import { TacticalArenaSchema } from '../tactical/state/schema';
import { WorldConditionSchema, RandomEventSchema } from '../services/entropy/types';
import { StreamEventSchema, WorldGenPhase } from '../types/stream-events';
import { HistoricalPeriodSchema } from '@daicer/shared';

const AdventureLengthSchema = z.enum(['flash', 'short', 'medium', 'long', 'epic', 'legendary']);
const DifficultySchema = z.enum(['storyteller', 'easy', 'medium', 'challenging', 'gritty', 'deadly']);
const LanguageSchema = z.enum(['en', 'es', 'pt-BR']);

/**
 * Message schema with MessagesZodMeta for proper message handling
 */
export const MessageSchema = z.object({
  id: z.string(),
  sender: z.union([z.literal('DM'), z.string()]),
  recipientId: z.string().optional(),
  text: z.string(),
  images: z.array(z.string()).optional(),
  timestamp: z.number(),
  targetPlayer: z.string().optional(),
});

/**
 * Character sheet schema (complete D&D 5e character)
 */
const CharacterSheetSchema = z.object({
  name: z.string(),
  race: z.string(),
  characterClass: z.string(),
  background: z.string(),
  alignment: z.string(),
  level: z.number(),
  xp: z.number(),
  hp: z.number(),
  maxHp: z.number(),
  temporaryHp: z.number(),
  hitDice: z.object({ total: z.number(), current: z.number() }),
  deathSaves: z.object({ successes: z.number(), failures: z.number() }),
  armorClass: z.number(),
  initiative: z.number(),
  speed: z.number(),
  proficiencyBonus: z.number(),
  inspiration: z.boolean(),
  attributes: z.record(z.string(), z.number()),
  savingThrows: z.object({
    fortitude: z.number(),
    reflex: z.number(),
    will: z.number(),
  }),
  skills: z.record(z.string(), z.number()),
  baseAttackBonus: z.number(),
  attacks: z.array(
    z.object({
      name: z.string(),
      bonus: z.string(),
      damageType: z.string(),
    })
  ),
  equipment: z.object({
    equippedItems: z.object({
      mainHand: z.string().nullable(),
      offHand: z.string().nullable(),
      armor: z.string().nullable(),
      shield: z.string().nullable(),
      accessory1: z.string().nullable(),
      accessory2: z.string().nullable(),
    }),
    inventory: z.array(
      z.object({
        itemIndex: z.string(),
        quantity: z.number().int().positive(),
      })
    ),
    totalWeight: z.number().default(0),
  }),
  currency: z.object({
    cp: z.number(),
    sp: z.number(),
    ep: z.number(),
    gp: z.number(),
    pp: z.number(),
  }),
  proficienciesAndLanguages: z.string(),
  features: z.string(),
  appearance: z.object({
    age: z.string(),
    height: z.string(),
    weight: z.string(),
    eyes: z.string(),
    skin: z.string(),
    hair: z.string(),
    description: z.string(),
  }),
  personality: z.object({
    traits: z.string(),
    ideals: z.string(),
    bonds: z.string(),
    flaws: z.string(),
  }),
  backstory: z.string(),
  alliesAndOrganizations: z.string(),
  treasure: z.string(),
  spellcasting: z.object({
    class: z.string(),
    ability: z.string(),
    saveDC: z.number(),
    attackBonus: z.number(),
    cantrips: z.array(z.string()),
    spellsKnown: z.array(z.string()),
    slots: z.array(
      z.object({
        level: z.number(),
        total: z.number(),
        expended: z.number(),
      })
    ),
  }),
});

/**
 * Player schema
 */
export const PlayerSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  character: CharacterSheetSchema,
  action: z.string().nullable(),
  isReady: z.boolean(),
  joinedAt: z.number(),
});

/**
 * Creature schema
 */
export const CreatureSchema = z.object({
  name: z.string(),
  hp: z.number(),
  maxHp: z.number(),
  attackBonus: z.number(),
  damage: z.string(),
});

/**
 * Map feature schema for placed entities on world map
 */
export const MapFeatureSchema = z.object({
  id: z.string(),
  position: z.object({ x: z.number().int(), y: z.number().int(), z: z.number().int() }),
  type: z.enum(['building', 'landmark', 'npc', 'quest_marker', 'resource', 'dungeon', 'town', 'custom']),
  name: z.string(),
  description: z.string(),
  isVisible: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Position on the grid
 */
export const PositionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
});

/**
 * D&D 5e conditions
 */
export const ConditionType = z.enum([
  'blinded',
  'charmed',
  'deafened',
  'frightened',
  'grappled',
  'incapacitated',
  'invisible',
  'paralyzed',
  'petrified',
  'poisoned',
  'prone',
  'restrained',
  'stunned',
  'unconscious',
  'exhaustion',
]);

export type ConditionType = z.infer<typeof ConditionType>;

export const ConditionSchema = z.object({
  type: ConditionType,
  level: z.number().int().min(0).max(6).optional(),
  source: z.string().optional(),
  duration: z.number().int().optional(),
});

/**
 * Tactical feature schema for obstacles and terrain modifiers
 */
export const TacticalFeatureSchema = z.object({
  id: z.string(),
  position: PositionSchema,
  type: z.enum(['wall', 'pillar', 'tree', 'boulder', 'barrel', 'difficult_terrain', 'elevation']),
  blocksMovement: z.boolean(),
  blocksLineOfSight: z.boolean(),
  cover: z.enum(['none', 'half', 'three-quarters', 'full']).default('none'),
  elevation: z.number().default(0),
});

/**
 * Combat character schema
 */
export const CombatCharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  hp: z.number().int().min(0),
  maxHp: z.number().int().positive(),
  tempHp: z.number().int().min(0).default(0),
  armorClass: z.number().int().positive(),
  position: PositionSchema,
  initiative: z.number(),
  avatar: z.string(),
  isPlayer: z.boolean(),

  // Ability scores
  strength: z.number().int().min(1).max(30).default(10),
  dexterity: z.number().int().min(1).max(30).default(10),
  constitution: z.number().int().min(1).max(30).default(10),
  intelligence: z.number().int().min(1).max(30).default(10),
  wisdom: z.number().int().min(1).max(30).default(10),
  charisma: z.number().int().min(1).max(30).default(10),

  // Combat stats
  proficiencyBonus: z.number().int().min(2).default(2),
  speed: z.number().int().positive(),
  reach: z.number().int().positive().default(1),

  // Turn state
  hasMoved: z.boolean().default(false),
  hasActed: z.boolean().default(false),
  hasReaction: z.boolean().default(true),
  hasBonusAction: z.boolean().default(true),
  movementRemaining: z.number().int().min(0).default(0),

  // Conditions and effects
  conditions: z.array(ConditionSchema).default([]),

  // Death saves (for PCs)
  deathSaves: z
    .object({
      successes: z.number().int().min(0).max(3).default(0),
      failures: z.number().int().min(0).max(3).default(0),
    })
    .optional(),
});

export type CombatCharacter = z.infer<typeof CombatCharacterSchema>;
export type Condition = z.infer<typeof ConditionSchema>;

/**
 * Dice roll result schema
 */
export const DiceRollResultSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  rollType: z.enum(['initiative', 'attack', 'damage', 'saving_throw', 'ability_check']),
  diceType: z.enum(['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100']),
  numberOfDice: z.number().int().positive(),
  rawRolls: z.array(z.number().int()),
  modifier: z.number().int(),
  advantageType: z.enum(['normal', 'advantage', 'disadvantage']),
  finalResult: z.number().int(),
  description: z.string(),
  contextId: z.string().optional(),
});

/**
 * Spell preview snapshot stored in combat state
 */
export const SpellPreviewSchema = z.object({
  spellId: z.string(),
  spellName: z.string(),
  casterId: z.string(),
  spellLevel: z.number().int().min(0).max(9),
  school: z.string().optional(),
  effectShape: z.string(),
  range: z.string().optional(),
  casterPosition: PositionSchema,
  targetPosition: PositionSchema,
  affectedSquares: z.array(PositionSchema),
  validTargets: z.array(PositionSchema),
  friendlyFireRisk: z.boolean(),
  requiresLineOfSight: z.boolean(),
  lineOfSightBlocked: z.boolean(),
  obstacles: z.array(PositionSchema).optional(),
  metadata: z
    .object({
      description: z.string().optional(),
    })
    .partial()
    .optional(),
});

/**
 * Spell resolution snapshot after casting
 */
export const SpellResolutionSchema = z.object({
  spellId: z.string(),
  casterId: z.string(),
  affectedCharacterIds: z.array(z.string()),
  summary: z.string(),
  damageRolls: z.array(DiceRollResultSchema),
  savingThrows: z.array(DiceRollResultSchema),
  attackRolls: z.array(DiceRollResultSchema),
  friendlyFireOccurred: z.boolean(),
});

/**
 * Combat log entry
 */
export const CombatLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  message: z.string(),
  type: z.enum(['info', 'attack', 'damage', 'move', 'turn', 'round', 'victory']).default('info'),
  relatedRolls: z.array(z.string()).default([]),
});

/**
 * Combat state schema
 */
export const CombatStateSchema = z.object({
  // Combat session ID
  sessionId: z.string(),

  // Characters in combat
  characters: z.array(CombatCharacterSchema),

  // Turn tracking
  activeCharacterId: z.string().nullable(),
  turnOrder: z.array(z.string()),
  round: z.number().int().min(0).default(0),

  // NEW: Tactical arena integration
  tacticalArena: TacticalArenaSchema.nullable().default(null),
  tacticalMode: z.boolean().default(false),
  pendingNaturalLanguageCommand: z.string().nullable().default(null),

  // Combat status
  isCombatOver: z.boolean().default(false),
  winner: z.enum(['player', 'enemy']).nullable().default(null),

  // Logging
  log: z.array(CombatLogEntrySchema).default([]),

  // Dice history for time-travel
  diceHistory: z.array(DiceRollResultSchema).default([]),

  // Grid configuration
  gridWidth: z.number().int().positive().default(10),
  gridHeight: z.number().int().positive().default(10),

  // Tactical features (obstacles, terrain modifiers)
  features: z.array(TacticalFeatureSchema).default([]),

  // Combat phase tracking
  phase: z
    .enum([
      'setup',
      'initiative',
      'turn_start',
      'action_selection',
      'movement',
      'action',
      'bonus_action',
      'reaction',
      'turn_end',
      'combat_end',
    ])
    .default('setup'),

  // Pending opportunity attacks
  pendingOpportunityAttacks: z
    .array(
      z.object({
        attackerId: z.string(),
        defenderId: z.string(),
        trigger: z.string(),
      })
    )
    .default([]),

  // Dice roller seed for determinism
  diceRollerSeed: z.number(),

  // Current spell preview (if any)
  spellPreview: SpellPreviewSchema.nullable().default(null),

  // Last spell resolution snapshot
  lastSpellResolution: SpellResolutionSchema.nullable().default(null),
});

export type CombatState = z.infer<typeof CombatStateSchema>;

/**
 * Main game state schema with reducers
 */
export const GameStateSchema = z.object({
  // Room identification
  roomId: z.string(),
  ownerId: z.string(),
  code: z.string(),

  // Game phase
  phase: z.enum(['SETUP', 'CHARACTER_CREATION', 'GAMEPLAY', 'COMBAT']),

  // World settings
  settings: z
    .object({
      theme: z.string(),
      setting: z.string(),
      tone: z.string(),
      playerCount: z.number(),
      adventureLength: AdventureLengthSchema,
      difficulty: DifficultySchema,
      startingLevel: z.number(),
      attributePointBudget: z.number(),
      language: LanguageSchema.default('en'),
    })
    .nullable(),

  // World description
  worldDescription: z.string(),

  // Players (array of players)
  players: z.array(PlayerSchema),

  // Messages (append-only)
  messages: z.array(MessageSchema),

  // Creatures
  creatures: z.array(CreatureSchema),

  // Map features (placed entities on world map)
  mapFeatures: z.array(MapFeatureSchema).default([]),

  // Entropy system: dynamic world conditions
  worldConditions: z.array(WorldConditionSchema).default([]),
  eventsLog: z.array(RandomEventSchema).default([]),
  currentTurn: z.number().int().min(0).default(0),

  // Combat state (null when not in combat)
  combatState: CombatStateSchema.nullable().default(null),

  // Turn flow control
  waitingForAction: z.boolean().default(false),

  // Timestamps
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type GameState = z.infer<typeof GameStateSchema>;

/**
 * World generation progress tracking schema
 */
export const WorldGenProgressSchema = z.object({
  phase: WorldGenPhase,
  currentPeriod: z.number().int().optional(),
  totalPeriods: z.number().int().optional(),
  error: z.string().nullable().default(null),
  retryCount: z.number().int().default(0),
});

export type WorldGenProgress = z.infer<typeof WorldGenProgressSchema>;

/**
 * Character Creation Phase State (Simplified)
 * Used during SETUP and CHARACTER_CREATION phases
 */
export const CharacterCreationStateSchema = z.object({
  roomId: z.string(),
  ownerId: z.string(),
  code: z.string(),
  settings: z
    .object({
      theme: z.string(),
      setting: z.string(),
      tone: z.string(),
      playerCount: z.number(),
      adventureLength: AdventureLengthSchema,
      difficulty: DifficultySchema,
      startingLevel: z.number().optional(),
      attributePointBudget: z.number().optional(),
      language: LanguageSchema.default('en'),
      historyDepth: z.number().optional(),
      eraCount: z.number().optional(),
      structureDensity: z.number().optional(),
      structureTypes: z.array(z.string()).optional(),
      enableRoads: z.boolean().optional(),
      roadQuality: z.string().optional(),
      terrainComplexity: z.number().optional(),
    })
    .nullable(),
  worldDescription: z.string(),
  worldHistory: z.any().nullable().optional(),
  structures: z.array(z.any()).optional(),
  roads: z.array(z.any()).optional(),
  worldConditions: z.array(WorldConditionSchema).optional(),
  eventsLog: z.array(RandomEventSchema).optional(),
  players: z.array(PlayerSchema),
  messages: z.array(MessageSchema),
  createdAt: z.number(),
  updatedAt: z.number(),

  // NEW: Incremental progress tracking
  worldGenProgress: WorldGenProgressSchema.optional(),

  // NEW: Incremental history (grows period by period)
  historyPeriods: z.array(HistoricalPeriodSchema).default([]),

  // NEW: Stream events channel (LangGraph state channel pattern)
  streamEvents: z.array(StreamEventSchema).default([]),

  // NEW: Grid world system (infinite chunk-based grid)
  gridWorld: z
    .object({
      chunks: z.array(z.any()).default([]), // GridChunk[] (avoiding circular import)
      coreAreaGenerated: z.boolean().default(false),
      coreAreaSize: z.number().int().default(32), // 32x32 chunks = 256x256 tiles = 2048x2048px
    })
    .optional(),
});

export type CharacterCreationState = z.infer<typeof CharacterCreationStateSchema>;

/**
 * Gameplay Phase State (Simplified)
 * Used during GAMEPLAY phase (non-combat)
 */
export const GameplayStateSchema = z.object({
  roomId: z.string(),
  ownerId: z.string(),
  code: z.string(),
  settings: z
    .object({
      theme: z.string(),
      setting: z.string(),
      tone: z.string(),
      playerCount: z.number(),
      adventureLength: AdventureLengthSchema,
      difficulty: DifficultySchema,
      startingLevel: z.number(),
      attributePointBudget: z.number(),
      language: LanguageSchema.default('en'),
    })
    .nullable(),
  worldDescription: z.string(),
  players: z.array(PlayerSchema),
  messages: z.array(MessageSchema),
  creatures: z.array(CreatureSchema),
  waitingForAction: z.boolean().default(false),
  combatState: CombatStateSchema.nullable().default(null),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type GameplayState = z.infer<typeof GameplayStateSchema>;

/**
 * Type guard to check if state has active combat
 */
export function hasActiveCombat(state: GameState | GameplayState): boolean {
  const { combatState } = state;
  return combatState !== null && !combatState.isCombatOver;
}

/**
 * Type guard to check if phase is COMBAT
 */
export function isInCombat(state: GameState): boolean {
  return state.phase === 'COMBAT';
}
