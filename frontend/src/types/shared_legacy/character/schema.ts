import { z } from 'zod';
import { Attribute } from './types';

const abilityScoreSchema = z.number().int().min(1).max(30);

const skillDetailSchema = z.object({
  name: z.string().min(1),
  ability: z.nativeEnum(Attribute),
  modifier: z.number(),
  proficiency: z.enum(['none', 'trained', 'proficient', 'expertise']),
  notes: z.string().optional(),
});

const talentSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['class', 'racial', 'background', 'custom']),
  description: z.string().min(1),
});

const backgroundDetailsSchema = z.object({
  origin: z.string(),
  upbringing: z.string(),
  motivation: z.string(),
  keyEvents: z.array(z.string()),
  allies: z.array(z.string()).optional(),
});

const resourcePoolSchema = z.object({
  name: z.string().min(1),
  current: z.number().int().min(0),
  max: z.number().int().min(0),
  refresh: z.enum(['at-will', 'encounter', 'short-rest', 'long-rest', 'daily', 'custom']),
  description: z.string().optional(),
});

const advancementPointsSchema = z.object({
  ability: z.number().int().min(0),
  skill: z.number().int().min(0),
  talent: z.number().int().min(0),
});

const assetResponseSchema = z.object({
  id: z.string().min(1),
  mimeType: z.string().min(1),
  storagePath: z.string().min(1),
  publicUrl: z.string().url(),
  prompt: z.string(),
  createdAt: z.string(),
});

const hitDiceSchema = z.object({
  total: z.number().int().min(0),
  current: z.number().int().min(0),
});

const deathSaveSchema = z.object({
  successes: z.number().int().min(0).max(3),
  failures: z.number().int().min(0).max(3),
});

const currencySchema = z.object({
  cp: z.number().int().min(0),
  sp: z.number().int().min(0),
  ep: z.number().int().min(0),
  gp: z.number().int().min(0),
  pp: z.number().int().min(0),
});

const savingThrowsSchema = z.object({
  fortitude: z.number(),
  reflex: z.number(),
  will: z.number(),
});

const spellSlotSchema = z.object({
  level: z.number().int().min(0),
  total: z.number().int().min(0),
  expended: z.number().int().min(0),
});

const characterEquipmentSchema = z.object({
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
});

export const characterSheetSchema = z.object({
  name: z.string().min(1),
  race: z.string().min(1),
  characterClass: z.string().min(1),
  background: z.string().min(1),
  alignment: z.string().min(1),
  level: z.number().int().min(1),
  xp: z.number().int().min(0),
  hp: z.number().int().min(0),
  maxHp: z.number().int().min(0),
  temporaryHp: z.number().int().min(0),
  hitDice: hitDiceSchema,
  deathSaves: deathSaveSchema,
  armorClass: z.number().int().min(0),
  initiative: z.number(),
  speed: z.number().int().min(0),
  proficiencyBonus: z.number().int(),
  inspiration: z.boolean(),
  baseAttackBonus: z.number().int(),
  attributes: z.object({
    Strength: abilityScoreSchema,
    Dexterity: abilityScoreSchema,
    Constitution: abilityScoreSchema,
    Intelligence: abilityScoreSchema,
    Wisdom: abilityScoreSchema,
    Charisma: abilityScoreSchema,
  }),
  savingThrows: savingThrowsSchema,
  skills: z.record(z.string().min(1), z.number()),
  skillDetails: z.array(skillDetailSchema),
  expertises: z.array(z.string().min(1)),
  attacks: z.array(z.object({ name: z.string(), bonus: z.string(), damageType: z.string() })),
  equipment: characterEquipmentSchema,
  currency: currencySchema,
  proficienciesAndLanguages: z.string(),
  features: z.string(),
  talents: z.array(talentSchema),
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
  backgroundDetails: backgroundDetailsSchema,
  alliesAndOrganizations: z.string(),
  treasure: z.string(),
  resourcePools: z.array(resourcePoolSchema),
  advancementPoints: advancementPointsSchema,
  avatarAssets: assetResponseSchema.nullable().optional(),
  spellcasting: z.object({
    class: z.string(),
    ability: z.string(),
    saveDC: z.number().int().min(0),
    attackBonus: z.number(),
    cantrips: z.array(z.string()),
    spellsKnown: z.array(z.string()),
    slots: z.array(spellSlotSchema),
  }),
});

export const characterSheetUpdateSchema = z
  .record(z.string(), z.unknown())
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one character field must be provided' });
