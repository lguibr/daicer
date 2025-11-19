import type { Server, Socket } from 'socket.io';
import { getActiveCombatSession } from '@/combat/tools';
import { getSpellByIdOrThrow } from '@/combat/spell-catalog';
import { logger } from '@/utils/logger';

const parseTarget = (
  raw: unknown
):
  | {
      type?: 'point' | 'direction';
      position?: { x: number; y: number };
      direction?: number;
    }
  | undefined => {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }

  const target = raw as Record<string, unknown>;
  if (target.type === 'direction' || typeof target.direction === 'number') {
    return {
      type: 'direction',
      direction: Number(target.direction ?? 6),
    };
  }

  if (typeof target.x === 'number' && typeof target.y === 'number') {
    return {
      type: 'point',
      position: { x: Number(target.x), y: Number(target.y) },
    };
  }

  return undefined;
};

const parseObstacles = (raw: unknown): Array<{ x: number; y: number }> | undefined => {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .map((value) => {
      if (!value || typeof value !== 'object') return null;
      const obstacle = value as Record<string, unknown>;
      if (typeof obstacle.x !== 'number' || typeof obstacle.y !== 'number') {
        return null;
      }
      return { x: obstacle.x, y: obstacle.y };
    })
    .filter((value): value is { x: number; y: number } => value !== null);
};

export async function handleCombatAction(
  io: Server,
  socket: Socket,
  _userId: string,
  data: {
    roomId: string;
    action: 'attack' | 'move' | 'end_turn' | 'start_combat' | 'end_combat' | 'spell_preview' | 'spell_cast';
    params: Record<string, unknown>;
  }
) {
  try {
    const { roomId, action, params } = data;

    logger.info(`Combat action: ${action} in room ${roomId}`);

    const session = getActiveCombatSession(roomId);
    if (!session && action !== 'start_combat') {
      socket.emit('error', { message: 'No active combat session' });
      return;
    }

    let updatedState;

    switch (action) {
      case 'attack':
        if (session) {
          updatedState = await session.attack(params.attackerId as string, params.defenderId as string, {
            weaponDamage: params.weaponDamage as string | undefined,
            damageType: params.damageType as string | undefined,
          });
        }
        break;

      case 'move':
        if (session) {
          updatedState = await session.moveCharacter(params.characterId as string, {
            x: params.targetX as number,
            y: params.targetY as number,
          });
        }
        break;

      case 'end_turn':
        if (session) {
          updatedState = await session.endTurn();
        }
        break;

      case 'spell_preview':
        if (session) {
          const spellId = params.spellId as string | undefined;
          const casterId = params.casterId as string | undefined;
          if (!spellId || !casterId) {
            socket.emit('error', { message: 'Spell preview requires spellId and casterId' });
            return;
          }

          const spell = getSpellByIdOrThrow(spellId);
          updatedState = await session.previewSpell({
            casterId,
            spell,
            target: parseTarget(params.target),
            obstacles: parseObstacles(params.obstacles),
            gridWidth: typeof params.gridWidth === 'number' ? (params.gridWidth as number) : undefined,
            gridHeight: typeof params.gridHeight === 'number' ? (params.gridHeight as number) : undefined,
          });
        }
        break;

      case 'spell_cast':
        if (session) {
          const spellId = params.spellId as string | undefined;
          const casterId = params.casterId as string | undefined;
          if (!spellId || !casterId) {
            socket.emit('error', { message: 'Spell cast requires spellId and casterId' });
            return;
          }

          const spell = getSpellByIdOrThrow(spellId);
          updatedState = await session.castSpell({
            casterId,
            spell,
            target: parseTarget(params.target),
            obstacles: parseObstacles(params.obstacles),
            gridWidth: typeof params.gridWidth === 'number' ? (params.gridWidth as number) : undefined,
            gridHeight: typeof params.gridHeight === 'number' ? (params.gridHeight as number) : undefined,
          });
        }
        break;

      default:
        socket.emit('error', { message: 'Unknown combat action' });
        return;
    }

    if (updatedState) {
      io.to(roomId).emit('combat:state_update', updatedState);
    }

    logger.info(`Combat action ${action} completed`);
  } catch (error) {
    logger.error('Error handling combat action:', error);
    socket.emit('error', { message: 'Failed to execute combat action' });
  }
}

export async function handleRestoreCombatState(
  io: Server,
  socket: Socket,
  _userId: string,
  data: { roomId: string; historyIndex: number }
) {
  try {
    const { roomId, historyIndex } = data;

    const session = getActiveCombatSession(roomId);
    if (!session) {
      socket.emit('error', { message: 'No active combat session' });
      return;
    }

    const restoredState = await session.restoreState(historyIndex);

    io.to(roomId).emit('combat:state_update', restoredState);

    logger.info(`Combat state restored to index ${historyIndex} in room ${roomId}`);
  } catch (error) {
    logger.error('Error restoring combat state:', error);
    socket.emit('error', { message: 'Failed to restore combat state' });
  }
}
