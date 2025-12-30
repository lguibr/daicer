import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const moveSchema = z.object({
  entityId: z.string().describe('The ID of the character/entity to move'),
  x: z.number(),
  y: z.number(),
  z: z.number().default(0),
});

const inspectSchema = z.object({
  x: z.number(),
  y: z.number(),
  radius: z.number().default(5),
});

const mapImageSchema = z.object({
  x: z.number().describe('Center X coordinate'),
  y: z.number().describe('Center Y coordinate'),
  radius: z.number().default(16).describe('View radius'),
});

const perspectiveSchema = z.object({
  entityId: z.string().describe('The ID of the player/character to view from'),
});

export const getRegistryTools = (strapi, roomDocumentId: string, mode: 'game' | 'debug' = 'game') => {
  const tools = [];

  // --- Shared Tools ---

  // Move Entity
  tools.push(
    new DynamicStructuredTool({
      name: 'move_entity',
      description: 'Moves an entity (player/npc) to a new coordinate. Returns success or failure.',
      schema: moveSchema as any,
      func: async ({ entityId, x, y, z }): Promise<string> => {
        const gameEventService = strapi.service('api::game-event.game-event');
        // 1. Get current state to find 'from' position
        const gameState = await gameEventService.getGameState(roomDocumentId); // Use document ID for consistency
        const currentPos = gameState.entities[entityId] || { x: 0, y: 0, z: 0 };

        // 2. Validate
        try {
          // validateMove likely uses documentId internally if service expects it, or handles UUID.
          // Since we are standardizing on documentId, we pass it here.
          // Note: If services expect UUID, check game-event logic.
          // Assuming documents API usage in services prefers documentId.
          const result = await gameEventService.validateMove(roomDocumentId, currentPos, { x, y, z });
          if (result.valid) {
            // 3. Log event
            await gameEventService.logEvent(roomDocumentId, 'MOVE', {
              entityId,
              from: currentPos,
              to: { x, y, z },
            });
            return `Moved ${entityId} to ${x},${y},${z}.`;
          } else {
            return `Failed to move: ${result.reason}`;
          }
        } catch (e) {
          return `Error moving entity: ${e.message}`;
        }
      },
    })
  );

  // Inspect Map (Text Description)
  tools.push(
    new DynamicStructuredTool({
      name: 'inspect_map',
      description: 'Inspects the terrain at a specific location using text description.',
      schema: inspectSchema as any,
      func: async ({ x, y, radius }): Promise<string> => {
        const gameEventService = strapi.service('api::game-event.game-event');
        try {
          const description = await gameEventService.inspectTerrain(roomDocumentId, x, y, radius);
          return description;
        } catch (e) {
          return `Error inspecting map: ${e.message}`;
        }
      },
    })
  );

  // Get Map Image (Visual)
  tools.push(
    new DynamicStructuredTool({
      name: 'get_map_image',
      description:
        'Generates a visual map image (PNG) centered at the coordinates. Useful for showing the map to the user.',
      schema: mapImageSchema as any,
      func: async ({ x, y, radius }): Promise<string> => {
        try {
          // CORRECTED IMPORT PATH
          const { generateMapImage } = await import('../../game/services/map-visualization');

          // Fetch Room Data
          const room = await strapi.documents('api::room.room').findOne({
            documentId: roomDocumentId,
            populate: ['character_sheets', 'creatures'],
          });

          if (!room) return 'Room not found.';

          const chunkX = Math.floor(x / 32);
          const chunkY = Math.floor(y / 32);

          let chunk;
          try {
            const voxelService = strapi.service('api::voxel-engine.voxel-engine');
            if (voxelService && voxelService.getChunk) {
              // Ensure config exists or define defaults
              const config = room.config || { seed: 'default' };
              chunk = await voxelService.getChunk(chunkX, chunkY, config);
            } else {
              return 'Voxel Engine service unavailable.';
            }
          } catch (e) {
            return `Failed to fetch chunk: ${e.message}`;
          }

          if (!chunk) return 'Failed to load map chunk.';

          // Generate Buffer
          const imageBuffer = await generateMapImage(
            chunk,
            room.character_sheets || [], // Assume players mapped to sheets or similar? generateMapImage expects 'Player[]' structure actually...
            // Wait, generateMapImage expects 'Player[]' from 'game.ts'.
            // 'room.character_sheets' might handle data differently.
            // Let's coerce for now or fetch players.
            // Actually 'map-visualization' expects objects with {id, position, name}.
            room.creatures || [],
            new Set(room.exploredTiles || []),
            { x, y }
          );

          const base64 = imageBuffer.toString('base64');

          // Return JSON for narrator to parse
          return JSON.stringify({
            type: 'image',
            base64: base64,
            description: `Map image generated at ${x},${y} with radius ${radius}.`,
          });
        } catch (e) {
          return `Error generating map image: ${e.message}`;
        }
      },
    })
  );

  // Summon Entity
  tools.push(
    new DynamicStructuredTool({
      name: 'summon_entity',
      description: 'Summons a monster or character (NPC) into the world at a specific location.',
      schema: z.object({
        name: z.string().describe('The name of the creature or character to summon (e.g. "Orc", "Goblin")'),
        type: z
          .enum(['monster', 'character'])
          .optional()
          .describe('The type of entity to summon. If omitted, searches both.'),
        x: z.number(),
        y: z.number(),
        z: z.number().default(0),
      }) as any,
      func: async ({ name, type, x, y, z }): Promise<string> => {
        try {
          const spawnService = strapi.service('api::game.spawn-service');
          let monster, character;

          // Sanitize name (remove @ prefix if present)
          const cleanName = name.replace(/^@/, '').trim(); // Remove @ and whitespace

          // 1. Search Logic
          if (!type || type === 'monster') {
            const monsters = await strapi.documents('api::monster.monster').findMany({
              filters: { name: { $contains: cleanName } },
              limit: 1,
            });
            if (monsters.length > 0) monster = monsters[0];
          }

          if (!monster && (!type || type === 'character')) {
            const characters = await strapi.documents('api::character.character').findMany({
              filters: { name: { $contains: cleanName } },
              limit: 1,
            });
            if (characters.length > 0) character = characters[0];
          }

          // 2. Spawn Logic
          if (monster) {
            // Pass roomDocumentId explicitly
            await spawnService.spawnMonster(roomDocumentId, monster.documentId, { x, y, z });
            return `Summoned monster "${monster.name}" at ${x},${y},${z}.`;
          } else if (character) {
            // Pass roomDocumentId explicitly
            await spawnService.spawnCharacter(roomDocumentId, character.documentId, { x, y, z });
            return `Summoned character "${character.name}" at ${x},${y},${z}.`;
          } else {
            return `Could not find any monster or character named "${name}".`;
          }
        } catch (e) {
          return `Error summoning entity: ${e.message}`;
        }
      },
    })
  );

  return tools;
};
