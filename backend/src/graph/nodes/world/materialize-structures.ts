/**
 * Structure Materialization Node
 * Generates 3D voxel footprints and stores in Firestore (3 levels)
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { materializeAllStructures } from '@/services/world-gen/structure-materializer';
import { db } from '@/config/firebase';
import { splitIntoChunks, voxelsToBase64 } from '@/schemas/structure-storage';
import type { CharacterCreationState } from '../../state';
import { createStreamChannel } from '@/utils/stream-channel';

/**
 * Materialize structures
 * Generates voxel data and stores in Firestore at 3 levels
 */
export const materializeStructuresNode = async (
  state: CharacterCreationState,
  config?: LangGraphRunnableConfig
): Promise<Partial<CharacterCreationState>> => {
  const { roomId, structures = [] } = state;

  logger.info('[materialize_structures] Materializing structures', {
    roomId,
    count: structures.length,
  });

  const stream = createStreamChannel(config);

  stream.emit({
    type: 'phase_start',
    phase: 'structures',
  });

  // Materialize all structures
  const materialized = materializeAllStructures(structures as any, roomId);

  // Save to Firestore (3 levels)
  const batch = db.batch();
  let savedCount = 0;

  for (let i = 0; i < materialized.length; i++) {
    const structureVoxelData = materialized[i];
    const structure = structures[i];

    // Level 1: Global metadata (structures/{id})
    const metadataRef = db.collection('structures').doc(structure.id);
    batch.set(metadataRef, {
      id: structure.id,
      name: structure.name,
      type: structure.type,
      size: structure.size,
      significance: structure.significance,
      era: structure.era,
      createdAt: Date.now(),
      totalVoxels: structureVoxelData.voxels.length,
      hasMaterialization: true,
    });

    // Level 2: Room-scoped (rooms/{roomId}/structures/{id})
    const roomStructureRef = db.collection('rooms').doc(roomId).collection('structures').doc(structure.id);

    batch.set(roomStructureRef, {
      id: structure.id,
      roomId,
      name: structure.name,
      x: structure.x,
      y: structure.y,
      description: structure.description,
      type: structure.type,
      size: structure.size,
      significance: structure.significance,
      era: structure.era,
      bounds: structureVoxelData.bounds,
      dimensions: structureVoxelData.dimensions,
      collapseInfluence: structureVoxelData.collapseInfluence,
      materializedAt: Date.now(),
    });

    // Level 3: Chunked voxel data (structures/{id}/chunks/{chunkId})
    const chunks = splitIntoChunks(structureVoxelData.voxels, structureVoxelData.dimensions);

    for (const chunk of chunks) {
      const chunkRef = db.collection('structures').doc(structure.id).collection('chunks').doc(chunk.chunkId);

      batch.set(chunkRef, {
        ...chunk,
        structureId: structure.id,
      });
    }

    savedCount++;

    // Emit progress
    stream.emit({
      type: 'progress',
      message: `Materialized ${savedCount}/${structures.length} structures`,
    } as any);
  }

  await batch.commit();

  logger.info('[materialize_structures] Saved to Firestore (3 levels)', {
    count: savedCount,
  });

  stream.emit({
    type: 'phase_complete',
    phase: 'structures',
  });

  return {
    worldGenProgress: {
      phase: 'structures',
      error: null,
      retryCount: 0,
    },
    streamEvents: [
      {
        type: 'phase_complete',
        phase: 'structures',
        timestamp: Date.now(),
      },
    ],
  };
};
