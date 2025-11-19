/**
 * Structure Materialization Node (Section 2: World Config)
 * Assigns physical dimensions and prepares structures for materialization
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { materializeAllStructures } from '@/services/world-gen/structure-materializer';
import { db } from '@/config/firebase';
import { splitIntoChunks } from '@/schemas/structure-storage';
import type { WorldConfigState } from '@daicer/shared/graph-states';
import { emitProgress } from '@/graph/shared-nodes/stream-progress';

/**
 * Materialize structures
 * Generates voxel data and stores in Firestore at 3 levels
 */
export const materializeStructuresNode = async (
  state: WorldConfigState,
  config?: LangGraphRunnableConfig
): Promise<Partial<WorldConfigState>> => {
  const { roomId, structures } = state;

  logger.info('[materialize_structures] Materializing structures', {
    roomId,
    count: structures.length,
  });

  // Emit progress
  emitProgress('node_start', { node: 'materialize_structures', count: structures.length }, config);

  // Materialize all structures
  const materialized = materializeAllStructures(structures as any, roomId);

  // Save to Firestore (3 levels)
  const batch = db().batch();
  let savedCount = 0;

  for (let i = 0; i < materialized.length; i++) {
    const structureVoxelData = materialized[i];
    const structure = structures[i];

    if (!structure || !structureVoxelData) continue;

    // Level 1: Global metadata
    const metadataRef = db().collection('structures').doc(structure.id);
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

    // Level 2: Room-scoped
    const roomStructureRef = db().collection('rooms').doc(roomId).collection('structures').doc(structure.id);
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

    // Level 3: Chunked voxel data
    const chunks = splitIntoChunks(structureVoxelData.voxels, structureVoxelData.dimensions);
    for (const chunk of chunks) {
      const chunkRef = db().collection('structures').doc(structure.id).collection('chunks').doc(chunk.chunkId);
      batch.set(chunkRef, {
        ...chunk,
        structureId: structure.id,
      });
    }

    savedCount++;
  }

  await batch.commit();

  logger.info('[materialize_structures] Saved to Firestore (3 levels)', { count: savedCount });

  // Emit completion
  emitProgress('node_complete', { node: 'materialize_structures', savedCount }, config);

  return {};
};
