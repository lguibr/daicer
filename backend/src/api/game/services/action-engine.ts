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
      populate: ['players', 'players.character', 'character_sheets'],
    });

    if (!room) throw new Error(`Room ${roomId} not found`);

    // Map Strapi relations to Engine GameState
    // This is a partial mapping for now
    const initialState: GameState = {
      room: { id: room.documentId, ...room },
      world: {}, // TODO: Fetch Voxel world if needed for Move checks
      entities: room.character_sheets || [], // Treating sheets as entities
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
    // Only handling basic events for now
    for (const event of result.events) {
      if (event.type === 'ENTITY_MOVED') {
        const { entityId, to } = event.payload;
        // Update CharacterSheet
        await strapi.documents('api::character-sheet.character-sheet').update({
          documentId: entityId,
          data: { position: to },
        });
      }
      // Added attack/skill event logging could go to a 'GameLog' collection
    }

    // Broadcast result events to frontend
    const { streamManager } = await import('../../../utils/llm/stream-manager');
    // Need to resolve Room ID for broadcasting (might be room.roomId vs documentId)
    // We used documentId above to fetch.
    streamManager.broadcast(roomId, 'engine:events', { events: result.events });
  },
});
