import type { WorldSettings, Player, Creature, Message, Language } from '@daicer/engine';

export default ({ strapi }) => ({
  async processTurn(
    roomId: string,
    worldDescription: string,
    messages: Message[],
    players: Player[],
    creatures: Creature[],
    language: Language = 'en',
    settings?: WorldSettings,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    worldConditions?: any[],
    mapContext?: string,
    streamId?: string
  ) {
    const narrativeEngine = strapi.service('api::game.narrative-engine');
    const turnPersistence = strapi.service('api::game.turn-persistence');
    const gameBroadcaster = strapi.service('api::game.game-broadcaster');
    const actionEngine = strapi.service('api::game.action-engine');

    // 1. Broadcast Processing Start
    gameBroadcaster.startProcessing(roomId);

    // 2. Generate Narrative
    const response = await narrativeEngine.generateNarrativeResponse(
      roomId,
      worldDescription,
      messages,
      players,
      creatures,
      language,
      settings,
      worldConditions,
      mapContext,
      streamId
    );

    // 3. Persist Turn
    const persistenceResult = await turnPersistence.persistTurn(
      roomId,
      response.overall_summary,
      players.filter((p) => p.action).map((p) => ({ user: p.userId, action: p.action })),
      'group',
      { model: 'llm', ragUsed: !!response.metadata?.ragContext }
    );

    const { turn, message, room } = persistenceResult;

    // 4. Clear Actions
    const updatedPlayers = await turnPersistence.clearPlayerActions(room.documentId, players);

    // 5. Broadcast Updates
    if (message) {
      const socketMessage = {
        id: message.documentId,
        sender: 'DM',
        text: message.content,
        timestamp: Number(message.timestamp),
        type: 'narration',
        metadata: {
          perspectives: response.player_perspectives,
          turnId: turn.documentId,
        },
      };
      gameBroadcaster.broadcastNewMessage(room.roomId, room.documentId, socketMessage);
    }

    gameBroadcaster.broadcastGameUpdate(room.roomId, room.documentId, { players: updatedPlayers });

    const turnPayload = {
      roomId: room.roomId,
      turn: {
        id: turn.documentId,
        number: turn.turnNumber,
        narrative: turn.narrative,
        snapshots: persistenceResult.snapshot,
      },
    };
    gameBroadcaster.broadcastTurnComplete(room.roomId, room.documentId, turnPayload);

    // 6. Dispatch Deterministic Commands (God Mode Integration)
    if (response.commands && Array.isArray(response.commands) && response.commands.length > 0) {
      strapi.log.info(`[God Mode] Dispatching ${response.commands.length} commands`);
      await actionEngine.dispatch(roomId, response.commands);
    }

    return {
      ...response,
      metadata: {
        ragContext: response.metadata?.ragContext,
      },
    };
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async executeDeterministicTurn(roomId: string, actions: any[]) {
    const turnPersistence = strapi.service('api::game.turn-persistence');
    const gameBroadcaster = strapi.service('api::game.game-broadcaster');
    const spawnService = strapi.service('api::game.spawn-service');

    // 1. Fetch Room
    const room = await strapi.documents('api::room.room').findOne({
      documentId: roomId,
      populate: ['character_sheets'],
    });

    if (!room) throw new Error('Room not found');

    // 2. Process Actions
    const processedActions = [];
    const movedEntityIds = new Set<string>();

    for (const action of actions) {
      if (action.type === 'move') {
        const sheet = room.character_sheets?.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (s: any) => s.documentId === action.entityId || s.id === action.entityId
        );

        if (sheet) {
          await turnPersistence.updateCharacterPosition(
            sheet.documentId,
            action.payload.x,
            action.payload.y,
            action.payload.z
          );
          movedEntityIds.add(sheet.documentId);
          processedActions.push(action);
        }
      } else if (action.type === 'spawn') {
        try {
          if (action.payload.entityType === 'monster') {
            await spawnService.spawnMonster(roomId, action.payload.id, action.payload.position);
          } else if (action.payload.entityType === 'character') {
            await spawnService.spawnCharacter(roomId, action.payload.id, action.payload.position);
          }
          processedActions.push(action);
        } catch (err) {
          strapi.log.error('Failed to process spawn action', err);
        }
      }
    }

    // 3. Persist Turn (Re-fetching room/snapshots handled inside persistTurn logic or similar helper if refactored fully,
    // but here we used logic inline previously. Let's use persistTurn but we need snapshots of UPDATED state.)
    // Actually, `persistTurn` fetches the room again. So it should capture the updated state!
    const persistenceResult = await turnPersistence.persistTurn(
      roomId,
      `Deterministic Turn: ${processedActions.length} actions executed.`,
      processedActions,
      'engine',
      { model: 'engine' }
    );

    const { turn, snapshot } = persistenceResult;

    // 4. Broadcast Updates
    const turnPayload = {
      roomId: room.roomId,
      turn: {
        id: turn.documentId,
        number: turn.turnNumber,
        narrative: turn.narrative,
        snapshots: snapshot,
        type: 'engine',
      },
    };

    gameBroadcaster.broadcastTurnComplete(room.roomId, room.documentId, turnPayload);

    // Broadcast generic entities update for moved/spawned things
    // We'd ideally want the fresh sheets from `persistenceResult.room` (if we returned it with populated sheets)
    // persistTurn refetches room with sheets, so we can use that.
    const updatedSheets = persistenceResult.room.character_sheets || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedEntities = updatedSheets.map((cs: any) => ({
      id: cs.documentId,
      position: cs.position,
      currentHp: cs.currentHp,
    }));

    gameBroadcaster.broadcastEntitiesUpdate(room.roomId, updatedEntities);

    return { success: true, turnId: turn.documentId };
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async submitAction(roomId: string, action: string, user: any) {
    const gameBroadcaster = strapi.service('api::game.game-broadcaster');

    // 1. Fetch Room and Player
    const rooms = await strapi.documents('api::room.room').findMany({
      filters: { roomId },
      populate: ['players'],
    });

    if (!rooms || rooms.length === 0) throw new Error('Room not found');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const room = rooms[0] as any;
    const players = room.players || [];

    // 2. Find Player for User
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerIndex = players.findIndex((p: any) => p.user?.documentId === user.documentId || p.user?.id === user.id);
    if (playerIndex === -1) throw new Error('User is not a player in this room');

    // 3. Update Action
    players[playerIndex].action = action;
    players[playerIndex].isReady = true;

    await strapi.documents('api::room.room').update({
      documentId: room.documentId,
      data: {
        players: players,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });

    // 4. Broadcast Update
    gameBroadcaster.broadcastGameUpdate(room.roomId, room.documentId, { players });

    return { success: true };
  },
});
