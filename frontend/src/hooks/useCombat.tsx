/**
 * Combat hook for managing combat state and actions
 */

import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '../services/socket';

export interface Position {
  x: number;
  y: number;
}

export interface Condition {
  type: string;
  level?: number;
  source?: string;
  duration?: number;
}

export interface CombatCharacter {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  tempHp: number;
  armorClass: number;
  position: Position;
  initiative: number;
  avatar: string;
  isPlayer: boolean;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  proficiencyBonus: number;
  speed: number;
  reach: number;
  hasMoved: boolean;
  hasActed: boolean;
  hasReaction: boolean;
  hasBonusAction: boolean;
  movementRemaining: number;
  conditions: Condition[];
  deathSaves?: {
    successes: number;
    failures: number;
  };
}

export interface DiceRollResult {
  id: string;
  timestamp: number;
  rollType: string;
  diceType: string;
  numberOfDice: number;
  rawRolls: number[];
  modifier: number;
  advantageType: string;
  finalResult: number;
  description: string;
  contextId?: string;
}

export interface CombatLogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: string;
  relatedRolls: string[];
}

export interface CombatState {
  sessionId: string;
  characters: CombatCharacter[];
  activeCharacterId: string | null;
  turnOrder: string[];
  round: number;
  isCombatOver: boolean;
  winner: 'player' | 'enemy' | null;
  log: CombatLogEntry[];
  diceHistory: DiceRollResult[];
  gridWidth: number;
  gridHeight: number;
  phase: string;
  pendingOpportunityAttacks: Array<{
    attackerId: string;
    defenderId: string;
    trigger: string;
  }>;
  diceRollerSeed: number;
}

export interface CombatHistory {
  timestamp: number;
  state: CombatState;
  description: string;
}

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
