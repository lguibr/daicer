/**
 * Tactical DM Socket Handler
 * Handles tactical:dm:command events for LLM-controlled combat
 */

import type { Socket } from 'socket.io';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { processDMCommand } from '@/agents/tacticalDM';
import { DiceRoller } from '@/combat/dice';
import type { CombatCharacter } from '@/graph/state';
import { streamManager } from '@/services/llm/stream-manager';

const dmCommandSchema = z.object({
  sessionId: z.string().min(1),
  command: z.string().min(1),
  characters: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      hp: z.number(),
      maxHp: z.number(),
      ac: z.number(),
      attackBonus: z.number(),
      isPlayer: z.boolean(),
      position: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number().default(0),
      }),
      movementRemaining: z.number(),
    })
  ),
  seed: z.number().optional(),
});

/**
 * Register tactical DM handlers
 */
export function registerTacticalDMHandlers(socket: Socket, userId: string): void {
  /**
   * Process a DM command
   * Client emits: tactical:dm:command
   * Server responds: tactical:dm:response, tactical:dm:update, tactical:dm:error
   */
  socket.on('tactical:dm:command', async (data, ack) => {
    const startTime = Date.now();

    try {
      const validation = dmCommandSchema.safeParse(data);
      if (!validation.success) {
        const error = { error: 'Invalid request', details: validation.error.message };
        socket.emit('tactical:dm:error', error);
        if (typeof ack === 'function') ack(error);
        return;
      }

      const { sessionId, command, characters, seed } = validation.data;

      logger.info('[TacticalDM] Processing command', {
        userId,
        sessionId,
        command: command.substring(0, 100), // Log first 100 chars
        characterCount: characters.length,
      });

      // Create dice roller with seed for determinism
      const diceRoller = new DiceRoller({ seed: seed || Date.now() });

      // Track updates to emit
      const updates: any[] = [];
      const onUpdate = (update: any) => {
        updates.push(update);
        // Emit update immediately for real-time feedback
        socket.emit('tactical:dm:update', {
          sessionId,
          update,
        });
      };

      // Generate stream ID for this command
      const streamId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Start unified stream
      // Use sessionId as roomId since that's what we have
      streamManager.startStream(streamId, sessionId, userId);

      // Map request characters to full CombatCharacter objects
      const combatCharacters: CombatCharacter[] = characters.map((c) => ({
        ...c,
        armorClass: c.ac,
        initiative: 0,
        speed: 30,
        proficiencyBonus: 2,
        tempHp: 0,
        avatar: '',
        hasMoved: false,
        hasActed: false,
        hasReaction: true,
        hasBonusAction: true,
        conditions: [],
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        reach: 5,
        movementRemaining: c.movementRemaining ?? 30,
      }));

      // Process command through LLM agent
      const response = await processDMCommand(command, combatCharacters, diceRoller, onUpdate, streamId);

      // End unified stream
      streamManager.endStream(streamId);

      const elapsed = Date.now() - startTime;

      // Send final response
      socket.emit('tactical:dm:response', {
        sessionId,
        command,
        response,
        updates,
        elapsed,
      });

      if (typeof ack === 'function') ack(null); // Success

      logger.info('[TacticalDM] Command processed', {
        userId,
        sessionId,
        updateCount: updates.length,
        elapsed,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'DM command failed';
      logger.error('[TacticalDM] Command error:', error);

      socket.emit('tactical:dm:error', {
        error: errorMsg,
        details: error instanceof Error ? error.stack : undefined,
      });

      if (typeof ack === 'function') ack({ error: errorMsg });
    }
  });
}
