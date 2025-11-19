/**
 * GridMapRenderer Storybook Stories
 * Hand-crafted examples with deterministic seeds
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { GridChunk, GridTile, GridFeature } from '@daicer/shared';
import { GridMapRenderer } from './GridMapRenderer';
import { TileMetadataPanel } from './TileMetadataPanel';

const meta: Meta<typeof GridMapRenderer> = {
  title: 'World/GridMapRenderer',
  component: GridMapRenderer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GridMapRenderer>;

/**
 * Helper to create mock chunk with deterministic pattern
 */
interface MockChunkParams {
  chunkX: number;
  chunkY: number;
  z: number;
  biome: string;
  pattern?: string;
  features?: Array<{ type: string; subtype: string; localX: number; localY: number }>;
}

function createMockChunk(params: MockChunkParams): GridChunk {
  const { chunkX, chunkY, z, biome, pattern = 'grass', features = [] } = params;

  const tiles: GridTile[] = [];

  // Generate 8x8 tiles with variation
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const worldX = chunkX * 8 + x;
      const worldY = chunkY * 8 + y;

      let blockType = 'grass';

      // Apply pattern with variation
      if (pattern === 'grass') {
        // Mix of grass and dirt
        blockType = (x + y) % 3 === 0 ? 'dirt' : 'grass';
      } else if (pattern === 'desert') {
        // Mix of sand and sandstone
        blockType = (x + y) % 4 === 0 ? 'sandstone' : 'sand';
      } else if (pattern === 'mountains') {
        // Mix of stone and gravel
        blockType = (x + y) % 3 === 0 ? 'gravel' : 'stone';
      } else if (pattern === 'water') {
        // Water on left, sand/beach on right
        blockType = x < 4 ? 'water' : x === 4 ? 'sand' : 'grass';
      } else if (pattern === 'cave') {
        // Cave pattern
        blockType = (x + y) % 3 === 0 ? 'air' : (x + y) % 2 === 0 ? 'stone' : 'gravel';
      }

      tiles.push({
        x: worldX,
        y: worldY,
        z,
        blockType: blockType as GridTile['blockType'],
        biome,
        elevation: 0,
        lightLevel: z >= 0 ? 15 : 5,
      });
    }
  }

  const gridFeatures: GridFeature[] = features.map((f) => ({
    id: `feature_${chunkX}_${chunkY}_${f.localX}_${f.localY}`,
    position: {
      x: chunkX * 8 + f.localX,
      y: chunkY * 8 + f.localY,
      z,
    },
    type: f.type as GridFeature['type'],
    subtype: f.subtype,
    metadata: {},
    isVisible: true,
    isWalkable: f.type !== 'tree',
    blocksLineOfSight: f.type === 'tree',
    interactable: true,
  }));

  return {
    chunkX,
    chunkY,
    z,
    tiles,
    features: gridFeatures,
    biomes: [biome],
    seed: `mock_${chunkX}_${chunkY}_${z}`,
    generated: true,
    generatedAt: Date.now(),
    hasStructure: false,
    hasCave: pattern === 'cave',
    isStartingArea: true,
  };
}

/**
 * Interactive wrapper with tile selection
 */
interface InteractiveRendererProps {
  roomId: string;
  currentLayer: number;
  playerPosition?: { x: number; y: number; z: number };
}

function InteractiveRenderer(props: InteractiveRendererProps) {
  const [selectedTile, setSelectedTile] = useState<GridTile | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<GridFeature[]>([]);

  return (
    <div className="relative">
      <GridMapRenderer
        {...props}
        onTileClick={(tile: GridTile, features: GridFeature[]) => {
          setSelectedTile(tile);
          setSelectedFeatures(features);
        }}
      />
      <TileMetadataPanel tile={selectedTile} features={selectedFeatures} onClose={() => setSelectedTile(null)} />
    </div>
  );
}

/**
 * Story: Forest Biome
 */
export const ForestBiome: Story = {
  render: () => {
    // Pre-create 3x3 grid of chunks (viewport coverage)
    const mockChunks: Record<string, GridChunk> = {};

    for (let cy = -1; cy <= 1; cy++) {
      for (let cx = -1; cx <= 1; cx++) {
        const key = `${cx}_${cy}_0`;
        mockChunks[key] = createMockChunk({
          chunkX: cx,
          chunkY: cy,
          z: 0,
          biome: 'forest',
          pattern: 'grass',
          features:
            cx === 0 && cy === 0
              ? [
                  { type: 'tree', subtype: 'oak_tree', localX: 2, localY: 3 },
                  { type: 'tree', subtype: 'oak_tree', localX: 5, localY: 1 },
                  { type: 'tree', subtype: 'birch_tree', localX: 7, localY: 6 },
                ]
              : [],
        });
      }
    }

    console.log('[Story:ForestBiome] Created mock chunks:', Object.keys(mockChunks));

    // Mock fetch to return pre-created chunks
    (globalThis as Record<string, unknown>).fetch = async (url: string) => {
      console.log('[Story:ForestBiome] Fetch called:', url);
      const match = url.match(/chunk\/([^/]+)\/(-?\d+)\/(-?\d+)\/(-?\d+)/);
      if (match && match[2] && match[3] && match[4]) {
        const cx = parseInt(match[2], 10);
        const cy = parseInt(match[3], 10);
        const z = parseInt(match[4], 10);
        const key = `${cx}_${cy}_${z}`;

        const chunk =
          mockChunks[key] ||
          createMockChunk({
            chunkX: cx,
            chunkY: cy,
            z,
            biome: 'forest',
            pattern: 'grass',
            features: [],
          });

        console.log('[Story:ForestBiome] Returning chunk:', key, 'with', chunk.tiles.length, 'tiles');

        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => chunk,
          text: async () => JSON.stringify(chunk),
        } as Response;
      }
      console.error('[Story:ForestBiome] URL did not match pattern:', url);
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not found' }),
        text: async () => 'Not found',
      } as Response;
    };

    return <InteractiveRenderer roomId="forest-story" currentLayer={0} />;
  },
};

/**
 * Story: Desert with Ruins
 */
export const DesertRuins: Story = {
  render: () => {
    (globalThis as Record<string, unknown>).fetch = async (url: string) => {
      const match = url.match(/chunk\/([^/]+)\/(-?\d+)\/(-?\d+)\/(-?\d+)/);
      if (match && match[2] && match[3] && match[4]) {
        const [_fullMatch, _roomId, cx, cy, z] = match;
        return {
          json: async () =>
            createMockChunk({
              chunkX: parseInt(cx, 10),
              chunkY: parseInt(cy, 10),
              z: parseInt(z, 10),
              biome: 'desert',
              pattern: 'desert',
              features: [
                { type: 'decoration', subtype: 'ancient_statue', localX: 4, localY: 4 },
                { type: 'resource', subtype: 'stone_outcrop', localX: 1, localY: 7 },
              ],
            }),
        };
      }
      return { json: async () => ({ chunks: [] }) };
    };

    return <InteractiveRenderer roomId="desert-story" currentLayer={0} />;
  },
};

/**
 * Story: Mountains
 */
export const MountainTerrain: Story = {
  render: () => {
    (globalThis as Record<string, unknown>).fetch = async (url: string) => {
      const match = url.match(/chunk\/([^/]+)\/(-?\d+)\/(-?\d+)\/(-?\d+)/);
      if (match && match[2] && match[3] && match[4]) {
        const [_fullMatch, _roomId, cx, cy, z] = match;
        return {
          json: async () =>
            createMockChunk({
              chunkX: parseInt(cx, 10),
              chunkY: parseInt(cy, 10),
              z: parseInt(z, 10),
              biome: 'mountains',
              pattern: 'mountains',
              features: [
                { type: 'resource', subtype: 'iron_ore', localX: 3, localY: 2 },
                { type: 'resource', subtype: 'gold_ore', localX: 6, localY: 5 },
              ],
            }),
        };
      }
      return { json: async () => ({ chunks: [] }) };
    };

    return <InteractiveRenderer roomId="mountain-story" currentLayer={0} />;
  },
};

/**
 * Story: Ocean/Beach
 */
export const OceanBeach: Story = {
  render: () => {
    (globalThis as Record<string, unknown>).fetch = async (url: string) => {
      const match = url.match(/chunk\/([^/]+)\/(-?\d+)\/(-?\d+)\/(-?\d+)/);
      if (match && match[2] && match[3] && match[4]) {
        const [_fullMatch, _roomId, cx, cy, z] = match;
        return {
          json: async () =>
            createMockChunk({
              chunkX: parseInt(cx, 10),
              chunkY: parseInt(cy, 10),
              z: parseInt(z, 10),
              biome: 'beach',
              pattern: 'water',
              features: [],
            }),
        };
      }
      return { json: async () => ({ chunks: [] }) };
    };

    return <InteractiveRenderer roomId="ocean-story" currentLayer={0} />;
  },
};

/**
 * Story: Underground Cavern
 */
export const UndergroundCavern: Story = {
  render: () => {
    (globalThis as Record<string, unknown>).fetch = async (url: string) => {
      const match = url.match(/chunk\/([^/]+)\/(-?\d+)\/(-?\d+)\/(-?\d+)/);
      if (match && match[2] && match[3] && match[4]) {
        const [_fullMatch, _roomId, cx, cy, z] = match;
        return {
          json: async () =>
            createMockChunk({
              chunkX: parseInt(cx, 10),
              chunkY: parseInt(cy, 10),
              z: parseInt(z, 10),
              biome: 'mountains',
              pattern: 'cave',
              features: [
                { type: 'resource', subtype: 'diamond_ore', localX: 2, localY: 2 },
                { type: 'hazard', subtype: 'lava_pool', localX: 6, localY: 6 },
              ],
            }),
        };
      }
      return { json: async () => ({ chunks: [] }) };
    };

    return <InteractiveRenderer roomId="cavern-story" currentLayer={-3} />;
  },
};

/**
 * Story: Village Settlement
 */
export const VillageSettlement: Story = {
  render: () => {
    (globalThis as Record<string, unknown>).fetch = async (url: string) => {
      const match = url.match(/chunk\/([^/]+)\/(-?\d+)\/(-?\d+)\/(-?\d+)/);
      if (match && match[2] && match[3] && match[4]) {
        const [_fullMatch, _roomId, cx, cy, z] = match;
        return {
          json: async () =>
            createMockChunk({
              chunkX: parseInt(cx, 10),
              chunkY: parseInt(cy, 10),
              z: parseInt(z, 10),
              biome: 'plains',
              pattern: 'grass',
              features: [
                { type: 'structure_marker', subtype: 'village_house', localX: 2, localY: 2 },
                { type: 'structure_marker', subtype: 'village_house', localX: 5, localY: 2 },
                { type: 'structure_marker', subtype: 'blacksmith', localX: 3, localY: 6 },
                { type: 'npc', subtype: 'villager', localX: 4, localY: 4 },
              ],
            }),
        };
      }
      return { json: async () => ({ chunks: [] }) };
    };

    return <InteractiveRenderer roomId="village-story" currentLayer={0} />;
  },
};

/**
 * Story: Swamp with Creatures
 */
export const SwampCreatures: Story = {
  render: () => {
    (globalThis as Record<string, unknown>).fetch = async (url: string) => {
      const match = url.match(/chunk\/([^/]+)\/(-?\d+)\/(-?\d+)\/(-?\d+)/);
      if (match && match[2] && match[3] && match[4]) {
        const [_fullMatch, _roomId, cx, cy, z] = match;
        return {
          json: async () =>
            createMockChunk({
              chunkX: parseInt(cx, 10),
              chunkY: parseInt(cy, 10),
              z: parseInt(z, 10),
              biome: 'swamp',
              pattern: 'grass',
              features: [
                { type: 'creature', subtype: 'frog', localX: 1, localY: 3 },
                { type: 'creature', subtype: 'lizard', localX: 6, localY: 2 },
                { type: 'tree', subtype: 'dead_tree', localX: 4, localY: 5 },
              ],
            }),
        };
      }
      return { json: async () => ({ chunks: [] }) };
    };

    return <InteractiveRenderer roomId="swamp-story" currentLayer={0} />;
  },
};

/**
 * Story: Player with Vision Radius
 */
export const PlayerVisionRadius: Story = {
  render: () => {
    (globalThis as Record<string, unknown>).fetch = async (url: string) => {
      const match = url.match(/chunk\/([^/]+)\/(-?\d+)\/(-?\d+)\/(-?\d+)/);
      if (match && match[2] && match[3] && match[4]) {
        const [_fullMatch, _roomId, cx, cy, z] = match;
        return {
          json: async () =>
            createMockChunk({
              chunkX: parseInt(cx, 10),
              chunkY: parseInt(cy, 10),
              z: parseInt(z, 10),
              biome: 'forest',
              pattern: 'grass',
              features: [{ type: 'tree', subtype: 'oak_tree', localX: 3, localY: 3 }],
            }),
        };
      }
      return { json: async () => ({ chunks: [] }) };
    };

    return <InteractiveRenderer roomId="vision-story" currentLayer={0} playerPosition={{ x: 4, y: 4, z: 0 }} />;
  },
};

/**
 * Story: Multi-Layer View (z-layers)
 */
export const MultiLayerView: Story = {
  render: () => {
    const [layer, setLayer] = useState(0);

    (globalThis as Record<string, unknown>).fetch = async (url: string) => {
      const match = url.match(/chunk\/([^/]+)\/(-?\d+)\/(-?\d+)\/(-?\d+)/);
      if (match && match[2] && match[3] && match[4]) {
        const [_fullMatch, _roomId, cx, cy, z] = match;
        const zNum = parseInt(z, 10);

        // Different patterns per layer
        let pattern = 'grass';
        let biome = 'plains';

        if (zNum < 0) {
          pattern = 'cave';
          biome = 'mountains';
        } else if (zNum > 0) {
          pattern = 'grass';
          biome = 'void';
        }

        return {
          json: async () =>
            createMockChunk({
              chunkX: parseInt(cx, 10),
              chunkY: parseInt(cy, 10),
              z: zNum,
              biome,
              pattern,
              features: zNum === 0 ? [{ type: 'tree', subtype: 'oak_tree', localX: 4, localY: 4 }] : [],
            }),
        };
      }
      return { json: async () => ({ chunks: [] }) };
    };

    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm">Z-Layer:</span>
          <input
            type="range"
            min={-6}
            max={5}
            value={layer}
            onChange={(e) => setLayer(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm font-mono">{layer}</span>
        </div>
        <InteractiveRenderer roomId="multilayer-story" currentLayer={layer} />
      </div>
    );
  },
};

/**
 * Story: Jungle Dense Forest
 */
export const JungleDenseForest: Story = {
  render: () => {
    (globalThis as Record<string, unknown>).fetch = async (url: string) => {
      const match = url.match(/chunk\/([^/]+)\/(-?\d+)\/(-?\d+)\/(-?\d+)/);
      if (match && match[2] && match[3] && match[4]) {
        const [_fullMatch, _roomId, cx, cy, z] = match;

        // Dense tree coverage
        const treeFeatures = [];
        for (let y = 0; y < 8; y += 2) {
          for (let x = 0; x < 8; x += 2) {
            if (Math.random() > 0.3) {
              treeFeatures.push({
                type: 'tree',
                subtype: 'jungle_tree',
                localX: x,
                localY: y,
              });
            }
          }
        }

        return {
          json: async () =>
            createMockChunk({
              chunkX: parseInt(cx, 10),
              chunkY: parseInt(cy, 10),
              z: parseInt(z, 10),
              biome: 'jungle',
              pattern: 'grass',
              features: treeFeatures,
            }),
        };
      }
      return { json: async () => ({ chunks: [] }) };
    };

    return <InteractiveRenderer roomId="jungle-story" currentLayer={0} />;
  },
};

/**
 * Story: Mixed Biome Transition
 */
export const BiomeTransition: Story = {
  render: () => {
    (globalThis as Record<string, unknown>).fetch = async (url: string) => {
      const match = url.match(/chunk\/([^/]+)\/(-?\d+)\/(-?\d+)\/(-?\d+)/);
      if (match && match[2] && match[3] && match[4]) {
        const [_fullMatch, _roomId, cx, cy, z] = match;
        const chunkX = parseInt(cx, 10);

        // Left chunks = forest, right chunks = desert
        const isForest = chunkX < 0;

        return {
          json: async () =>
            createMockChunk({
              chunkX,
              chunkY: parseInt(cy, 10),
              z: parseInt(z, 10),
              biome: isForest ? 'forest' : 'desert',
              pattern: isForest ? 'grass' : 'desert',
              features: isForest ? [{ type: 'tree', subtype: 'oak_tree', localX: 4, localY: 4 }] : [],
            }),
        };
      }
      return { json: async () => ({ chunks: [] }) };
    };

    return <InteractiveRenderer roomId="transition-story" currentLayer={0} />;
  },
};
