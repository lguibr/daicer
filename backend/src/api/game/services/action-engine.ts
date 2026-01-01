import { ActionDispatcher, GameState, Command } from '@daicer/engine';

export default ({ strapi }) => ({
  async dispatch(roomId: string, commands: Command[]) {
    const dispatcher = new ActionDispatcher();
    const results = [];

    // 1. Fetch Hydrated State
    // We need a robust way to get GameState. For now, we'll fetch Room + basic relations.
    // In a real ECS loop, we'd cache this or have a state manager.
    const room = await strapi.documents('api::room.room').findOne({
      documentId: roomId,
      populate: [
        'players',
        'players.character',
        'character_sheets',
        'character_sheets.monster',
        'character_sheets.monster.structuredActions',
        'character_sheets.monster.features',
        'character_sheets.character',
        'character_sheets.character.baseStats',
        'character_sheets.position', // Critical for correct entity placement
      ],
    });

    if (!room) throw new Error(`Room ${roomId} not found`);

    // Map Strapi relations to Engine GameState
    // This is a partial mapping for now
    // Adapt Entities
    const entityAdapter = strapi.service('api::game.entity-adapter');
    const unifiedEntities = (room.character_sheets || []).map((s) => entityAdapter.adapt(s));

    const initialState: GameState = {
      room: { id: room.documentId, ...room },
      world: {}, // TODO: Fetch Voxel world if needed for Move checks
      entities: unifiedEntities,
      players: room.players || [],
      settings: room.settings || {},
    };

    // 2. Dispatch Commands
    for (const cmd of commands) {
      try {
        const result = dispatcher.dispatch(initialState, cmd);
        results.push(result);

        if (result.success) {
          // 3. Apply Side Effects / Persistence
          // This is where the "Engine -> DB" sync happens
          await this.persistResult(roomId, result);
        }
      } catch (e) {
        strapi.log.error('Action Dispatch Failed', e);
        results.push({ success: false, message: e.message, events: [] });
      }
    }

    return results;
  },

  async persistResult(roomId: string, result: import('@daicer/engine').ActionResult) {
    // 1. Apply Immediate Updates (Entity Sync)
    for (const event of result.events) {
      if (event.type === 'ENTITY_MOVED') {
        const { entityId, to } = event.payload;
        await strapi.documents('api::entity-sheet.entity-sheet').update({
          documentId: entityId,
          data: { position: to },
        });
      }
      // Add more syncs as needed (HP, etc.)
    }

    // 2. SOTA Persistence: Create TimeFrame (Turn)
    // We treat this execution as a discrete "Turn" or "TimeStep".

    // Find latest turn number
    const lastTurnHandles = await strapi.documents('api::time-frame.time-frame').findMany({
      filters: { room: { documentId: roomId } },
      sort: 'turnNumber:desc',
      limit: 1,
      fields: ['turnNumber'],
    });
    const nextTurnNumber = (lastTurnHandles[0]?.turnNumber || 0) + 1;
    const now = Date.now();

    // 2b. Create Game Event Entities
    const createdEventIds: string[] = [];

    for (const event of result.events) {
      const gEvent = await strapi.documents('api::game-event.game-event').create({
        data: {
          type: event.type,
          payload: event.payload,
          timestamp: now,
          room: roomId,
          turnNumber: nextTurnNumber,
          actorId: event.payload.actorId || event.payload.entityId || null,
        },
        status: 'published',
      });
      createdEventIds.push(gEvent.documentId);
    }

    // Create TimeFrame with State Diff AND Relation linkage
    const timeFrame = await strapi.documents('api::time-frame.time-frame').create({
      data: {
        turnNumber: nextTurnNumber,
        timestamp: new Date().toISOString(),
        room: roomId,
        gameState: { events: result.events }, // Keep JSON for quick client diffs
        events: createdEventIds, // Link to queryable entities
      },
      status: 'published',
    });

    // 3. Create System Message for Log
    const logContent =
      result.events.map((e) => `[${e.type}] ${JSON.stringify(e.payload)}`).join('\n') || 'Action executed.';

    await strapi.documents('api::message.message').create({
      data: {
        content: logContent,
        senderName: 'System',
        senderType: 'system',
        room: roomId,
        turn: timeFrame.documentId,
        timestamp: now,
      },
      status: 'published',
    });

    // 4. Broadcast
    const { streamManager } = await import('../../../utils/llm/stream-manager');
    streamManager.broadcast(roomId, 'engine:events', {
      events: result.events,
      turnId: timeFrame.documentId,
    });
  },
});
