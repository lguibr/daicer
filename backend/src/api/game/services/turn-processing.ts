import type { Player, Creature, WorldSettings, Chunk, Language } from '@daicer/engine';
// Local definition to avoid missing shared export
interface Message {
  sender: string;
  text: string;
}

export default ({ strapi }) => ({
  async processTurn(
    roomId: string,
    worldDescription: string,
    messages: Message[],
    players: Player[],
    // creatures argument removed/deprecated
    language: Language = 'en',
    settings?: WorldSettings,
    worldConditions?: unknown[],
    mapContext?: string,
    streamId?: string,
    chunk?: Chunk
  ) {
    const narrativeEngine = strapi.service('api::game.narrative-engine');
    const turnPersistence = strapi.service('api::game.turn-persistence');
    const gameBroadcaster = strapi.service('api::game.game-broadcaster');
    const actionEngine = strapi.service('api::game.action-engine');

    // 1. Broadcast Processing Start
    gameBroadcaster.startProcessing(roomId);

    // 2. Execute Deterministic Turn (Movement, Collision, Exploration)
    // Parse actions from players (strings) into structured commands
    const deterministicActions = players
      .filter((p) => p.action)
      .map((p) => {
        if (!p.action) return null;
        // Parse "MOVE:x,y,z"
        if (p.action.startsWith('MOVE:')) {
          const parts = p.action.replace('MOVE:', '').split(',');
          if (parts.length >= 2) {
            const x = Number(parts[0]);
            const y = Number(parts[1]);
            const z = parts.length > 2 ? Number(parts[2]) : 0;
            return {
              type: 'move',
              entityId: p.characterSheet?.documentId,
              payload: { x, y, z },
            };
          }
        }
        // Fallback or other commands could be parsed here
        return null;
      })
      .filter((a) => a !== null);

    await strapi.service('api::game.turn-processing').executeDeterministicTurn(roomId, deterministicActions);

    // 3. Generate Map Image with NEW State
    let mapImage: Buffer | undefined;
    let mapImageId: string | undefined;

    if (chunk) {
      try {
        const { generateMapImage } = await import('./map-visualization');

        // Fetch Fresh Room Data (to get updated entity positions and exploredTiles)
        const roomEntity = await strapi.documents('api::room.room').findOne({
          documentId: roomId,
          populate: [
            'character_sheets',
            'character_sheets.monster',
            'character_sheets.character',
            'character_sheets.character.baseStats',
          ], // Populate Blueprint for Adapter
        });

        const exploredTiles = new Set<string>((roomEntity?.exploredTiles as string[]) || []);

        // Calculate center based on first player or default
        const firstPlayerSheet = (roomEntity.character_sheets as unknown as Record<string, unknown>[])?.[0];
        const center = (firstPlayerSheet?.position as { x: number; y: number; z: number }) || { x: 0, y: 0, z: 0 };

        // Re-construct players list with updated positions for visualization
        // Unify all sheets (players + monsters)
        const updatedEntities = ((roomEntity.character_sheets as Record<string, unknown>[]) || []).map((s) => ({
          id: s.documentId,
          name: s.name,
          position: s.position,
          hp: s.currentHp,
          maxHp: s.maxHp,
          type: s.type || 'player',
        }));

        // Map Renderer likely expects explicit players vs creatures arrays?
        // For now, let's split them based on type for the legacy signature of generateMapImage
        const updatedPlayers = updatedEntities.filter((e) => e.type === 'player');

        const creaturesDummy: unknown[] = [];
        mapImage = await generateMapImage(
          chunk,
          updatedPlayers as unknown as Player[],
          creaturesDummy as unknown as Creature[],
          exploredTiles,
          center
        );

        // 4. Upload Map Image to Strapi
        if (mapImage) {
          const uploadService = strapi.plugin('upload').service('upload');
          const uploadedFile = await uploadService.upload({
            data: {
              refId: roomEntity.id,
              ref: 'api::room.room', // Temporary association or just orphan?
              // Actually we want to associate it with the TURN, but the turn doesn't exist yet.
              // We'll upload it as an orphan first, then link it.
              field: 'contextImage',
            },
            files: {
              name: `map_turn_${Date.now()}.png`,
              type: 'image/png',
              size: mapImage.length,
              buffer: mapImage,
            },
          });
          // Upload usually returns an array or object depending on version, assuming object or array [0]
          const file = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;
          mapImageId = file.id;
        }
      } catch (e) {
        strapi.log.warn('Failed to generate/upload DM map context:', e);
      }
    }

    // 5a. Adapt Entities for Narrative
    const entityAdapter = strapi.service('api::game.entity-adapter');
    const allSheets =
      ((
        await strapi.documents('api::room.room').findOne({
          documentId: roomId,
          populate: [
            'character_sheets',
            'character_sheets.monster',
            'character_sheets.monster.structuredActions',
            'character_sheets.monster.features',
            'character_sheets.character',
            'character_sheets.character.baseStats',
          ],
        })
      ).character_sheets as unknown[]) || [];

    // Use Adapter
    const unifiedEntities = allSheets.map((s) => entityAdapter.adapt(s));

    // 5. Generate Narrative (with new Map Image)
    const response = await narrativeEngine.generateNarrativeResponse(
      roomId,
      worldDescription,
      messages,
      players,
      unifiedEntities,

      language,
      settings,
      worldConditions,
      mapContext,
      streamId,
      mapImage
    );

    // 6. Persist Turn
    const persistenceResult = await turnPersistence.persistTurn(
      roomId,
      response.overall_summary,
      players.filter((p) => p.action).map((p) => ({ user: p.userId, action: p.action })),
      'group',
      {
        model: 'llm',
        ragUsed: !!response.metadata?.ragContext,
        contextImage: mapImageId, // Pass the image ID to persistence
      }
    );

    const { turn, message, room } = persistenceResult;

    // Link image if we have one (if persistTurn didn't handle it in metadata, we might need a separate update if schema expects relation)
    // The Turn schema has 'contextImage' relation. persistTurn usually takes 'metadata' json.
    // We should probably update the turn entity directly to link the relation.
    if (mapImageId) {
      await strapi.documents('api::turn.turn').update({
        documentId: turn.documentId,
        data: {
          contextImage: mapImageId,
        },
      });
    }

    // 7. Clear Actions
    const updatedPlayersFinal = await turnPersistence.clearPlayerActions(room.documentId, players);

    // 8. Broadcast Updates
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

    gameBroadcaster.broadcastGameUpdate(room.roomId, room.documentId, { players: updatedPlayersFinal });

    const turnPayload = {
      roomId: room.roomId,
      turn: {
        id: turn.documentId,
        number: turn.turnNumber,
        narrative: turn.narrative,
        snapshots: persistenceResult.snapshot,
        contextImage: mapImageId ? { url: `/uploads/map_turn_${Date.now()}.png` } : undefined, // Optimistic?
      },
    };
    gameBroadcaster.broadcastTurnComplete(room.roomId, room.documentId, turnPayload);

    // 9. Dispatch Deterministic Commands (God Mode Integration)
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

  async executeDeterministicTurn(roomId: string, actions: unknown[]) {
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

    const allEntities = [
      ...(room.character_sheets || []).map((s: Record<string, unknown>) => ({
        id: s.documentId || s.id,
        pos: s.position,
      })),
    ];

    type AnyAction = {
      type: string;
      entityId?: string;
      payload?: {
        x?: number;
        y?: number;
        z?: number;
        id?: string;
        entityType?: string;
        position?: { x: number; y: number; z: number };
      };
    };

    for (const rawAction of actions) {
      const action = rawAction as AnyAction;

      if (action.type === 'move') {
        const sheet = room.character_sheets?.find(
          (s: Record<string, unknown>) => s.documentId === action.entityId || s.id === action.entityId
        );

        if (sheet) {
          // Collision Check
          const targetX = Math.round(action.payload?.x || 0);
          const targetY = Math.round(action.payload?.y || 0);
          const isOccupied = allEntities.some(
            (e) =>
              e.id !== (sheet.documentId || sheet.id) && // Ignore self
              e.pos &&
              Math.round(e.pos.x) === targetX &&
              Math.round(e.pos.y) === targetY
          );

          if (isOccupied) {
            strapi.log.warn(`[Move] Collision detected at ${targetX},${targetY} for ${sheet.name}`);
            continue; // Skip invalid move
          }

          if (action.payload?.x !== undefined && action.payload?.y !== undefined) {
            await turnPersistence.updateCharacterPosition(
              sheet.documentId,
              action.payload.x,
              action.payload.y,
              action.payload.z || 0
            );
          }
          movedEntityIds.add(sheet.documentId);
          processedActions.push(action);

          // Update local entity list for subsequent checks in same turn
          const entityRef = allEntities.find((e) => e.id === (sheet.documentId || sheet.id));
          if (entityRef && action.payload) {
            entityRef.pos = { x: targetX, y: targetY, z: action.payload.z || 0 };
          }

          // Exploration Update
          try {
            const VISION_RADIUS = 8;
            const currentExplored = new Set((room.exploredTiles as string[]) || []);
            let explorationChanged = false;

            for (let dy = -VISION_RADIUS; dy <= VISION_RADIUS; dy++) {
              for (let dx = -VISION_RADIUS; dx <= VISION_RADIUS; dx++) {
                if (Math.sqrt(dx * dx + dy * dy) <= VISION_RADIUS) {
                  const wx = targetX + dx;
                  const wy = targetY + dy;
                  const key = `${wx},${wy}`;
                  if (!currentExplored.has(key)) {
                    currentExplored.add(key);
                    explorationChanged = true;
                  }
                }
              }
            }

            if (explorationChanged) {
              await strapi.documents('api::room.room').update({
                documentId: roomId,
                data: {
                  exploredTiles: Array.from(currentExplored),
                } as unknown,
              });
              // Update local room ref if needed, but not critical for processing loop
            }
          } catch (e) {
            strapi.log.error('Exploration update failed', e);
          }
        }
      } else if (action.type === 'spawn') {
        try {
          if (action.payload?.entityType === 'monster') {
            await spawnService.spawnMonster(roomId, action.payload.id, action.payload.position);
          } else if (action.payload?.entityType === 'character') {
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
    const updatedEntities = updatedSheets.map((cs: Record<string, unknown>) => ({
      id: cs.documentId,
      position: cs.position,
      currentHp: cs.currentHp,
    }));

    gameBroadcaster.broadcastEntitiesUpdate(room.roomId, updatedEntities);

    return { success: true, turnId: turn.documentId };
  },

  async submitAction(roomId: string, action: string, user: Record<string, unknown>, mode?: 'debug' | 'game') {
    // 0. Handle Debug Mode (Immediate Execution)
    if (mode === 'debug') {
      return strapi.service('api::narrator.narrator').processAction({
        roomId,
        input: action,
        mode: 'debug',
        userId: user?.documentId || user?.id,
      });
    }

    const gameBroadcaster = strapi.service('api::game.game-broadcaster');

    // 1. Fetch Room and Player
    const rooms = await strapi.documents('api::room.room').findMany({
      filters: { roomId },
      populate: ['players'],
    });

    if (!rooms || rooms.length === 0) throw new Error('Room not found');
    const room = rooms[0] as unknown as { documentId: string; roomId: string; players: Player[] };
    const players = room.players || [];

    // 2. Find Player for User
    const playerIndex = players.findIndex(
      (p: Player) => p.user?.documentId === user.documentId || p.user?.id === user.id
    );
    if (playerIndex === -1) throw new Error('User is not a player in this room');

    // 3. Update Action
    players[playerIndex].action = action;
    players[playerIndex].isReady = true;

    await strapi.documents('api::room.room').update({
      documentId: room.documentId,
      data: {
        players: players,
      } as unknown as Record<string, unknown>,
    });

    // 4. Broadcast Update
    gameBroadcaster.broadcastGameUpdate(room.roomId, room.documentId, { players });

    return { success: true };
  },
});
