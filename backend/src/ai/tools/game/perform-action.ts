import { z } from 'zod';
import { createDaicerTool, StrapiContext } from '../tool-factory';
import { ActionDispatcher, GameState, Entity } from '@daicer/engine';
import { RoomWithPopulations } from '../../../lifecycle/socket/types';

// Define Input Schema
const PerformActionSchema = z.object({
  commandType: z.enum(['ATTACK', 'SKILL_CHECK', 'CAST_SPELL', 'INTERACT', 'LONG_REST', 'MODIFY_TERRAIN']),
  payload: z
    .string()
    .describe(
      'JSON string payload matching the specific command schema in @daicer/engine. Example: "{"targetId": "..."}"'
    ),
});

export const performActionTool = (context: StrapiContext) => {
  return createDaicerTool(
    {
      name: 'perform_action',
      description:
        'Dispatch a deterministic engine command. Types: ATTACK, SKILL_CHECK, CAST_SPELL, INTERACT, LONG_REST, MODIFY_TERRAIN. Payload must match engine schema.',
      schema: PerformActionSchema,
      func: async (input, ctx) => {
        try {
          const { strapi, roomDocumentId } = ctx;

          // 1. Load Room State
          const roomRaw = await strapi.documents('api::room.room').findOne({
            documentId: roomDocumentId,
            populate: ['character_sheets'],
          });

          if (!roomRaw) throw new Error(`Room ${roomDocumentId} not found`);

          const room = roomRaw as unknown as RoomWithPopulations;
          const entities = room.character_sheets || [];

          // 2. Initialize Dispatcher with Room State
          const state = {
            entities: entities.map(
              (e): Entity => ({
                id: e.documentId,
                position: e.position,
                stats: e.stats as any, // TODO: Define strict stats
                type: e.type as 'player' | 'npc' | 'monster' | 'object',
                name: e.name,
                hp: e.currentHp,
                maxHp: e.maxHp,
                ac: 10,
                speed: 30,
                actions: [],
                features: [],
                color: '#fff',
                visionRadius: 10,
                sheet: e as any,
              })
            ),
            map: { width: 100, height: 100, voxels: {} },
          } as unknown as GameState;

          const dispatcher = new ActionDispatcher();

          // 3. Construct Command
          let parsedPayload = {};
          try {
            parsedPayload = typeof input.payload === 'string' ? JSON.parse(input.payload) : input.payload;
          } catch (e) {
            throw new Error(`Invalid JSON payload: ${e instanceof Error ? e.message : String(e)}`);
          }

          // Debug available entities
          strapi.log.info(
            `[Tool:PerformAction] Room Entities: ${state.entities.map((e) => `${e.id} (${e.type})`).join(', ')}`
          );
          strapi.log.info(`[Tool:PerformAction] Target ActorId: ${(parsedPayload as { actorId?: string }).actorId}`);

          const command = {
            type: input.commandType,
            payload: parsedPayload,
            timestamp: Date.now(),
          };

          // 4. Dispatch
          strapi.log.info(`[Tool:PerformAction] Dispatching ${input.commandType}`, parsedPayload);

          const result = dispatcher.dispatch(state, command);

          // 5. Broadcast Events
          if (result.events.length > 0) {
            const { streamManager } = await import('../../../utils/llm/stream-manager');
            streamManager.broadcast(roomDocumentId, 'game:events', { events: result.events });
          }

          if (!result.success) {
            strapi.log.warn(`[Tool:PerformAction] Engine Rejected: ${result.message}`);
          }

          return {
            success: result.success,
            message: result.message,
            trace: result.events.find((e) => e.type === 'ATTACK_RESULT' || e.type === 'SKILL_CHECK_RESULT')?.payload,
          };
        } catch (error) {
          strapi.log.error(`[Tool:PerformAction] Engine Exception:`, error);
          return {
            success: false,
            message: `Engine Crash: ${error instanceof Error ? error.message : String(error)}`,
          };
        }
      },
    },
    context
  );
};
