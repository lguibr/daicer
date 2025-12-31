/**
 * Turn Service
 * Handles the "Delta" turn logic:
 * 1. Validating and queuing actions
 * 2. Triggering the Turn Resolution (Process)
 * 3. Updating Room History and State
 */

import { generateStructured } from '../../../utils/llm/structured';
import { DMTurnSchema } from '../../../schemas/dm-turn';

interface TurnAction {
  playerId: string | number;
  characterId: string | number;
  type: 'action' | 'movement' | 'bonus' | 'free';
  intent: string; // The raw description "I attack the goblin"
  metadata?: Record<string, unknown>;
  timestamp: number;
}

interface TurnData {
  phase: 'idle' | 'waiting_for_actions' | 'processing';
  startTime: number;
  actions: TurnAction[];
}

export default ({ strapi }) => ({
  /**
   * Add an action to the pending queue
   */
  async addAction(roomId: string | number, playerId: string | number, action: Record<string, unknown>) {
    const room = await strapi.entityService.findOne('api::room.room', roomId, {
      populate: ['players'],
    });

    if (!room) {
      throw new Error('Room not found');
    }

    // Initialize turnData if missing
    const turnData: TurnData = room.turnData || {
      phase: 'idle',
      startTime: Date.now(),
      actions: [],
    };

    // Find the player's character
    // We assume the controller has validated that the user is in the room
    const player = room.players.find((p) => p.userId == playerId || p.id == playerId);
    if (!player) {
      throw new Error('Player not in room');
    }

    const newAction: TurnAction = {
      playerId,
      characterId: player.character?.id,
      type: (action.type as 'action' | 'movement' | 'bonus' | 'free') || 'action',
      intent: action.intent as string,
      metadata: action.metadata as Record<string, unknown>,
      timestamp: Date.now(),
    };

    // Append action
    turnData.actions.push(newAction);

    // Update Room
    await strapi.entityService.update('api::room.room', roomId, {
      data: {
        turnData,
      },
    });

    return turnData;
  },

  /**
   * Check if we should trigger the turn automatically (e.g. all ready)
   * For now, this is a placeholder or manual trigger
   */
  async checkTurnTrigger(_roomId: string | number) {
    // Logic: If all players have submitted an action?
    // For now, return false, wait for manual trigger
    return false;
  },

  /**
   * Helper: Build Context for the DM
   */
  async buildTurnContext(room: Record<string, any>, turnData: TurnData) {
    // 1. World Context
    const worldInfo = `
WORLD SETTING: ${room.setting || 'Generic Fantasy'}
THEME: ${room.theme || 'Adventure'}
TONE: ${room.tone || 'Heroic'}
DESCRIPTION: ${room.worldDescription || ''}
`;

    // 2. Character Context (Simplified)
    // Access pre-populated character_sheets from room
     
     
    const charContext =
      ((room.character_sheets as Record<string, unknown>[]) || [])
        ?.map((cs) => {
          const char = cs.character as Record<string, unknown>; // blueprint
          const race = char?.race as Record<string, unknown>;
          const charClass = char?.class as Record<string, unknown>;
          const stats = cs.stats as Record<string, unknown>;
          const pos = cs.position as Record<string, unknown>;

          return `
ID: ${cs.id}
NAME: ${char?.name || 'Unknown'} (${race?.name} ${charClass?.name})
STATUS: HP ${cs.currentHp}/${cs.maxHp}
POSITION: (${pos?.x}, ${pos?.y})
STATS: SPD ${stats?.speed}
`.trim();
        })
        .join('\n\n') || 'No characters found.';

    // 3. Action Context
    const actionContext = turnData.actions
      .map((a) => `- Player ${a.playerId} (Char ${a.characterId}) intends: "${a.intent}"`)
      .join('\n');

    return { worldInfo, charContext, actionContext };
  },

  /**
   * RESOLVE TURN WITH LLM
   */
  async resolveTurnWithLLM(room: Record<string, unknown>, turnData: TurnData) {
    const context = await this.buildTurnContext(room, turnData);

    const systemPrompt = `You are the Dungeon Master.
Resolution Phase.
Analyze the player actions against the world state.
Determine the outcomes using the available TOOLS.

AVAILABLE TOOLS:
- roll_dice(expr): Check success.
- move_entity(charId, x, y): Update position.
- apply_damage(targetId, amt, type): Combat results.

CONTEXT:
${context.worldInfo}

CHARACTERS:
${context.charContext}
`;

    const userPrompt = `CURRENT ACTIONS:
${context.actionContext}

Resolve this turn. 
1. Narrate the simultaneous unfolding of events.
2. Call tools for any mechanical changes (Movement, Damage, Rolls).
`;

    try {
      const output = await generateStructured(DMTurnSchema, systemPrompt, userPrompt);
      return output;
    } catch (err) {
      console.error('DM Brain Failed:', err);
      // Fallback: Return a generic narrative
      return {
        narrative: 'The chaos of battle makes it hard to see what happens, but the actions resolve.',
        tool_calls: [],
      };
    }
  },

  /**
   * The "Delta Resolver"
   * Processing the turn:
   * 1. lock the room
   * 2. process actions (mock)
   * 3. update history
   * 4. clear queue
   */
  async processTurn(roomId: string | number) {
    const room = await strapi.entityService.findOne('api::room.room', roomId, {
      populate: {
        players: { populate: ['character'] },
        character_sheets: { populate: ['character', 'stats', 'position', 'race', 'class'] },
      },
    });

    if (!room) throw new Error('Room not found');

    const turnData: TurnData = room.turnData;

    if (!turnData || turnData.actions.length === 0) {
      return { message: 'No actions to process' };
    }

    // 1. Lock Phase
    await strapi.entityService.update('api::room.room', roomId, {
      data: { turnData: { ...turnData, phase: 'processing' } },
    });

    // 2. RESOLUTION PHASE (LLM)
    const actionRegistry = strapi.service('api::room.action-registry');

    // Call the Brain
    const dmOutput = await this.resolveTurnWithLLM(room, turnData);

    const mechanicsLog: string[] = [];

    // Execute Tool Calls from Brain
    if (dmOutput.tool_calls) {
      for (const call of dmOutput.tool_calls) {
        try {
          let result = null;
          const { tool, args } = call;

          if (tool === 'roll_dice') {
            result = actionRegistry.rollDice(args[0]);
            mechanicsLog.push(`[Dice] ${result.expression} = ${result.total}`);
          } else if (tool === 'move_entity') {
            // args might come as [id, x, y] or string versions
            const [cId, x, y] = args;
            result = await actionRegistry.moveEntity(cId, Number(x), Number(y));
            mechanicsLog.push(`[Move] Entity ${cId} moved to (${result.to.x}, ${result.to.y})`);
          } else if (tool === 'apply_damage') {
            const [tId, amt, type] = args;
            result = await actionRegistry.applyDamage(tId, Number(amt), String(type));
            mechanicsLog.push(`[Combat] Entity ${tId} took ${result.damage} ${result.type} damage.`);
          }
        } catch (err) {
          mechanicsLog.push(`[Error] Tool ${call.tool} failed: ${err.message}`);
        }
      }
    }

    // 3. Update History
    const historyEntry = {
      round: (room.history?.length || 0) + 1,
      timestamp: Date.now(),
      log: mechanicsLog,
      narrative: dmOutput.narrative,
      summary: `Turn Resolved.`,
    };

    const newHistory = [...(room.history || []), historyEntry];

    // 4. Clear/Reset Turn
    const resetTurnData: TurnData = {
      phase: 'idle',
      startTime: Date.now(),
      actions: [],
    };

    const updatedRoom = await strapi.entityService.update('api::room.room', roomId, {
      data: {
        history: newHistory,
        turnData: resetTurnData,
      },
    });

    return {
      success: true,
      historyEntry,
      room: updatedRoom,
    };
  },
});
