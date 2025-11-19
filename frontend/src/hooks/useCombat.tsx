import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '../services/socket';
import type { CombatCharacter, CombatState, CombatHistory } from '../types/combat';
import type { GridPosition } from '../types/spells';

export type Position = GridPosition;

export function useCombat(roomId: string) {
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [history, setHistory] = useState<CombatHistory[]>([]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Listen for combat state updates
    const handleStateUpdate = (newState: CombatState) => {
      setCombatState(newState);
    };

    // Listen for combat history updates
    const handleHistoryUpdate = (newHistory: CombatHistory[]) => {
      setHistory(newHistory);
    };

    socket.on('combat:state_update', handleStateUpdate);
    socket.on('combat:history_update', handleHistoryUpdate);

    return () => {
      socket.off('combat:state_update', handleStateUpdate);
      socket.off('combat:history_update', handleHistoryUpdate);
    };
  }, []);

  const attack = useCallback(
    (
      attackerId: string,
      defenderId: string,
      options?: {
        weaponDamage?: string;
        damageType?: string;
      }
    ) => {
      const socket = getSocket();
      if (!socket) return;

      socket.emit('combat:action', {
        roomId,
        action: 'attack',
        params: {
          attackerId,
          defenderId,
          ...options,
        },
      });
    },
    [roomId]
  );

  const move = useCallback(
    (characterId: string, targetX: number, targetY: number) => {
      const socket = getSocket();
      if (!socket) return;

      socket.emit('combat:action', {
        roomId,
        action: 'move',
        params: {
          characterId,
          targetX,
          targetY,
        },
      });
    },
    [roomId]
  );

  const endTurn = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('combat:action', {
      roomId,
      action: 'end_turn',
      params: {},
    });
  }, [roomId]);

  const restoreState = useCallback(
    (historyIndex: number) => {
      const socket = getSocket();
      if (!socket) return;

      socket.emit('combat:restore', {
        roomId,
        historyIndex,
      });
    },
    [roomId]
  );

  const getActiveCharacter = useCallback((): CombatCharacter | null => {
    if (!combatState || !combatState.activeCharacterId) return null;
    return combatState.characters.find((c) => c.id === combatState.activeCharacterId) ?? null;
  }, [combatState]);

  const getCharacter = useCallback(
    (id: string): CombatCharacter | undefined => {
      if (!combatState) return undefined;
      return combatState.characters.find((c) => c.id === id);
    },
    [combatState]
  );

  return {
    combatState,
    history,
    attack,
    move,
    endTurn,
    restoreState,
    getActiveCharacter,
    getCharacter,
  };
}
