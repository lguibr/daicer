import { db } from '@/config/firebase';
import { logger } from '@/utils/logger';
import { mapService } from '@/services/map-service';
import { actionBatcher } from '@/services/action-batcher';
import { Entity } from '@daicer/shared/world/entity-schema';

export type TurnPhase = 'IDLE' | 'PROCESSING' | 'TRANSITION';

export interface TurnState {
  roomId: string;
  actors: string[]; // Ordered list of EntityIDs
  currentIndex: number;
  currentActorId: string | null;
  phase: TurnPhase;
  round: number;
  history: string[]; // Log of last N actions
  lastUpdateTime: number;
  globalTimer: number; // Expiry timestamp
}

export class TurnManager {
  private static instance: TurnManager;
  private stateCache: Map<string, TurnState> = new Map();

  private constructor() {}

  public static getInstance(): TurnManager {
    if (!TurnManager.instance) {
      TurnManager.instance = new TurnManager();
    }
    return TurnManager.instance;
  }

  /**
   * Initialize combat/turn mode for a room
   */
  async initCombat(roomId: string, actorIds: string[]) {
    const initialState: TurnState = {
      roomId,
      actors: actorIds,
      currentIndex: 0,
      currentActorId: actorIds[0] || null,
      phase: 'IDLE',
      round: 1,
      history: [],
      lastUpdateTime: Date.now(),
      globalTimer: Date.now() + 60000, // 60s turn limit default
    };

    await this.saveState(roomId, initialState);
    logger.info(`[TurnManager] Combat started in room ${roomId} with ${actorIds.length} actors.`);
    return initialState;
  }

  /**
   * Advance to next turn
   */
  async nextTurn(roomId: string) {
    const state = await this.getState(roomId);
    if (!state) throw new Error('No active turn state');

    // Circular increment
    let nextIndex = (state.currentIndex + 1) % state.actors.length;
    let nextRound = state.round;

    if (nextIndex === 0) {
      nextRound++;
      logger.info(`[TurnManager] Room ${roomId} advancing to Round ${nextRound}`);
    }

    // Update State
    state.currentIndex = nextIndex;
    state.currentActorId = state.actors[nextIndex] || null;
    state.round = nextRound;
    state.phase = 'IDLE';
    state.globalTimer = Date.now() + 60000;
    state.lastUpdateTime = Date.now();

    await this.saveState(roomId, state);
    return state;
  }

  /**
   * Get current state (cached or DB)
   */
  async getState(roomId: string): Promise<TurnState | null> {
    if (this.stateCache.has(roomId)) {
      return this.stateCache.get(roomId)!;
    }

    const doc = await db().collection('rooms').doc(roomId).collection('system_states').doc('turn_manager').get();
    if (!doc.exists) return null;

    const data = doc.data() as TurnState;
    this.stateCache.set(roomId, data);
    return data;
  }

  /**
   * Persist state
   */
  private async saveState(roomId: string, state: TurnState) {
    this.stateCache.set(roomId, state); // Optimistic update
    await db().collection('rooms').doc(roomId).collection('system_states').doc('turn_manager').set(state);
  }

  /**
   * Check if specific actor can move
   */
  async canAct(roomId: string, actorId: string): Promise<boolean> {
    const state = await this.getState(roomId);
    // If no state, assume Free Roam (Exploration Mode)
    if (!state) return true;

    // Strict Turn Logic
    // Strict Turn Logic
    return state.currentActorId === actorId && state.phase === 'IDLE';
  }

  /**
   * Execute turns for all NPCs in the room (Batched)
   */
  async executeNPCTurns(roomId: string) {
    logger.info(`[TurnManager] Executing NPC turns for room ${roomId}`);

    // 1. Fetch all creatures
    const snapshot = await db()
      .collection('rooms')
      .doc(roomId)
      .collection('entities')
      .where('type', '==', 'creature')
      .get();

    if (snapshot.empty) {
      logger.info('[TurnManager] No creatures found.');
      return;
    }

    const creatures: Entity[] = [];
    snapshot.forEach((doc) => creatures.push(doc.data() as Entity));

    // 2. Process AI (Simple Movement Heuristic)
    for (const creature of creatures) {
      // Skip if dead
      if ((creature.metadata as any)?.hp <= 0) continue;

      // Simple AI: Move randomly for now (demonstration)
      // In real implementation, this calls TacticalDM or refined logic
      const moves = [
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
      ];
      const move = moves[Math.floor(Math.random() * moves.length)]!;
      const targetX = creature.x + move.dx;
      const targetY = creature.y + move.dy;

      // Queue the move
      await mapService.queueMoveEntity(roomId, creature, targetX, targetY, creature.z);
    }

    // 3. Commit Batch
    await actionBatcher.commit(roomId);
    logger.info(`[TurnManager] Batch committed for ${creatures.length} creatures.`);
  }
}

export const turnManager = TurnManager.getInstance();
