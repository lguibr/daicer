/**
 * Tactical Encounters Service
 * Manages tactical combat encounters in Firestore
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { Unit, Action } from '@/schemas/tactical';

export interface TacticalEncounter {
  id: string;
  roomId: string;
  name: string;
  description?: string;
  gridSize: {
    width: number;
    height: number;
  };
  round: number;
  turn: number;
  phase: 'pending' | 'in_progress' | 'paused' | 'complete';
  units: Unit[];
  turnOrder: string[];
  log: string[];
  seed: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new tactical encounter
 */
export async function createEncounter(
  roomId: string,
  data: {
    name: string;
    description?: string;
    gridSize: { width: number; height: number };
    enemies: Unit[];
    seed?: number;
  }
): Promise<TacticalEncounter> {
  const firestore = getFirestore();

  // Initialize units and turn order
  const units = data.enemies;
  const turnOrder = units.sort((a, b) => (b.initiative || 0) - (a.initiative || 0)).map((u) => u.id);

  const encounterId = firestore.collection('rooms').doc().id;

  const encounter: TacticalEncounter = {
    id: encounterId,
    roomId,
    name: data.name,
    description: data.description,
    gridSize: data.gridSize,
    round: 1,
    turn: 0,
    phase: 'in_progress',
    units,
    turnOrder,
    log: [],
    seed: data.seed || Math.floor(Math.random() * 1000000),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await firestore.collection('rooms').doc(roomId).collection('encounters').doc(encounterId).set(encounter);

  return encounter;
}

/**
 * Get an encounter by ID
 */
export async function getEncounter(roomId: string, encounterId: string): Promise<TacticalEncounter> {
  const firestore = getFirestore();
  const encounterDoc = await firestore.collection('rooms').doc(roomId).collection('encounters').doc(encounterId).get();

  if (!encounterDoc.exists) {
    throw new Error('Encounter not found');
  }

  return encounterDoc.data() as TacticalEncounter;
}

/**
 * Update an encounter
 */
export async function updateEncounter(
  roomId: string,
  encounterId: string,
  updates: Partial<TacticalEncounter>
): Promise<TacticalEncounter> {
  const firestore = getFirestore();
  const encounterRef = firestore.collection('rooms').doc(roomId).collection('encounters').doc(encounterId);

  const encounterDoc = await encounterRef.get();
  if (!encounterDoc.exists) {
    throw new Error('Encounter not found');
  }

  const updateData = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await encounterRef.update(updateData);

  const updatedDoc = await encounterRef.get();
  return updatedDoc.data() as TacticalEncounter;
}

/**
 * Delete an encounter
 */
export async function deleteEncounter(roomId: string, encounterId: string): Promise<void> {
  const firestore = getFirestore();
  const encounterRef = firestore.collection('rooms').doc(roomId).collection('encounters').doc(encounterId);

  const encounterDoc = await encounterRef.get();
  if (!encounterDoc.exists) {
    throw new Error('Encounter not found');
  }

  await encounterRef.delete();
}

/**
 * Process a combat action (basic implementation)
 * Returns updated encounter with log entries
 */
export async function processAction(roomId: string, encounterId: string, action: Action): Promise<TacticalEncounter> {
  const firestore = getFirestore();
  const encounterRef = firestore.collection('rooms').doc(roomId).collection('encounters').doc(encounterId);

  const encounterDoc = await encounterRef.get();
  if (!encounterDoc.exists) {
    throw new Error('Encounter not found');
  }

  const encounter = encounterDoc.data() as TacticalEncounter;

  // Validate actor exists
  const actor = encounter.units.find((u) => u.id === action.actorId);
  if (!actor) {
    throw new Error('Actor not found in encounter');
  }

  // Validate target if provided
  if (action.targetId) {
    const target = encounter.units.find((u) => u.id === action.targetId);
    if (!target) {
      throw new Error('Target not found in encounter');
    }
  }

  // Basic action processing (simplified - real implementation would use combat rules)
  const logEntry = `${actor.name} performs ${action.type}${action.targetId ? ` targeting ${encounter.units.find((u) => u.id === action.targetId)?.name}` : ''}`;

  encounter.log.push(logEntry);
  encounter.updatedAt = new Date().toISOString();

  await encounterRef.update({
    log: encounter.log,
    updatedAt: encounter.updatedAt,
  });

  return encounter;
}

/**
 * End an encounter (set phase to complete)
 */
export async function endEncounter(roomId: string, encounterId: string): Promise<TacticalEncounter> {
  return updateEncounter(roomId, encounterId, { phase: 'complete' });
}
