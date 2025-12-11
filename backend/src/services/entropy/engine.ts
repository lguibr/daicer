import { db } from '@/config/firebase';
import { logger } from '@/utils/logger';
import { Alea } from '../world-gen/noise';

/**
 * Predefined world conditions that can be triggered by entropy
 */
export const WORLD_CONDITIONS = [
  'calm',
  'ominous_fog',
  'tremors',
  'distant_screams',
  'magical_static',
  'reality_glitch',
  'sudden_darkness',
] as const;

export type WorldCondition = (typeof WORLD_CONDITIONS)[number];

export interface EntropyState {
  roomId: string;
  chaosLevel: number; // 0-100
  accumulatedStress: number;
  currentCondition: WorldCondition;
  turnCount: number;
  lastEventTurn: number;
  history: Array<{
    turn: number;
    event: string;
    description: string;
  }>;
}

export class EntropyEngine {
  private static instance: EntropyEngine;
  private seed: string = 'default-entropy-seed';

  private constructor() {}

  public static getInstance(): EntropyEngine {
    if (!EntropyEngine.instance) {
      EntropyEngine.instance = new EntropyEngine();
    }
    return EntropyEngine.instance;
  }

  /**
   * Initialize state for a room
   */
  async initState(roomId: string): Promise<EntropyState> {
    const state: EntropyState = {
      roomId,
      chaosLevel: 0,
      accumulatedStress: 0,
      currentCondition: 'calm',
      turnCount: 0,
      lastEventTurn: 0,
      history: [],
    };

    await this.saveState(roomId, state);
    return state;
  }

  /**
   * Advance turn and calculate entropy changes
   * This is called by the Turn Manager
   */
  async advanceTurn(
    roomId: string,
    playerActionIntensity: number = 1 // 1=Normal, 2=Combat, 3=Magic
  ): Promise<EntropyState> {
    let state = await this.getState(roomId);
    if (!state) state = await this.initState(roomId);

    state.turnCount++;

    // Calculate Stress Increase
    // Base + Intensity * Chaos Factor
    const stressGain = 5 + playerActionIntensity * (1 + state.chaosLevel / 50);
    state.accumulatedStress += stressGain;

    // Check for Event Trigger (Threshold based on Chaos Level)
    // Higher chaos = lower threshold to trigger events
    const triggerThreshold = 100 - state.chaosLevel * 0.5; // 100 down to 50

    if (state.accumulatedStress >= triggerThreshold) {
      await this.triggerEvent(roomId, state);
      state.accumulatedStress = 0; // Reset stress accumulator
    }

    await this.saveState(roomId, state);
    return state;
  }

  /**
   * Trigger a random entropy event based on current chaos
   */
  private async triggerEvent(roomId: string, state: EntropyState) {
    const rng = Alea(`${this.seed}-${state.turnCount}`);
    const roll = rng();

    let event = 'minor_disturbance';
    let description = 'The air feels slightly colder.';

    // Event Table
    if (state.chaosLevel > 75) {
      // High Chaos Events
      if (roll > 0.5) {
        event = 'reality_tear';
        description = 'A tear in reality opens nearby, emitting a low hum.';
        state.currentCondition = 'reality_glitch';
      } else {
        event = 'boss_manifestation';
        description = 'A powerful presence manifests from the shadows!';
      }
    } else if (state.chaosLevel > 40) {
      // Medium Chaos Events
      if (roll > 0.5) {
        event = 'weather_shift';
        description = 'A sudden storm begins to brew indoors.';
        state.currentCondition = 'ominous_fog';
      } else {
        event = 'equipment_decay';
        description = 'Your equipment feels heavier, as if aging rapidly.';
      }
    } else {
      // Low Chaos Events
      if (roll > 0.8) {
        event = 'strange_sound';
        description = 'You hear distant footsteps where there should be none.';
      }
    }

    // Apply Chaos Increase
    state.chaosLevel = Math.min(100, state.chaosLevel + roll * 10); // +0 to 10 chaos

    // Log History
    state.history.push({
      turn: state.turnCount,
      event,
      description,
    });

    // Prune history
    if (state.history.length > 50) state.history.shift();

    logger.info(`[Entropy] Triggered ${event} in room ${roomId}. Chaos: ${state.chaosLevel}`);
  }

  /**
   * Manual Override (DM Intervention)
   */
  async setChaosLevel(roomId: string, level: number) {
    let state = await this.getState(roomId);
    if (!state) state = await this.initState(roomId);

    state.chaosLevel = Math.max(0, Math.min(100, level));
    await this.saveState(roomId, state);
  }

  private async getState(roomId: string): Promise<EntropyState | null> {
    const doc = await db().collection('rooms').doc(roomId).collection('system_states').doc('entropy').get();
    if (!doc.exists) return null;
    return doc.data() as EntropyState;
  }

  private async saveState(roomId: string, state: EntropyState) {
    await db().collection('rooms').doc(roomId).collection('system_states').doc('entropy').set(state);
  }
}

// Helper to generate initial conditions
export const generateInitialConditions = (): {
  weather: string;
  lighting: string;
  atmosphere: string;
} => {
  const weather = ['clear', 'rainy', 'foggy', 'stormy'][Math.floor(Math.random() * 4)]!;
  const lighting = ['bright', 'dim', 'pitch_black', 'magical'][Math.floor(Math.random() * 4)]!;
  const atmosphere = ['calm', 'tense', 'eerie', 'chaotic'][Math.floor(Math.random() * 4)]!;
  return { weather, lighting, atmosphere };
};

export const entropyEngine = EntropyEngine.getInstance();
