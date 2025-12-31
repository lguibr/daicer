import { z } from 'zod';
import { SpeedSchema } from '@daicer/shared';
// Import the strict definitions
import { ActionDefinitionSchema } from '../rules/actions';

export const AttributeSchema = z.enum(['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma']);

export const SavingThrowsSchema = z.object({
  fortitude: z.number(),
  reflex: z.number(),
  will: z.number(),
});

export const SkillDetailSchema = z.object({
  name: z.string(),
  ability: AttributeSchema,
  modifier: z.number(),
  proficiency: z.enum(['none', 'trained', 'proficient', 'expertise']),
  notes: z.string().optional(),
});

export const TalentSchema = z.object({
  name: z.string(),
  category: z.enum(['class', 'racial', 'background', 'custom']),
  description: z.string(),
});

export const BackgroundDetailsSchema = z.object({
  origin: z.string(),
  upbringing: z.string(),
  motivation: z.string(),
  keyEvents: z.array(z.string()),
  allies: z.array(z.string()).optional(),
});

export const ResourcePoolSchema = z.object({
  name: z.string(),
  current: z.number(),
  max: z.number(),
  refresh: z.enum(['at-will', 'encounter', 'short-rest', 'long-rest', 'daily', 'custom']),
  description: z.string().optional(),
});

export const AdvancementPointsSchema = z.object({
  ability: z.number(),
  skill: z.number(),
  talent: z.number(),
});

export const InventoryItemSchema = z.object({
  id: z.string().optional(),
  item: z.string(),
  quantity: z.number(),
  slot: z.string(),
  isEquipped: z.boolean(),
  // Added for rules consolidation
  properties: z.array(z.string()).optional(),
  weight: z.number().optional(),
  cost: z.object({ amount: z.number(), unit: z.string() }).optional(),
});

export const FeatureSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  usage: z
    .object({
      max: z.number(),
      current: z.number().optional(), // Added current state
      per: z.string(),
    })
    .optional(),
});

// New Structured Spell Slots
export const SpellSlotsSchema = z.array(
  z.object({
    level: z.number(),
    max: z.number(),
    current: z.number(),
  })
);

// Conditions
export const ConditionSchema = z.object({
  name: z.string(), // e.g. "Stunned", "Prone"
  duration: z.number(), // in Rounds
  source: z.string().optional(),
});

export const SpellbookSchema = z.object({
  id: z.string().optional(),
  knownSpells: z.array(z.string()).optional(), // List of Spell Document IDs
  preparedSpells: z.array(z.string()).optional(), // List of Spell Document IDs
  spellcastingAbility: z.enum(['intelligence', 'wisdom', 'charisma']).or(z.string()),
  spellSaveDc: z.number(),
  spellAttackBonus: z.number(),
  slots: SpellSlotsSchema,
});

export const CharacterSheetSchema = z.object({
  id: z.string().optional(),
  documentId: z.string().optional(),
  name: z.string(),
  race: z.string(),
  characterClass: z.string(), // e.g. "Wizard 5"

  // Core Vitals
  hp: z.number(),
  maxHp: z.number(),
  temporaryHp: z.number().default(0),

  // Progression
  level: z.number(),
  xp: z.number(),

  // Resources
  hitDice: z.object({
    total: z.number(),
    current: z.number(),
    die: z.string(), // "1d6"
  }),

  deathSaves: z.object({
    successes: z.number(),
    failures: z.number(),
  }),

  // Combat Stats
  armorClass: z.number(),
  initiative: z.number(),
  speed: SpeedSchema,
  proficiencyBonus: z.number(),
  inspiration: z.boolean(),

  // Attributes & Skills
  attributes: z.record(AttributeSchema, z.number()),
  savingThrows: SavingThrowsSchema,
  skills: z.record(z.string(), z.number()),
  skillDetails: z.array(SkillDetailSchema),
  expertises: z.array(z.string()),

  // Equipment & Inventory
  equipment: z.array(InventoryItemSchema),
  currency: z.object({
    cp: z.number(),
    sp: z.number(),
    ep: z.number(),
    gp: z.number(),
    pp: z.number(),
  }),

  // Actions & Capabilities (The "Flattened List")
  structuredActions: z.array(ActionDefinitionSchema).default([]),

  // Spellcasting
  spellbook: SpellbookSchema.optional(),

  // Lists (Legacy/Migration support combined with new)
  features: z.array(FeatureSchema).default([]),
  talents: z.array(TalentSchema).default([]),

  // State Tracking
  conditions: z.array(ConditionSchema).default([]),
  resources: z.array(ResourcePoolSchema).default([]),

  // Flavor / Blueprint Data
  class: z.any().optional(), // Reference object
  background: z.string(),
  alignment: z.string(),
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
  backgroundDetails: BackgroundDetailsSchema,
  alliesAndOrganizations: z.string(),
  treasure: z.string(),
  advancementPoints: AdvancementPointsSchema,
  avatarAssets: z
    .object({
      id: z.string(),
      mimeType: z.string(),
      storagePath: z.string(),
      publicUrl: z.string(),
      prompt: z.string(),
      createdAt: z.string(),
    })
    .nullable()
    .optional(),
});
