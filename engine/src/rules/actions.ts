import { z } from 'zod';

// ============================================================================
// Action Types (Runtime/Engine)
// ============================================================================

export enum ActionType {
  Attack = 'attack',
  CastSpell = 'cast_spell',
  Dash = 'dash',
  Dodge = 'dodge',
  Disengage = 'disengage',
  Hide = 'hide',
  UseItem = 'use_item',
  UseFeature = 'use_feature',
  Reaction = 'reaction',
  Grapple = 'grapple',
}

export const DamageSchema = z.object({
  dice: z.string(),
  bonus: z.number(),
  type: z.string(),
});

export const SaveSchema = z.object({
  stat: z.string(),
  dc: z.number(),
});

// Schemas for the *Intent* (what the user/LLM asks to do)
export const AttackIntentSchema = z.object({
  type: z.literal(ActionType.Attack),
  actionId: z.string(), // ID of the action on the character sheet (e.g., "longsword-attack-1")
  targetId: z.string(), // ID of the target entity
  advantage: z.boolean().optional(),
  disadvantage: z.boolean().optional(),
});

export const CastSpellIntentSchema = z.object({
  type: z.literal(ActionType.CastSpell),
  actionId: z.string(), // ID from structuredActions
  spellId: z.string(), // Reference to Spell Collection
  targetIds: z.array(z.string()).optional(), // For single/multi-target
  targetLocation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(), // For AoE
  level: z.number().optional(), // For upcasting (future proofing)
});

export const UseFeatureIntentSchema = z.object({
  type: z.literal(ActionType.UseFeature),
  featureId: z.string(),
  targetId: z.string().optional(),
});

export const DashIntentSchema = z.object({ type: z.literal(ActionType.Dash) });
export const DisengageIntentSchema = z.object({ type: z.literal(ActionType.Disengage) });
export const DodgeIntentSchema = z.object({ type: z.literal(ActionType.Dodge) });

export const GrappleIntentSchema = z.object({
  type: z.literal(ActionType.Grapple),
  targetId: z.string(),
});

// Update Intent Union
export const ActionIntentSchema = z.discriminatedUnion('type', [
  AttackIntentSchema,
  CastSpellIntentSchema,
  DashIntentSchema,
  DisengageIntentSchema,
  DodgeIntentSchema,
  UseFeatureIntentSchema,
  GrappleIntentSchema,
]);

export type ActionIntent = z.infer<typeof ActionIntentSchema>;

// ============================================================================
// Action Definitions (Character Sheet Storage)
// ============================================================================

// Discriminated types for the "Flattened List" on the Character Sheet
// These replace the generic `ActionSchema`

export const MeleeAttackDefinitionSchema = z.object({
  type: z.literal('melee_attack'),
  id: z.string(),
  name: z.string(),
  description: z.string(),
  toHit: z.number(),
  reach: z.number(),
  properties: z.array(z.string()).default([]), // "finesse", "heavy", "two-handed"
  damage: z.array(DamageSchema),
});

export const RangedAttackDefinitionSchema = z.object({
  type: z.literal('ranged_attack'),
  id: z.string(),
  name: z.string(),
  description: z.string(),
  toHit: z.number(),
  range: z.object({ normal: z.number(), long: z.number() }),
  damage: z.array(DamageSchema),
  ammoType: z.string().optional(),
});

export const SpellDefinitionSchema = z.object({
  type: z.literal('spell'),
  id: z.string(), // ID of this prepared instance
  spellId: z.string(), // Link to Spell Collection
  name: z.string(),
  level: z.number(),
  school: z.string(),
  castingTime: z.string(),
  range: z.string(),
  components: z.array(z.string()),
  duration: z.string(),
  concentration: z.boolean(),
  save: z.object({ stat: z.string(), dc: z.number() }).optional(),
  description: z.string(),
});

export const FeatureDefinitionSchema = z.object({
  type: z.literal('feature'),
  id: z.string(),
  name: z.string(),
  source: z.string(), // "Race: Halfling", "Class: Rogue"
  uses: z
    .object({
      current: z.number(),
      max: z.number(),
      reset: z.enum(['short', 'long', 'dawn']),
    })
    .optional(),
  description: z.string(),
});

// ... existing schemas ...

export const ReactionTriggerSchema = z.object({
  condition: z.enum(['on_hit', 'on_damage', 'on_cast', 'on_move', 'custom']),
  description: z.string(),
});

export const ReactionDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.literal('reaction'),
  description: z.string(),
  trigger: ReactionTriggerSchema,
  cost: z.literal('reaction').default('reaction'),
  damage: z.array(DamageSchema).optional(),
  save: SaveSchema.optional(),
});

// Update the Union
export const ActionDefinitionSchema = z.discriminatedUnion('type', [
  MeleeAttackDefinitionSchema,
  RangedAttackDefinitionSchema,
  SpellDefinitionSchema,
  FeatureDefinitionSchema,
  ReactionDefinitionSchema, // New
]);

export type ActionDefinition = z.infer<typeof ActionDefinitionSchema>;
