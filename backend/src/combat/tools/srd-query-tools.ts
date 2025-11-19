/**
 * SRD Data Query Tools
 *
 * Read-only tools for agents to query D&D 5e SRD data from Firestore.
 * Covers: races, classes, spells, monsters, equipment, conditions, etc.
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import {
  getRaces,
  getRace,
  getClasses,
  getClass,
  getMonsters,
  getMonster,
  getConditions,
  getCondition,
  getAbilities,
  getSkills,
  // getDamageTypes, // TODO: Implement tool for these
  getEquipment,
  // getMagicItems, // TODO: Implement tool for these
  // getFeatures, // TODO: Implement tool for these
  // getTraits, // TODO: Implement tool for these
} from '@/services/game-data';
import { logger } from '@/utils/logger';

/**
 * Tool: Query Races
 */
export const queryRacesTool = tool(
  async ({ raceId }) => {
    try {
      if (raceId) {
        const race = await getRace(raceId);
        if (!race) {
          return JSON.stringify({
            success: false,
            message: `Race not found: ${raceId}`,
          });
        }
        return JSON.stringify({
          success: true,
          data: race,
        });
      }

      const races = await getRaces();
      return JSON.stringify({
        success: true,
        count: races.length,
        data: races.map((r) => ({ id: r.id, name: r.name, size: r.size, speed: r.speed })),
      });
    } catch (error) {
      logger.error('[QueryRaces] Failed', { error });
      return JSON.stringify({
        success: false,
        message: `Query failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }
  },
  {
    name: 'query_races',
    description: 'Query D&D 5e races. Pass raceId for details, or omit for list of all races.',
    schema: z.object({
      raceId: z.string().optional().describe('Specific race ID (e.g., "elf", "dwarf"). Omit to list all races.'),
    }),
  }
);

/**
 * Tool: Query Classes
 */
export const queryClassesTool = tool(
  async ({ classId }) => {
    try {
      if (classId) {
        const classData = await getClass(classId);
        if (!classData) {
          return JSON.stringify({
            success: false,
            message: `Class not found: ${classId}`,
          });
        }
        return JSON.stringify({
          success: true,
          data: classData,
        });
      }

      const classes = await getClasses();
      return JSON.stringify({
        success: true,
        count: classes.length,
        data: classes.map((c) => ({ id: c.id, name: c.name, hitDie: c.hitDie })),
      });
    } catch (error) {
      logger.error('[QueryClasses] Failed', { error });
      return JSON.stringify({
        success: false,
        message: `Query failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }
  },
  {
    name: 'query_classes',
    description: 'Query D&D 5e character classes. Pass classId for details, or omit for list.',
    schema: z.object({
      classId: z
        .string()
        .optional()
        .describe('Specific class ID (e.g., "fighter", "wizard"). Omit to list all classes.'),
    }),
  }
);

/**
 * Tool: Query Spells
 */
export const querySpellsTool = tool(
  async () =>
    // TODO: Implement getSpells/getSpell in game-data service
    JSON.stringify({
      success: false,
      message: 'Spell queries not yet implemented. Use the /spells API endpoint instead.',
    }),
  {
    name: 'query_spells',
    description: 'Query D&D 5e spells with optional filters. Get spell details or filtered list.',
    schema: z.object({
      spellId: z.string().optional().describe('Specific spell ID. Omit to list spells.'),
      level: z.number().min(0).max(9).optional().describe('Filter by spell level (0=cantrip, 1-9=spell levels)'),
      school: z.string().optional().describe('Filter by magic school (e.g., "evocation", "abjuration")'),
      className: z.string().optional().describe('Filter by class (e.g., "wizard", "cleric")'),
    }),
  }
);

/**
 * Tool: Query Monsters
 */
export const queryMonstersTool = tool(
  async ({ monsterId, challengeRating }) => {
    try {
      if (monsterId) {
        const monster = await getMonster(monsterId);
        if (!monster) {
          return JSON.stringify({
            success: false,
            message: `Monster not found: ${monsterId}`,
          });
        }
        return JSON.stringify({
          success: true,
          data: monster,
        });
      }

      let monsters = await getMonsters();

      if (challengeRating !== undefined) {
        monsters = monsters.filter((m) => {
          // Parse challenge rating from string (e.g., "1/2" or "5")
          let crValue: number;
          if (m.challenge === '1/2') {
            crValue = 0.5;
          } else if (m.challenge === '1/4') {
            crValue = 0.25;
          } else {
            crValue = parseFloat(m.challenge);
          }
          return crValue === challengeRating;
        });
      }

      return JSON.stringify({
        success: true,
        count: monsters.length,
        data: monsters.map((m) => ({
          id: m.id,
          name: m.name,
          size: m.size,
          type: m.type,
          challenge: m.challenge,
          armorClass: m.armorClass,
          hitPoints: m.hitPoints,
        })),
      });
    } catch (error) {
      logger.error('[QueryMonsters] Failed', { error });
      return JSON.stringify({
        success: false,
        message: `Query failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }
  },
  {
    name: 'query_monsters',
    description: 'Query D&D 5e monsters. Pass monsterId for details, or filter by CR.',
    schema: z.object({
      monsterId: z.string().optional().describe('Specific monster ID. Omit to list monsters.'),
      challengeRating: z.number().optional().describe('Filter by challenge rating (e.g., 1, 5, 20)'),
    }),
  }
);

/**
 * Tool: Query Conditions
 */
export const queryConditionsTool = tool(
  async ({ conditionId }) => {
    try {
      if (conditionId) {
        const condition = await getCondition(conditionId);
        if (!condition) {
          return JSON.stringify({
            success: false,
            message: `Condition not found: ${conditionId}`,
          });
        }
        return JSON.stringify({
          success: true,
          data: condition,
        });
      }

      const conditions = await getConditions();
      return JSON.stringify({
        success: true,
        count: conditions.length,
        data: conditions.map((c) => ({ id: c.id, name: c.name, description: c.description?.slice(0, 100) })),
      });
    } catch (error) {
      logger.error('[QueryConditions] Failed', { error });
      return JSON.stringify({
        success: false,
        message: `Query failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }
  },
  {
    name: 'query_conditions',
    description: 'Query D&D 5e conditions (e.g., blinded, charmed, poisoned). Pass conditionId for details.',
    schema: z.object({
      conditionId: z
        .string()
        .optional()
        .describe('Specific condition ID (e.g., "blinded", "poisoned"). Omit to list all.'),
    }),
  }
);

/**
 * Tool: Query Abilities
 */
export const queryAbilitiesTool = tool(
  async () => {
    try {
      const abilities = await getAbilities();
      return JSON.stringify({
        success: true,
        count: abilities.length,
        data: abilities,
      });
    } catch (error) {
      logger.error('[QueryAbilities] Failed', { error });
      return JSON.stringify({
        success: false,
        message: `Query failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }
  },
  {
    name: 'query_abilities',
    description: 'Get all six D&D 5e ability scores (STR, DEX, CON, INT, WIS, CHA) with descriptions.',
    schema: z.object({}),
  }
);

/**
 * Tool: Query Skills
 */
export const querySkillsTool = tool(
  async () => {
    try {
      const skills = await getSkills();
      return JSON.stringify({
        success: true,
        count: skills.length,
        data: skills,
      });
    } catch (error) {
      logger.error('[QuerySkills] Failed', { error });
      return JSON.stringify({
        success: false,
        message: `Query failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }
  },
  {
    name: 'query_skills',
    description: 'Get all D&D 5e skills (e.g., Acrobatics, Perception, Stealth) with their linked abilities.',
    schema: z.object({}),
  }
);

/**
 * Tool: Query Equipment
 */
export const queryEquipmentTool = tool(
  async ({ equipmentId, category }) => {
    try {
      let equipment = await getEquipment();

      if (category) {
        equipment = equipment.filter((e) => e.equipmentCategory === category);
      }

      if (equipmentId) {
        const item = equipment.find((e) => e.id === equipmentId);
        if (!item) {
          return JSON.stringify({
            success: false,
            message: `Equipment not found: ${equipmentId}`,
          });
        }
        return JSON.stringify({
          success: true,
          data: item,
        });
      }

      return JSON.stringify({
        success: true,
        count: equipment.length,
        data: equipment.map((e) => ({
          id: e.id,
          name: e.name,
          category: e.equipmentCategory,
          cost: e.cost,
        })),
      });
    } catch (error) {
      logger.error('[QueryEquipment] Failed', { error });
      return JSON.stringify({
        success: false,
        message: `Query failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }
  },
  {
    name: 'query_equipment',
    description: 'Query D&D 5e equipment (weapons, armor, tools, etc.). Filter by category or get specific item.',
    schema: z.object({
      equipmentId: z.string().optional().describe('Specific equipment ID. Omit to list items.'),
      category: z.string().optional().describe('Filter by category (e.g., "Weapon", "Armor", "Adventuring Gear")'),
    }),
  }
);
