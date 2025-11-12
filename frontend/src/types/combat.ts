import type { GridPosition, SpellPreviewSnapshot, SpellResolutionSnapshot } from './spells';

export type Position = GridPosition;

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
  position: GridPosition;
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
  spellPreview: SpellPreviewSnapshot | null;
  lastSpellResolution: SpellResolutionSnapshot | null;
}

export interface CombatHistory {
  timestamp: number;
  state: CombatState;
  description: string;
}
