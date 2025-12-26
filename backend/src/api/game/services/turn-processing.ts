import { generateStructured } from '../../../utils/llm/structured';
import { getPrompt, formatPrompt } from '../../../utils/prompt';
import { streamManager } from '../../../utils/llm/stream-manager';
import { createCharacterSnapshot, formatDmInstruction } from '@daicer/engine';
import type { WorldSettings, Player, Creature, Message, Language } from '@daicer/engine';

// Helper to create character snapshots
const createSnapshot = (characterSheets: any[]) => {
  const snapshot: Record<string, any> = {};
  for (const sheet of characterSheets) {
    if (sheet && sheet.documentId) {
      const snap = createCharacterSnapshot(sheet);
      if (snap) {
        snapshot[sheet.documentId] = snap;
      }
    }
  }
  return snapshot;
};

// Stub for RAG
async function getRuleContext(): Promise<string> {
  return '';
}

export default ({ strapi }) => ({
  async processTurn(
    roomId: string,
    worldDescription: string,
    messages: Message[],
    players: Player[],
    creatures: Creature[],
    language: Language = 'en',
    settings?: WorldSettings,
    worldConditions?: any[],
    mapContext?: string,
    streamId?: string
  ) {
    const { TurnResponseSchema } = await import('../../../schemas/agent-responses');

    const languageMap: Record<Language, string> = {
      en: 'English',
      es: 'Spanish',
      'pt-BR': 'Brazilian Portuguese',
    };
    const languageName = languageMap[language] || 'English';

    // Broadcast Processing Start
    streamManager.broadcast(roomId, 'turn:processing', { roomId });

    const playerSummaries = players
      .map((p) => {
        const char = p.character as any;
        if (!char) return `- ${p.name} (No character sheet)`;
        return `- ${char.name} (${char.race?.name || 'Unknown Race'} ${char.class?.name || 'Unknown Class'}) | HP: ${char.baseStats?.hp || 10}/${char.baseStats?.maxHp || 10}`;
      })
      .join('\n');

    const creatureSummaries = creatures.map((c) => `- ${c.name}, HP: ${c.hp}/${c.maxHp}`).join('\n');
    let worldConditionsText = ''; // stub

    // Style Instructions
    let dynamicStyleInstructions = 'Standard DM Style';
    if (settings?.dmStyle) {
      const instruction = formatDmInstruction(settings.dmStyle);
      dynamicStyleInstructions = `DYNAMIC STYLE ADJUSTMENTS:\n${instruction}`;
    }

    const systemPromptDefault = `You are the Dungeon Master (DM) for a D&D 5e adventure.
Your goal is to run a thrilling, immersive, and fair game.

{{dmStyle}}

WORLD CONTEXT:
{{worldContext}}

CURRENT PARTY:
{{partyContext}}

ACTIVE CREATURES/NPCs:
{{creaturesContext}}

CRITICAL: TEAMWORK & PARTY COHESION:
- This is a TEAM adventure - the party works TOGETHER
- Create situations that require cooperation and reward working as a group

FORMATTING RULES - EXTREMELY IMPORTANT:
You MUST use rich markdown formatting in your narrative.`;

    const basePrompt = await getPrompt('dm_system_instruction', language, systemPromptDefault);

    // Format the System Prompt
    const worldLore = [settings?.worldBackground?.trim(), worldDescription, worldConditionsText]
      .filter(Boolean)
      .join('\n\n');

    let systemPrompt = basePrompt;
    if (systemPrompt.includes('{{dmStyle}}')) {
      systemPrompt = formatPrompt(systemPrompt, {
        dmStyle: dynamicStyleInstructions,
        worldContext: worldLore,
        partyContext: playerSummaries,
        creaturesContext: creatureSummaries || 'None currently active.',
      });
    } else {
      systemPrompt = `${systemPrompt}\n\n${dynamicStyleInstructions}\n\nWORLD CONTEXT:\n${worldLore}\n\nCURRENT PARTY:\n${playerSummaries}\n\nACTIVE CREATURES:\n${creatureSummaries || 'None'}`;
    }

    // Build conversation
    const conversationHistory = messages.map((msg) => `${msg.sender}: ${msg.text}`).join('\n\n');
    const currentActions = players
      .filter((p) => p.action && p.character)
      .map((p) => `${p.character!.name}: ${p.action}`)
      .join('\n');

    // RAG
    let relevantRules = '';
    try {
      relevantRules = await getRuleContext();
    } catch (e) {
      strapi.log.warn('RAG failed', e);
    }

    const fullPrompt = `${systemPrompt}

${relevantRules ? `RELEVANT D&D 5E RULES:\n${relevantRules}\n\n` : ''}You MUST respond with a structured JSON object containing:
- overall_summary (string): An overall summary
- player_perspectives (array): Personalized perspectives

PREVIOUS STORY:
${conversationHistory}

${mapContext ? `MAP CONTEXT:\n${mapContext}\n` : ''}
CURRENT TURN ACTIONS:
${currentActions}

As the Dungeon Master, narrate what happens. First, provide an 'overall_summary'. Then, provide 'player_perspectives'.
Respond entirely in ${languageName}.`;

    strapi.log.info('Processing turn with LLM');

    const response = await generateStructured(TurnResponseSchema, systemPrompt, fullPrompt, language, {
      metadata: { streamId },
    });

    // --- PERSISTENCE & BROADCASTING ---

    // 1. Fetch Room with Character Sheets for Snapshot
    const roomWithSheets = await strapi.documents('api::room.room').findOne({
      documentId: roomId,
      populate: ['character_sheets'],
    });

    if (!roomWithSheets) throw new Error('Room not found for persistence');

    // 2. Determine Turn Number
    const turnCount = await strapi.documents('api::turn.turn').count({
      filters: { room: { documentId: roomWithSheets.documentId } },
    });

    const snapshot = createSnapshot(roomWithSheets.character_sheets || []);

    // 3. Create Turn Entity
    const newTurn = await strapi.documents('api::turn.turn').create({
      data: {
        turnNumber: turnCount,
        room: roomWithSheets.documentId,
        narrative: response.overall_summary,
        status: 'complete',
        type: 'group',
        actions: players.filter((p) => p.action).map((p) => ({ user: p.userId, action: p.action })),
        characterSnapshots: snapshot,
        metadata: {
          model: 'llm',
          ragUsed: !!relevantRules,
        },
      },
      status: 'published',
    });

    // 4. Create Response Message
    const newMessage = await strapi.documents('api::message.message').create({
      data: {
        content: response.overall_summary,
        senderName: 'DM',
        senderType: 'dm',
        room: roomWithSheets.documentId,
        turn: newTurn.documentId,
        timestamp: Date.now(),
      },
      status: 'published',
    });

    // 5. Clear Player Actions in Room
    const updatedPlayers = players.map((p) => ({
      ...p,
      action: null,
      isReady: false,
    }));

    await strapi.documents('api::room.room').update({
      documentId: roomWithSheets.documentId,
      data: {
        players: updatedPlayers,
      } as any,
    });

    // 6. Broadcast
    const socketMessage = {
      id: newMessage.documentId,
      sender: 'DM',
      text: newMessage.content,
      timestamp: Number(newMessage.timestamp),
      type: 'narration',
      metadata: {
        perspectives: response.player_perspectives,
        turnId: newTurn.documentId,
      },
    };

    streamManager.broadcast(roomWithSheets.roomId, 'message:new', socketMessage);
    if (roomWithSheets.documentId !== roomWithSheets.roomId) {
      streamManager.broadcast(roomWithSheets.documentId, 'message:new', socketMessage);
    }

    streamManager.broadcast(roomWithSheets.roomId, 'game:update', { players: updatedPlayers });
    if (roomWithSheets.documentId !== roomWithSheets.roomId) {
      streamManager.broadcast(roomWithSheets.documentId, 'game:update', { players: updatedPlayers });
    }

    const turnPayload = {
      roomId: roomWithSheets.roomId,
      turn: {
        id: newTurn.documentId,
        number: newTurn.turnNumber,
        narrative: newTurn.narrative,
        snapshots: snapshot,
      },
    };
    streamManager.broadcast(roomWithSheets.roomId, 'turn:complete', turnPayload);
    if (roomWithSheets.documentId !== roomWithSheets.roomId) {
      streamManager.broadcast(roomWithSheets.documentId, 'turn:complete', turnPayload);
    }

    return {
      ...response,
      metadata: {
        ragContext: relevantRules,
      },
    };
  },

  async executeDeterministicTurn(roomId: string, actions: any[], user: any) {
    const { streamManager } = await import('../../../utils/llm/stream-manager');

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
        // payload: { x, y, z }
        // entityId: character sheet documentId or ID
        const sheet = room.character_sheets?.find(
          (s: any) => s.documentId === action.entityId || s.id === action.entityId
        );

        if (sheet) {
          // Update Character Sheet Position
          // Using documentId for update
          await strapi.documents('api::character-sheet.character-sheet').update({
            documentId: sheet.documentId,
            data: {
              position: {
                x: action.payload.x,
                y: action.payload.y,
                z: action.payload.z,
              },
            },
          });
          movedEntityIds.add(sheet.documentId);
          processedActions.push(action);
        }
      } else if (action.type === 'spawn') {
        const spawnService = strapi.service('api::game.spawn-service');
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

    // 3. Re-fetch Room to get updated sheets for snapshot
    const updatedRoom = await strapi.documents('api::room.room').findOne({
      documentId: roomId,
      populate: ['character_sheets', 'players'],
    });

    const snapshot = createSnapshot(updatedRoom.character_sheets || []);

    // 4. Create Turn
    const turnCount = await strapi.documents('api::turn.turn').count({
      filters: { room: { documentId: updatedRoom.documentId } },
    });

    const newTurn = await strapi.documents('api::turn.turn').create({
      data: {
        turnNumber: turnCount,
        room: updatedRoom.documentId,
        narrative: `Deterministic Turn: ${processedActions.length} actions executed.`,
        status: 'complete',
        type: 'engine',
        actions: processedActions,
        characterSnapshots: snapshot,
        metadata: {
          model: 'engine',
        },
      },
      status: 'published',
    });

    // 5. Broadcast Updates
    // Update players list logic if needed? Not for movement usually, but let's sync "players" if their character position changed?
    // Frontend likely uses "room" or "character_sheets" to render.
    // If frontend renders "players" derived from room, we might not need to update `room.players` JSON if the source of truth is `character_sheets`.
    // BUT `game-room` often relies on `room.players` which contains merged character data.
    // We should probably update `room.players` to reflect new positions if that's what frontend uses.
    // Current `processTurn` updates `room.players` to clear actions.
    // Let's check `room.players` structure. It usually has `character` relation.
    // Strapi `populate` in `getRoom` usually hydrates `players.character`.
    // If `character-sheet` updated, `character` might not implicitly have position if position is on sheet.
    // The `CharacterSheet` has position. `Player` points to `Character`.
    // `GameRoom` uses `players` state.
    // We should broadcast `game:update` with updated entities.

    // Broadcast Turn Complete
    const turnPayload = {
      roomId: updatedRoom.roomId,
      turn: {
        id: newTurn.documentId,
        number: newTurn.turnNumber,
        narrative: newTurn.narrative,
        snapshots: snapshot,
        type: 'engine',
      },
    };

    streamManager.broadcast(updatedRoom.roomId, 'turn:complete', turnPayload);
    // Also broadcast generic game update for live view
    // We can send the full room or just sheets.
    // Let's send a simplified 'entities:update' event? or generic 'game:update'.
    // `game:update` usually expects partial room data.

    // Let's construct a list of updated entities for the frontend to merge
    const updatedEntities = updatedRoom.character_sheets.map((cs) => ({
      id: cs.documentId,
      position: cs.position,
      currentHp: cs.currentHp, // etc
    }));

    streamManager.broadcast(updatedRoom.roomId, 'entities:update', { entities: updatedEntities });

    return { success: true, turnId: newTurn.documentId };
  },

  async submitAction(roomId: string, action: string, user: any) {
    // 1. Fetch Room and Player
    const rooms = await strapi.documents('api::room.room').findMany({
      filters: { roomId }, // Assume roomId param is room identifier (UUID or ID)
      populate: ['players'],
    });

    if (!rooms || rooms.length === 0) throw new Error('Room not found');
    const room = rooms[0] as any;
    const players = room.players || [];

    // 2. Find Player for User
    const playerIndex = players.findIndex((p: any) => p.user?.documentId === user.documentId || p.user?.id === user.id);
    if (playerIndex === -1) throw new Error('User is not a player in this room');

    // 3. Update Action
    players[playerIndex].action = action;
    players[playerIndex].isReady = true;

    await strapi.documents('api::room.room').update({
      documentId: room.documentId,
      data: {
        players: players,
      } as any,
    });

    // 4. Broadcast Update
    streamManager.broadcast(room.roomId, 'game:update', { players });

    return { success: true };
  },
});
