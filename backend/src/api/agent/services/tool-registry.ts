/**
 * Tool Registry Service
 */

import { ActionDispatcher } from '@daicer/engine';

/*
  This service maps string tool names to actual logic.
  It acts as the "Standard Library" for the Agent.
*/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // 5. CAST_SPELL
  register('cast_spell', async (roomId, payload, user) => {
    const actionEngine = strapi.service('api::game.action-engine');
    // Stub implementation as MagicSystem is not fully separated yet
    const command = {
      type: 'CAST_SPELL',
      payload: payload,
      timestamp: Date.now(),
    };
    return await actionEngine.dispatch(roomId, [command]);
  });

  // 6. INTERACT_OBJECT
  register('interact_object', async (roomId, payload, user) => {
    const actionEngine = strapi.service('api::game.action-engine');
    const command = {
      type: 'INTERACT',
      payload: payload,
      timestamp: Date.now(),
    };
    return await actionEngine.dispatch(roomId, [command]);
  });

  // 7. MODIFY_TERRAIN
  register('modify_terrain', async (roomId, payload, user) => {
    const actionEngine = strapi.service('api::game.action-engine');
    // Map modification usually goes to VoxelEngine, but we wrap it in an Event/Command for persistence
    const command = {
      type: 'MODIFY_TERRAIN',
      payload: payload,
      timestamp: Date.now(),
    };
    return await actionEngine.dispatch(roomId, [command]);
  });

  // 8. LONG_REST
  register('long_rest', async (roomId, payload, user) => {
    const actionEngine = strapi.service('api::game.action-engine');
    const command = {
      type: 'LONG_REST',
      payload: payload,
      timestamp: Date.now(),
    };
    return await actionEngine.dispatch(roomId, [command]);
  });

  return {
    hasTool(name: string) {
      return !!tools[name];
    },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    async execute(name: string, roomId: string, payload: any, user: any) {
      if (!tools[name]) throw new Error(`Tool ${name} not registered`);
      return await tools[name](roomId, payload, user);
    },
  };
};
