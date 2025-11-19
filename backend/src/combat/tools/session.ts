import { createCombatSession } from '../graph';

const activeCombatSessions = new Map<string, ReturnType<typeof createCombatSession>>();

export function getCombatSession(roomId: string, seed?: number): ReturnType<typeof createCombatSession> {
  let session = activeCombatSessions.get(roomId);
  if (!session) {
    session = createCombatSession(roomId, seed);
    activeCombatSessions.set(roomId, session);
  }
  return session;
}

export function getActiveCombatSession(roomId: string): ReturnType<typeof createCombatSession> | undefined {
  return activeCombatSessions.get(roomId);
}

export function clearCombatSession(roomId: string): void {
  activeCombatSessions.delete(roomId);
}
