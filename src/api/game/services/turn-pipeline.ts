/**
 * ⚠️ DOCUMENTATION MANDATE: Update JSDoc & README with ANY change.
 * Keep documentation synchronized with code at all times.
 */
/**
 * Turn Pipeline Service
 * The Orchestrator for the "Sandwich" Architecture.
 *
 * Flow:
 * 1. Intent Phase: Collect inputs, Parse text -> Commands.
 * 2. Resolution Phase: ActionEngine.dispatch(dryRun=true) -> Results (Events, Diffs).
 * 3. Persistence Phase: Apply Diffs, Save Events/Turn.
 * 4. Narration Phase: Narrator describes the Events.
 * 5. Broadcast Phase: Send updates to clients.
 */

import { Core } from '@strapi/strapi';
import { Command as EngineCommand } from '@daicer/engine/types';
import { GameEvent } from '@/api/game/schemas/events';
import { ActionResult, StateDiff } from '@/api/game/services/action-engine';

export interface TurnInput {
  type: 'command' | 'text';
  agentId?: string; // Who is acting
  command?: EngineCommand;
  text?: string;
}

// Local interfaces to avoid 'any'
interface EntitySheet {
  documentId: string;
  name: string;
  type?: string;
  currentHp: number;
  maxHp: number;
  ac?: number;
  stats?: Record<string, unknown>;
  computedActions?: unknown[];
}

interface Player {
  character?: EntitySheet;
  action?: string | null;
  isReady?: boolean;
}

// Internal helper for text parsing
// Internal helper for text parsing - Removed unused parseTextAction

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /** Authenticated player operations share one durable deterministic lifecycle. */
  async startGame(input, user) {
    return strapi.service('api::game.turn-lifecycle').startGame(input, user);
  },
  async submitAction(input, user) {
    return strapi.service('api::game.turn-lifecycle').submitAction(input, user);
  },
  async resolveTurn(input, user) {
    return strapi.service('api::game.turn-lifecycle').resolveTurn(input, user);
  },

  /**
   * Retained legacy pipeline for internal callers, outside the player API.
   * Intent -> Resolution -> Persistence -> Narration -> Broadcast.
   * Uses lock services to prevent race conditions.
   *
   * @param roomId - The room context.
   * @param inputs - Raw inputs (text or commands).
   * @returns processing result.
   */
  async processTurn(roomId: string, inputs: TurnInput[]) {
    const lockService = strapi.service('api::game.lock-service');
    const holderId = `pipeline-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // 0. LOCK PHASE - Pessimistic Locking
    const acquired = await lockService.acquire(roomId, holderId);
    if (!acquired) {
      strapi.log.warn(`[TurnPipeline] Room ${roomId} is locked. Rejecting concurrent turn request.`);
      throw new Error('Room is currently processing another turn. Please wait.');
    }

    try {
      strapi.log.info(`[TurnPipeline] Processing execution for Room ${roomId} with ${inputs.length} inputs`);

      // 1. INTENT PHASE
      const commands: EngineCommand[] = [];
      // Import ActionParser dynamically to avoid top-level side effects or circular deps if any
      const { ActionParser } = await import('../src/engine/input/ActionParser');

      for (const input of inputs) {
        if (input.type === 'command' && input.command) {
          commands.push(input.command);
        } else if (input.type === 'text' && input.text && input.agentId) {
          const parsed = ActionParser.parse(input.text, input.agentId);
          if (parsed) {
            commands.push(parsed);
          } else {
            strapi.log.warn('[TurnPipeline] Unknown text input:', input.text);
          }
        }
      }

      if (commands.length === 0) return { success: true, message: 'No executable commands.' };

      // 2. RESOLUTION PHASE (Pure Logic)
      const actionEngine = strapi.service('api::game.action-engine');

      // We expect actionEngine to return `ActionResult[]`
      const results: ActionResult[] = await actionEngine.dispatch(roomId, commands, true); // dryRun=true

      // Aggregate Diffs and Events
      const allEvents: GameEvent[] = [];
      const allDiffs: StateDiff = { updates: [], creates: [], deletes: [] };

      for (const res of results) {
        if (res.success) {
          if (res.events) allEvents.push(...res.events);
          if (res.stateDiff) {
            if (res.stateDiff.updates) allDiffs.updates.push(...res.stateDiff.updates);
            if (res.stateDiff.creates) allDiffs.creates.push(...res.stateDiff.creates);
            if (res.stateDiff.deletes) allDiffs.deletes.push(...res.stateDiff.deletes);
          }
        } else {
          strapi.log.warn('[TurnPipeline] Command Failed:', res.message);
        }
      }

      // 3. PERSISTENCE PHASE
      const createdEvents: (GameEvent & { documentId: string })[] = [];

      const turnId = await strapi.db.transaction(async (_trx) => {
        // A. Apply State Changes
        for (const update of allDiffs.updates) {
          await strapi.db.query(update.collection).update({
            where: { documentId: update.documentId },
            data: update.data,
          });
        }
        // Handle creates/deletes if needed (future proofing)

        // B. Create Events
        for (const event of allEvents) {
          // Explicitly cast to unknown first to satisfy strict Strapi document creation types if they don't match exactly
          // but we know it matches GameEvent structure.
          const e = await strapi.documents('api::game-event.game-event').create({
            data: event as never,
          });
          createdEvents.push(e as unknown as GameEvent & { documentId: string });
        }

        // C. Create Turn Record
        const turn = await strapi.documents('api::turn.turn').create({
          data: {
            room: roomId,
            metadata: {
              events: createdEvents.map((e) => e.documentId),
            },
            actions: commands as never,
            status: 'complete',
            turnNumber: Date.now(), // Temporary, should be incremental
          },
        });

        return turn.documentId;
      });

      // D. Create TimeFrame Snapshot
      const entitiesInRoom = (await strapi.documents('api::entity-sheet.entity-sheet').findMany({
        filters: {
          room: { documentId: roomId },
        },
        populate: ['stats'],
      })) as unknown as EntitySheet[];

      const characterSnapshots = entitiesInRoom.map((e) => ({
        name: e.name,
        documentId: e.documentId,
        hp: e.currentHp,
        maxHp: e.maxHp,
        ac: e.ac || 10,
        condition: 'normal',
      }));

      await strapi.documents('api::time-frame.time-frame').create({
        data: {
          turnNumber: -1,
          timestamp: new Date().toISOString(),
          room: roomId,
          gameState: {
            overview: 'Snapshot after Turn execution',
            entities: characterSnapshots,
          },
          events: createdEvents.map((e) => e.documentId),
        },
      });

      // 4. NARRATION PHASE
      try {
        const room = await strapi.documents('api::room.room').findOne({
          documentId: roomId,
          populate: ['world', 'dmSettings', 'players', 'players.character'],
        });

        if (room) {
          const currentEntities = (await strapi.documents('api::entity-sheet.entity-sheet').findMany({
            filters: { room: { documentId: roomId } },
            populate: ['stats', 'computedActions'],
          })) as unknown as EntitySheet[];

          // Map to Narrative Engine format
          const narrEntities = currentEntities.map((e) => ({
            id: e.documentId,
            name: e.name,
            type: e.type || 'character',
            hp: e.currentHp,
            maxHp: e.maxHp,
            armorClass: e.ac || 10,
            stats: e.stats || {},
            actions: e.computedActions || [],
          }));

          const narrPlayers = (room.players || ([] as Record<string, unknown>[])).map((p: Record<string, unknown>) => ({
            ...p,
            character: p.character,
          }));

          const narration = await strapi
            .service('api::game.narrative-engine')
            .generateNarrativeResponse(
              roomId,
              room.world?.description || 'A dark room.',
              [],
              narrPlayers,
              narrEntities,
              room.world?.language || 'en',
              { ...room.world, ...room.dmSettings },
              undefined,
              undefined,
              undefined
            );

          if (narration && narration.overall_summary) {
            await strapi.documents('api::turn.turn').update({
              documentId: turnId,
              data: { summary: narration.overall_summary } as unknown as Record<string, unknown>,
            });

            await strapi.documents('api::message.message').create({
              data: {
                content: narration.overall_summary,
                senderName: 'Dungeon Master',
                senderType: 'dm',
                room: roomId,
                turn: turnId,
                timestamp: Date.now().toString(),
              },
            });
          }
        }
      } catch (err) {
        strapi.log.error('[TurnPipeline] Narration Failed:', err);
      }

      return { success: true, turnId: turnId };
    } finally {
      // 6. UNLOCK
      await lockService.release(roomId, holderId);
    }
  },

  /**
   * Helper to fetch pending actions from Room and process them.
   */
  async processRoomTurn(roomId: string) {
    const room = await strapi.documents('api::room.room').findOne({
      documentId: roomId,
      populate: ['players', 'players.character'],
    });

    if (!room) throw new Error('Room not found');

    const inputs: TurnInput[] = [];
    const players = (room.players || []) as unknown as Player[];

    for (const p of players) {
      if (p.action) {
        // Try to parse as JSON Command
        try {
          const json = JSON.parse(p.action);
          if (json.type) {
            inputs.push({ type: 'command', agentId: p.character?.documentId, command: json });
            continue;
          }
        } catch {
          // Not JSON
        }
        inputs.push({ type: 'text', agentId: p.character?.documentId, text: p.action });
      }
    }

    if (inputs.length === 0) return { success: true, message: 'No actions pending.' };

    const result = await this.processTurn(roomId, inputs);

    // Clear Actions (Post-Processing)
    if (result.success) {
      const updatedPlayers = players.map((p) => ({ ...p, action: null, isReady: false }));
      await strapi.documents('api::room.room').update({
        documentId: roomId,
        data: { players: updatedPlayers as unknown as Record<string, unknown> } as unknown as Record<string, unknown>,
      });
    }

    return result;
  },
});
