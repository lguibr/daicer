/**
 * D&D 5e SRD reference tools for LLM
 * Provides lookup functions for game mechanics, equipment, conditions, etc.
 */

import { DynamicStructuredTool } from 'langchain';
import { z } from 'zod';
import {
  getSkills,
  getConditions,
  getEquipment,
  getDamageTypes,
  getAlignments,
  getLanguages,
  getMagicSchools,
  getWeaponProperties,
} from './game-data.js';
// import { logger } from '@/utils/logger';

/**
 * Skill lookup tool
 */
export const lookupSkillTool = new DynamicStructuredTool({
  name: 'lookup_skill',
  description:
    'Look up D&D 5e skill information including description and associated ability score. Use this to understand what skills do and which ability score they use.',
  schema: z.object({
    skillName: z.string().describe('Name of the skill (e.g., "Acrobatics", "Stealth", "Perception")'),
  }),
  func: async ({ skillName }: { skillName: string }) => {
    const skills = await getSkills();
    const skill = skills.find(
      (s) => s.name.toLowerCase() === skillName.toLowerCase() || s.index === skillName.toLowerCase()
    );

    if (!skill) {
      return JSON.stringify({
        found: false,
        message: `Skill "${skillName}" not found. Available skills include: Acrobatics, Animal Handling, Arcana, Athletics, Deception, History, Insight, Intimidation, Investigation, Medicine, Nature, Perception, Performance, Persuasion, Religion, Sleight of Hand, Stealth, Survival`,
      });
    }

    return JSON.stringify({
      found: true,
      name: skill.name,
      abilityScore: skill.abilityScore,
      description: skill.description,
    });
  },
});

/**
 * Condition lookup tool
 */
export const lookupConditionTool = new DynamicStructuredTool({
  name: 'lookup_condition',
  description:
    'Look up D&D 5e condition effects (Blinded, Charmed, Exhaustion, etc.). Use this to understand what conditions do to characters.',
  schema: z.object({
    conditionName: z.string().describe('Name of the condition (e.g., "Blinded", "Poisoned", "Exhaustion")'),
  }),
  func: async ({ conditionName }: { conditionName: string }) => {
    const conditions = await getConditions();
    const condition = conditions.find(
      (c) => c.name.toLowerCase() === conditionName.toLowerCase() || c.index === conditionName.toLowerCase()
    );

    if (!condition) {
      const available = conditions.map((c) => c.name).join(', ');
      return JSON.stringify({
        found: false,
        message: `Condition "${conditionName}" not found. Available conditions: ${available}`,
      });
    }

    return JSON.stringify({
      found: true,
      name: condition.name,
      description: condition.description,
    });
  },
});

/**
 * Equipment lookup tool
 */
export const lookupEquipmentTool = new DynamicStructuredTool({
  name: 'lookup_equipment',
  description:
    'Look up D&D 5e equipment details including cost, weight, and properties. Use this to find information about weapons, armor, and items.',
  schema: z.object({
    equipmentName: z.string().describe('Name of the equipment (e.g., "Longsword", "Chain Mail", "Rope")'),
  }),
  func: async ({ equipmentName }: { equipmentName: string }) => {
    const equipmentItems = await getEquipment();
    const equipment = equipmentItems.find(
      (e) => e.name.toLowerCase() === equipmentName.toLowerCase() || e.index === equipmentName.toLowerCase()
    );

    if (!equipment) {
      return JSON.stringify({
        found: false,
        message: `Equipment "${equipmentName}" not found. Try searching for specific weapon, armor, or item names.`,
      });
    }

    const result: Record<string, unknown> = {
      found: true,
      name: equipment.name,
      description: equipment.description || 'No description available',
    };

    if (equipment.cost) {
      result.cost = `${equipment.cost.quantity} ${equipment.cost.unit}`;
    }

    if (equipment.weight !== undefined) {
      result.weight = `${equipment.weight} lb`;
    }

    if (equipment.armorClass) {
      result.armorClass = equipment.armorClass;
    }

    if (equipment.damage) {
      result.damage = equipment.damage;
    }

    if (equipment.range) {
      result.range = equipment.range;
    }

    if (equipment.properties && equipment.properties.length > 0) {
      result.properties = equipment.properties;
    }

    return JSON.stringify(result);
  },
});

/**
 * Damage type lookup tool
 */
export const lookupDamageTypeTool = new DynamicStructuredTool({
  name: 'lookup_damage_type',
  description:
    'Look up D&D 5e damage type descriptions (Acid, Fire, Slashing, etc.). Use this to understand different types of damage.',
  schema: z.object({
    damageType: z.string().describe('Type of damage (e.g., "Fire", "Slashing", "Necrotic")'),
  }),
  func: async ({ damageType }: { damageType: string }) => {
    const damageTypes = await getDamageTypes();
    const damage = damageTypes.find(
      (d) => d.name.toLowerCase() === damageType.toLowerCase() || d.index === damageType.toLowerCase()
    );

    if (!damage) {
      const available = damageTypes.map((d) => d.name).join(', ');
      return JSON.stringify({
        found: false,
        message: `Damage type "${damageType}" not found. Available types: ${available}`,
      });
    }

    return JSON.stringify({
      found: true,
      name: damage.name,
      description: damage.description,
    });
  },
});

/**
 * Alignment lookup tool
 */
export const lookupAlignmentTool = new DynamicStructuredTool({
  name: 'lookup_alignment',
  description:
    'Look up D&D 5e alignment descriptions (Lawful Good, Chaotic Evil, etc.). Use this to understand what alignments mean.',
  schema: z.object({
    alignment: z.string().describe('Alignment name (e.g., "Lawful Good", "Chaotic Neutral")'),
  }),
  func: async ({ alignment }: { alignment: string }) => {
    const alignments = await getAlignments();
    const align = alignments.find(
      (a) => a.name.toLowerCase() === alignment.toLowerCase() || a.id === alignment.toLowerCase()
    );

    if (!align) {
      const available = alignments.map((a) => a.name).join(', ');
      return JSON.stringify({
        found: false,
        message: `Alignment "${alignment}" not found. Available alignments: ${available}`,
      });
    }

    return JSON.stringify({
      found: true,
      name: align.name,
      abbreviation: align.abbreviation,
      description: align.description,
    });
  },
});

/**
 * Language lookup tool
 */
export const lookupLanguageTool = new DynamicStructuredTool({
  name: 'lookup_language',
  description: 'Look up D&D 5e language information. Use this to check if a language exists and if it is rare.',
  schema: z.object({
    language: z.string().describe('Language name (e.g., "Common", "Elvish", "Draconic")'),
  }),
  func: async ({ language }: { language: string }) => {
    const languages = await getLanguages();
    const lang = languages.find(
      (l) => l.name.toLowerCase() === language.toLowerCase() || l.index === language.toLowerCase()
    );

    if (!lang) {
      const available = languages.map((l) => l.name).join(', ');
      return JSON.stringify({
        found: false,
        message: `Language "${language}" not found. Available languages: ${available}`,
      });
    }

    return JSON.stringify({
      found: true,
      name: lang.name,
      isRare: lang.isRare,
      note: lang.note || 'No additional notes',
    });
  },
});

/**
 * Magic school lookup tool
 */
export const lookupMagicSchoolTool = new DynamicStructuredTool({
  name: 'lookup_magic_school',
  description:
    'Look up D&D 5e school of magic descriptions (Evocation, Abjuration, etc.). Use this to understand magic schools.',
  schema: z.object({
    school: z.string().describe('Magic school name (e.g., "Evocation", "Necromancy", "Illusion")'),
  }),
  func: async ({ school }: { school: string }) => {
    const magicSchools = await getMagicSchools();
    const magicSchool = magicSchools.find(
      (s) => s.name.toLowerCase() === school.toLowerCase() || s.index === school.toLowerCase()
    );

    if (!magicSchool) {
      const available = magicSchools.map((s) => s.name).join(', ');
      return JSON.stringify({
        found: false,
        message: `Magic school "${school}" not found. Available schools: ${available}`,
      });
    }

    return JSON.stringify({
      found: true,
      name: magicSchool.name,
      description: magicSchool.description,
    });
  },
});

/**
 * Weapon property lookup tool
 */
export const lookupWeaponPropertyTool = new DynamicStructuredTool({
  name: 'lookup_weapon_property',
  description:
    'Look up D&D 5e weapon property descriptions (Finesse, Heavy, Reach, etc.). Use this to understand weapon mechanics.',
  schema: z.object({
    property: z.string().describe('Weapon property name (e.g., "Finesse", "Heavy", "Versatile")'),
  }),
  func: async ({ property }: { property: string }) => {
    const weaponProperties = await getWeaponProperties();
    const prop = weaponProperties.find(
      (p) => p.name.toLowerCase() === property.toLowerCase() || p.index === property.toLowerCase()
    );

    if (!prop) {
      const available = weaponProperties.map((p) => p.name).join(', ');
      return JSON.stringify({
        found: false,
        message: `Weapon property "${property}" not found. Available properties: ${available}`,
      });
    }

    return JSON.stringify({
      found: true,
      name: prop.name,
      description: prop.description,
    });
  },
});

/**
 * Get all SRD lookup tools
 * @returns Array of SRD reference tools
 */
export function getSRDTools() {
  return [
    lookupSkillTool,
    lookupConditionTool,
    lookupEquipmentTool,
    lookupDamageTypeTool,
    lookupAlignmentTool,
    lookupLanguageTool,
    lookupMagicSchoolTool,
    lookupWeaponPropertyTool,
  ];
}
