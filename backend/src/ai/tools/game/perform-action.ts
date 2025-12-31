import { z } from 'zod';
import { createDaicerTool, StrapiContext } from '../tool-factory';
import { ActionDispatcher } from '@daicer/engine';

// Define Input Schema
const PerformActionSchema = z.object({
  actorId: z.string().describe('The DocumentID of the entity performing the action'),
  actionId: z.string().describe('The ID of the action to perform (e.g., "sword_attack", "fireball")'),
  targetId: z.string().optional().describe('The DocumentID of the target entity (if applicable)'),
  targetPosition: z
    .object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    })
    .optional()
    .describe('Target coordinates (if targeting a point or area)'),
});

export const performActionTool = (context: StrapiContext) => {
  return createDaicerTool(
    {
      name: 'perform_action',
      description:
        'Perform a game action (Attack, Spell, Skill) using the Deterministic Engine. Returns execution trace and results.',
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
        // We need to map Strapi entities to Engine entities
        // NOTE: This mapping must align with Engine types.
        const state = {
          entities: entities.map((e: any) => ({
            id: e.documentId,
            position: e.position,
            stats: e.stats,
            // ... map other fields as needed by ActionDispatcher
            // For MVP, we pass minimal state required by resolveAttack
          })),
          map: { width: 100, height: 100, voxels: {} }, // Mock map for now or load if needed
        };

        const dispatcher = new ActionDispatcher();

        // 3. Dispatch Action
        // We need to construct the command based on input.
        // For now, let's assume 'attack' intent if actionId matches a weapon/attack.
        // But ActionDispatcher expects specific command types.

        // WAIT: ActionDispatcher.dispatch takes (state, command).
        // Command types: ATTACK, CAST_SPELL etc.
        // We need to infer the command type or pass it in.
        // For simplified tool, let's try to detect or generically pass 'USE_ACTION'.

        // REFACTOR: ActionDispatcher should ideally have a generic 'execute' or we map 'perform_action' -> specific commands.
        // Let's treat this as an 'ATTACK' for the MVP transparency test.

        const command = {
          type: 'ATTACK' as const,
          payload: {
            actorId: input.actorId,
            targetId: input.targetId!, // Force for attack
            weaponId: input.actionId, // e.g. 'shortsword'
          },
          timestamp: Date.now(),
        };

        const result = dispatcher.dispatch(state as any, command);

        // 4. Broadcast Events (The "Pipe")
        // This is where we satisfy the user request.
        if (result.events.length > 0) {
          // We need to broadcast these events to the frontend via socket.
          // @ts-ignore
          const streamManager = require('../../../utils/llm/stream-manager').streamManager;
          streamManager.broadcast(roomDocumentId, 'game:events', { events: result.events });
        }

        return {
          success: result.success,
          message: result.message,
          trace: result.events.find((e) => e.type === 'ATTACK_RESULT')?.payload.trace, // Expose trace directly for LLM
        };
      },
    },
    context
  );
};
