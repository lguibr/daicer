/**
 * Combat component type definitions
 * Re-exports from useCombat hook for component use
 */

import type {
  Position,
  Condition,
  CombatCharacter,
  DiceRollResult,
  CombatLogEntry,
  CombatState,
  CombatHistory,
} from '../../types/combat';

export type { Position, Condition, CombatCharacter, DiceRollResult, CombatLogEntry, CombatState, CombatHistory };

/**
 * Character card display props
 */
export interface CharacterCardProps {
  character: CombatCharacter;
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Combat grid props
 */
export interface CombatGridProps {
  characters: CombatCharacter[];
  gridWidth: number;
  gridHeight: number;
  activeCharacterId: string | null;
  selectedCharacterId: string | null;
  reachableSquares: Position[];
  onSquareClick: (position: Position) => void;
  onCharacterClick: (characterId: string) => void;
}

/**
 * Combat log props
 */
export interface CombatLogProps {
  entries: CombatLogEntry[];
  maxHeight?: string;
}

/**
 * Time travel panel props
 */
export interface TimeTravelPanelProps {
  history: CombatHistory[];
  currentIndex: number;
  onRestore: (index: number) => void;
}
