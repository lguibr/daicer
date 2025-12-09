/**
 * Creation Tools
 * Tools for generating new game content (Characters, Monsters)
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { generateCharacter, generateMonster } from '@/services/character-generator';
import { logger } from '@/utils/logger';

/**
 * Tool: Create NPC
 * Generates a full character sheet for an NPC based on optional parameters
 */
export const createNpcTool = tool(
  async ({ name, race, class: className, background, level }) => {
    try {
      const character = await generateCharacter({
        name,
        raceId: race,
        classId: className,
        backgroundId: background,
        level: level ?? 1,
      });

      return JSON.stringify({
        success: true,
        data: character,
        message: `Successfully created Level ${character.level} ${character.race} ${character.characterClass} named ${character.name}`,
      });
    } catch (error) {
      logger.error('[CreateNPC] Failed', { error });
      return JSON.stringify({
        success: false,
        message: `Failed to create NPC: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  },
  {
    name: 'create_npc',
    description:
      'Generate a full D&D 5e Character Sheet for an NPC. Can specify race, class, etc. or leave empty for random.',
    schema: z.object({
      name: z.string().optional().describe('Name of the character'),
      race: z.string().optional().describe('Race ID (e.g. "elf", "dwarf", "human")'),
      class: z.string().optional().describe('Class ID (e.g. "fighter", "wizard")'),
      background: z.string().optional().describe('Background ID (e.g. "acolyte", "criminal")'),
      level: z.number().int().min(1).max(20).optional().describe('Character Level (default 1)'),
    }),
  }
);

/**
 * Tool: Create Monster
 * Retrieves or Generates a Monster stat block
 */
export const createMonsterTool = tool(
  async ({ name, cr, type, monsterId }) => {
    try {
      const monster = await generateMonster({
        monsterId,
        name,
        cr,
        type,
      });

      if (!monster) {
        return JSON.stringify({
          success: false,
          message: 'No monster found matching the criteria.',
        });
      }

      return JSON.stringify({
        success: true,
        data: monster,
        message: `Successfully retrieved monster: ${monster.name}`,
      });
    } catch (error) {
      logger.error('[CreateMonster] Failed', { error });
      return JSON.stringify({
        success: false,
        message: `Failed to create/retrieve monster: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  },
  {
    name: 'create_monster',
    description: 'Retrieve a Monster stat block based on name, CR, or type. Useful for spawning enemies.',
    schema: z.object({
      monsterId: z.string().optional().describe('Specific Monster ID if known'),
      name: z.string().optional().describe('Name or partial name of the monster'),
      cr: z.number().optional().describe('Challenge Rating (e.g. 0.25, 1, 5)'),
      type: z.string().optional().describe('Monster type (e.g. "beast", "undead", "dragon")'),
    }),
  }
);
