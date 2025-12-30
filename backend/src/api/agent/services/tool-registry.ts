/**
 * Tool Registry Service
 */

import { ActionDispatcher } from '@daicer/engine';

/*
  This service maps string tool names to actual logic.
  It acts as the "Standard Library" for the Agent.
*/

type ToolHandler = (roomId: string, payload: any, user: any) => Promise<any>;

export default ({ strapi }) => {
  const tools: Record<string, ToolHandler> = {};

  const register = (name: string, handler: ToolHandler) => {
    tools[name] = handler;
  };

  // --- PILOT TOOLS ---

  // 1. PERFORM_ATTACK
  register('perform_attack', async (roomId, payload, user) => {
    // 1. Get Game State (reuse ActionEngine logic?)
    // Ideally we use ActionEngine as the facade for Dispatcher.
    // Let's call ActionEngine.
    const actionEngine = strapi.service('api::game.action-engine');

    const command = {
      type: 'ATTACK',
      payload: {
        actorId: payload.attackerId,
        targetId: payload.targetId,
        weaponId: payload.actionName,
      },
      timestamp: Date.now(),
    };

    // Dispatch via ActionEngine which handles State/Persistence
    return await actionEngine.dispatch(roomId, [command]);
  });

  // 2. MOVE_ENTITY
  register('move_entity', async (roomId, payload, user) => {
    const actionEngine = strapi.service('api::game.action-engine');

    const command = {
      type: 'MOVE',
      payload: {
        actorId: payload.entityId,
        targetPosition: payload.path[payload.path.length - 1], // Goal
        path: payload.path,
      },
      timestamp: Date.now(),
    };

    return await actionEngine.dispatch(roomId, [command]);
  });

  // 3. SPAWN_ENTITY
  register('spawn_entity', async (roomId, payload, user) => {
    const spawnService = strapi.service('api::game.spawn-service');
    // Schema: blueprintId, type, position
    return await spawnService.spawn(roomId, payload);
  });

  // 4. ROLL_SAVE (Using SKILL_CHECK for now until we expand)
  register('roll_save', async (roomId, payload, user) => {
    const actionEngine = strapi.service('api::game.action-engine');

    // Adapting "Save" to "Skill Check" structure for now, or adding SAVE cmd
    // For Phase 6.4 we added generic check support.
    const command = {
      type: 'SKILL_CHECK',
      payload: {
        actorId: payload.entityId,
        attribute: payload.stat,
        difficultyClass: payload.difficultyClass,
        // We can map 'soak' logic here or in engine.
      },
      timestamp: Date.now(),
    };

    return await actionEngine.dispatch(roomId, [command]);
  });

  return {
    hasTool(name: string) {
      return !!tools[name];
    },
    async execute(name: string, roomId: string, payload: any, user: any) {
      if (!tools[name]) throw new Error(`Tool ${name} not registered`);
      return await tools[name](roomId, payload, user);
    },
  };
};
