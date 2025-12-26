import { z } from 'zod';
import { SpeedSchema } from '@daicer/shared';

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
});

export const CharacterSheetSchema = z.object({
  id: z.string().optional(),
  documentId: z.string().optional(),
  name: z.string(),
  race: z.string(),
  characterClass: z.string(),
  class: z.any().optional(),
  background: z.string(),
  alignment: z.string(),
  level: z.number(),
  xp: z.number(),
  hp: z.number(),
  maxHp: z.number(),
  temporaryHp: z.number(),
  hitDice: z.object({
    total: z.number(),
    current: z.number(),
  }),
  deathSaves: z.object({
    successes: z.number(),
    failures: z.number(),
  }),
  armorClass: z.number(),
  initiative: z.number(),
  speed: SpeedSchema,
  proficiencyBonus: z.number(),
  inspiration: z.boolean(),
  attributes: z.record(AttributeSchema, z.number()),
  savingThrows: SavingThrowsSchema,
  skills: z.record(z.string(), z.number()),
  skillDetails: z.array(SkillDetailSchema),
  expertises: z.array(z.string()),
  baseAttackBonus: z.number(),
  attacks: z.array(
    z.object({
      name: z.string(),
      bonus: z.string(),
      damageType: z.string(),
    })
  ),
  equipment: z.array(InventoryItemSchema),
  equipmentDescription: z.string().optional(),
  currency: z.object({
    cp: z.number(),
    sp: z.number(),
    ep: z.number(),
    gp: z.number(),
    pp: z.number(),
  }),
  proficienciesAndLanguages: z.string(),
  features: z.string(),
  talents: z.array(TalentSchema),
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
  resourcePools: z.array(ResourcePoolSchema),
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
