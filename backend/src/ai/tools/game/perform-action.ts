import { z } from 'zod';
import { createDaicerTool, StrapiContext } from '../tool-factory';
import { ActionDispatcher } from '@daicer/engine';

// Define Input Schema
const PerformActionSchema = z.object({
  commandType: z.enum(['ATTACK', 'SKILL_CHECK', 'CAST_SPELL', 'INTERACT', 'LONG_REST', 'MODIFY_TERRAIN']),
  payload: z
    .record(z.string(), z.unknown())
    .describe('The payload matching the specific command schema in @daicer/engine'),
});

export const performActionTool = (context: StrapiContext) => {
  return createDaicerTool(
    {
      name: 'perform_action',
      description:
        'Dispatch a deterministic engine command. Types: ATTACK, SKILL_CHECK, CAST_SPELL, INTERACT, LONG_REST, MODIFY_TERRAIN. Payload must match engine schema.',
      schema: PerformActionSchema,
      func: async (input, ctx) => {
        const { strapi, roomDocumentId } = ctx;

        // 1. Load Room State
        const room = await strapi.documents('api::room.room').findOne({
          documentId: roomDocumentId,
          populate: ['character_sheets'],
        });

        if (!room) throw new Error(`Room ${roomDocumentId} not found`);

        const entities = room.character_sheets || [];

        // 2. Initialize Dispatcher with Room State
        const state = {
          entities: entities.map((e: Record<string, unknown>) => ({
            id: e.documentId,
            position: e.position,
            stats: e.stats,
            type: e.type, // Ensure type is passed
            hp: e.hp,
            maxHp: e.maxHp,
            sheet: e, // Pass full sheet as legacy/adapter
          })),
          map: { width: 100, height: 100, voxels: {} },
        };

        const dispatcher = new ActionDispatcher();

        // 3. Construct Command
        const command = {
          type: input.commandType,
          payload: input.payload,
          timestamp: Date.now(),
        };

        // 4. Dispatch
        // @ts-expect-error Legacy engine parity
        const result = dispatcher.dispatch(state, command);

        // 5. Broadcast Events
        if (result.events.length > 0) {
          const { streamManager } = await import('../../../utils/llm/stream-manager');
          streamManager.broadcast(roomDocumentId, 'game:events', { events: result.events });
        }

        return {
          success: result.success,
          message: result.message,
          trace: result.events.find((e) => e.type === 'ATTACK_RESULT' || e.type === 'SKILL_CHECK_RESULT')?.payload,
        };
      },
    },
    context
  );
};
