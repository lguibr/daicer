import * as z from 'zod';

export const StartCombatSchema = z.object({
  playerIds: z.array(z.string()).describe('Array of player IDs to include in combat'),
  enemyNames: z.array(z.string()).describe('Array of enemy/creature names to include in combat'),
});

export const AttackSchema = z.object({
  attackerName: z.string().describe('Name of the attacking character'),
  targetName: z.string().describe('Name of the target character'),
  weaponDamage: z.string().optional().describe('Weapon damage dice notation (e.g., "1d8", "2d6")'),
  damageType: z.string().optional().describe('Type of damage (e.g., "slashing", "piercing", "bludgeoning")'),
});

export const MoveSchema = z.object({
  characterName: z.string().describe('Name of the character to move'),
  targetX: z.number().int().min(0).max(9).describe('Target X coordinate (0-9)'),
  targetY: z.number().int().min(0).max(9).describe('Target Y coordinate (0-9)'),
});

export const EndTurnSchema = z.object({
  confirm: z.boolean().describe('Confirm ending the current turn'),
});

export const EndCombatSchema = z.object({
  reason: z.string().describe('Reason for ending combat (e.g., "enemies defeated", "players fled")'),
});

export const GridPositionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
});

export const SpellTargetSchema = z.object({
  type: z.enum(['point', 'direction']).optional(),
  x: z.number().int().min(0).optional(),
  y: z.number().int().min(0).optional(),
  direction: z.number().int().min(1).max(9).optional(),
});

export const SpellScenarioSchema = z.object({
  obstacles: z.array(GridPositionSchema).optional(),
  gridWidth: z.number().int().min(5).max(60).optional(),
  gridHeight: z.number().int().min(5).max(60).optional(),
});

export const SpellPreviewSchema = z.object({
  casterName: z.string(),
  spellId: z.string(),
  target: SpellTargetSchema.optional(),
  scenario: SpellScenarioSchema.optional(),
});

export const SpellCastSchema = SpellPreviewSchema.extend({
  confirmFriendlyFire: z.boolean().default(false),
});
