import { getDb } from '@/config/firebase';
import { logger } from '@/utils/logger';
import type { Structure } from '@/services/firestore/worlds';

const db = () => getDb();

/**
 * Get all structures for a room
 * Fetches from the detailed room-scoped structures collection
 */
export async function getStructures(roomId: string): Promise<Structure[]> {
  try {
    const snapshot = await db().collection('rooms').doc(roomId).collection('structures').get();

    if (snapshot.empty) {
      // Fallback: Check the room document itself
      // The structures visible in preview are stored in the room.structures array
      logger.info(`No structures in subcollection for room ${roomId}, checking room document fallback...`);

      const roomDoc = await db().collection('rooms').doc(roomId).get();
      if (!roomDoc.exists) return [];

      const roomData = roomDoc.data();
      const roomStructures = roomData?.structures || [];

      if (Array.isArray(roomStructures) && roomStructures.length > 0) {
        logger.info(`Found ${roomStructures.length} structures in room document fallback`);
        return roomStructures.map((s: any) => ({
          id: s.id || `struct-${Math.random().toString(36).substr(2, 9)}`,
          name: s.name || 'Unnamed Structure',
          type: s.type || 'generic',
          size: s.size || 'medium',
          significance: s.significance || 1,
          era: s.era || 'current',
          description: s.description || '',
          position: {
            // Handle both flat format (preview) and nested format (backend)
            x: s.position?.x ?? s.x ?? 0,
            y: s.position?.y ?? s.y ?? 0,
            z: s.position?.z ?? s.z ?? 0,
          },
        }));
      }

      return [];
    }

    const structures: Structure[] = [];
    snapshot.forEach((doc) => {
      // Cast to Structure type (ensure compatibility with what world-gen expects)
      const data = doc.data();
      structures.push({
        id: data.id,
        name: data.name,
        type: data.type,
        size: data.size,
        significance: data.significance,
        era: data.era,
        description: data.description,
        position: {
          x: data.x,
          y: data.y,
          // z is optional in Structure interface in worlds.ts, but valid here
        },
      } as Structure);
    });

    logger.info(`Retrieved ${structures.length} structures for room ${roomId}`);
    return structures;
  } catch (error) {
    logger.error(`Failed to get structures for room ${roomId}:`, error);
    // Return empty array instead of throwing to prevent blocking the main flow
    return [];
  }
}
