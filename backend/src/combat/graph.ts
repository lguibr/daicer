/**
 * LangGraph combat system graph
 * Manages combat state with time-travel and deterministic execution
 */

import { StateGraph, START, END, task } from '@langchain/langgraph';
import type { CombatState, CombatCharacter } from '@/graph/state';
import { CombatStateSchema } from '@/graph/state';
import { DiceRoller } from './dice';
import { initiativeNode } from './nodes/InitiativeNode';
import { turnStartNode } from './nodes/TurnStartNode';
import { turnEndNode } from './nodes/TurnEndNode';
import { moveNode } from './nodes/MoveNode';
import { attackNode } from './nodes/AttackNode';
import { spellPreviewNode, spellCastNode, SpellPreviewNodeInput, SpellCastNodeInput } from './nodes/SpellCastNode';
import type { SpellData } from '../types/spells';

/**
 * Task for rolling initiative (wraps dice rolling for determinism)
 */
const rollInitiativeTask = task(
  'rollInitiative',
  async (params: { characters: CombatCharacter[]; seed: number }): Promise<Partial<CombatState>> => {
    const diceRoller = new DiceRoller({ seed: params.seed, enableHistory: true });
    // Initiative node is already deterministic, but wrapped for consistency
    const result = initiativeNode({} as CombatState, {
      characters: params.characters,
      diceRoller,
    });
    return result;
  }
);

/**
 * Create combat StateGraph
 * This graph manages a single combat encounter from start to finish
 */
export function createCombatGraph() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder = (new StateGraph<CombatState>(CombatStateSchema as any) as any)
    // Combat initialization
    .addNode('initiative', async (state: CombatState) => {
      // Initiative rolling happens here
      const result = await rollInitiativeTask({
        characters: state.characters,
        seed: state.diceRollerSeed,
      });
      return result;
    })

    // Turn start
    .addNode('turn_start', turnStartNode)

    // Turn end
    .addNode('turn_end', turnEndNode)

    // Action selection (this is where external input comes in)
    .addNode(
      'action_selection',
      ((state: CombatState) =>
        // This node just waits for external action
        // The actual action execution happens via tool calls
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        state) as any
    )

    // Setup edges
    .addEdge(START, 'initiative')
    .addEdge('initiative', 'turn_start')

    // Turn cycle
    .addConditionalEdges('turn_start', ((state: CombatState) => {
      if (state.isCombatOver) return END;
      return 'action_selection';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any)

    .addConditionalEdges('action_selection', ((state: CombatState) => {
      if (state.isCombatOver) return END;
      // External control determines when to end turn
      return 'action_selection';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any)

    .addEdge('turn_end', 'turn_start');

  return builder;
}

/**
 * Combat session API - provides high-level interface to combat graph
 */
export class CombatSession {
  private state: CombatState;

  private diceRoller: DiceRoller;

  private stateHistory: Array<{ timestamp: number; state: CombatState; description: string }> = [];

  constructor(sessionId: string, diceRollerSeed?: number) {
    const seed = diceRollerSeed ?? Date.now();
    this.diceRoller = new DiceRoller({ seed, enableHistory: true });

    this.state = {
      sessionId,
      characters: [],
      activeCharacterId: null,
      turnOrder: [],
      round: 0,
      isCombatOver: false,
      winner: null,
      log: [],
      diceHistory: [],
      gridWidth: 10,
      gridHeight: 10,
      phase: 'setup',
      pendingOpportunityAttacks: [],
      diceRollerSeed: seed,
      spellPreview: null,
      lastSpellResolution: null,
      tacticalArena: null,
      tacticalMode: false,
      pendingNaturalLanguageCommand: null,
    };
  }

  /**
   * Initialize combat with characters
   */
  async startCombat(characters: CombatCharacter[]): Promise<CombatState> {
    const result = initiativeNode(this.state, {
      characters,
      diceRoller: this.diceRoller,
    });

    this.state = { ...this.state, ...result };
    this.recordState('Combat started');

    return this.state;
  }

  /**
   * Override grid dimensions for visualization or custom scenarios
   */
  setGridDimensions(gridWidth: number, gridHeight: number): CombatState {
    this.state = {
      ...this.state,
      gridWidth,
      gridHeight,
    };
    return this.state;
  }

  /**
   * Preview a spell effect on the grid
   */
  async previewSpell(options: Omit<SpellPreviewNodeInput, 'spell'> & { spell: SpellData }): Promise<CombatState> {
    const result = spellPreviewNode(this.state, options);
    this.state = {
      ...this.state,
      ...result,
      log: result.log ?? this.state.log,
      spellPreview: result.spellPreview ?? this.state.spellPreview,
    };
    this.recordState(`${options.casterId} previews spell ${options.spell.name}`);
    return this.state;
  }

  /**
   * Cast a spell, applying damage and logging rolls
   */
  async castSpell(
    options: Omit<SpellCastNodeInput, 'diceRoller' | 'spell'> & { spell: SpellData }
  ): Promise<CombatState> {
    const result = spellCastNode(this.state, { ...options, diceRoller: this.diceRoller, spell: options.spell });
    this.state = {
      ...this.state,
      ...result,
      log: result.log ?? this.state.log,
      diceHistory: result.diceHistory ?? this.state.diceHistory,
      spellPreview: result.spellPreview ?? null,
      lastSpellResolution: result.lastSpellResolution ?? this.state.lastSpellResolution,
      characters: result.characters ?? this.state.characters,
      isCombatOver: result.isCombatOver ?? this.state.isCombatOver,
      winner: result.winner ?? this.state.winner,
      phase: result.phase ?? this.state.phase,
    };
    this.recordState(`${options.casterId} casts spell ${options.spell.name}`);
    return this.state;
  }

  /**
   * Start the active character's turn
   */
  async startTurn(): Promise<CombatState> {
    const result = turnStartNode(this.state);
    this.state = { ...this.state, ...result };
    this.recordState('Turn started');

    return this.state;
  }

  /**
   * End the active character's turn
   */
  async endTurn(): Promise<CombatState> {
    const result = turnEndNode(this.state);
    this.state = { ...this.state, ...result };
    this.recordState('Turn ended');

    return this.state;
  }

  /**
   * Move a character
   */
  async moveCharacter(characterId: string, targetPosition: { x: number; y: number }): Promise<CombatState> {
    const result = moveNode(this.state, {
      characterId,
      targetPosition,
      diceRoller: this.diceRoller,
    });

    this.state = { ...this.state, ...result };
    this.recordState(`${characterId} moved`);

    return this.state;
  }

  /**
   * Make an attack
   */
  async attack(
    attackerId: string,
    defenderId: string,
    options: {
      weaponDamage?: string;
      damageType?: string;
      isFinesse?: boolean;
      isRanged?: boolean;
    } = {}
  ): Promise<CombatState> {
    const result = attackNode(this.state, {
      attackerId,
      defenderId,
      diceRoller: this.diceRoller,
      ...options,
    });

    this.state = { ...this.state, ...result };
    this.recordState(`${attackerId} attacked ${defenderId}`);

    return this.state;
  }

  /**
   * Get current state
   */
  getState(): CombatState {
    return this.state;
  }

  /**
   * Get active character
   */
  getActiveCharacter(): CombatCharacter | null {
    if (!this.state.activeCharacterId) return null;
    return this.state.characters.find((c) => c.id === this.state.activeCharacterId) ?? null;
  }

  /**
   * Get character by ID
   */
  getCharacter(id: string): CombatCharacter | undefined {
    return this.state.characters.find((c) => c.id === id);
  }

  /**
   * Get all alive characters
   */
  getAliveCharacters(): CombatCharacter[] {
    return this.state.characters.filter((c) => c.hp > 0);
  }

  /**
   * Record state for time-travel
   */
  private recordState(description: string): void {
    this.stateHistory.push({
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(this.state)), // Deep clone
      description,
    });
  }

  /**
   * Get state history for time-travel
   */
  getHistory(): Array<{ timestamp: number; state: CombatState; description: string }> {
    return this.stateHistory;
  }

  /**
   * Restore to a previous state (time-travel)
   */
  async restoreState(historyIndex: number): Promise<CombatState> {
    if (historyIndex < 0 || historyIndex >= this.stateHistory.length) {
      throw new Error('Invalid history index');
    }

    const snapshot = this.stateHistory[historyIndex];
    if (!snapshot) {
      throw new Error('Snapshot not found');
    }
    this.state = JSON.parse(JSON.stringify(snapshot.state)); // Deep clone

    // Restore dice roller seed
    this.diceRoller.setSeed(this.state.diceRollerSeed);

    return this.state;
  }

  /**
   * Fork from a previous state (creates new branch in history)
   */
  async forkFromState(historyIndex: number): Promise<CombatState> {
    const restoredState = await this.restoreState(historyIndex);

    // Truncate history to fork point
    this.stateHistory = this.stateHistory.slice(0, historyIndex + 1);

    return restoredState;
  }

  /**
   * Check if combat is over
   */
  isCombatOver(): boolean {
    return this.state.isCombatOver;
  }

  /**
   * Get winner
   */
  getWinner(): 'player' | 'enemy' | null {
    return this.state.winner;
  }
}

/**
 * Create a new combat session
 */
export function createCombatSession(sessionId: string, seed?: number): CombatSession {
  return new CombatSession(sessionId, seed);
}
