/**
 * GridMapRenderer - Comprehensive Storybook Showcase
 * Demonstrates all grid features: biomes, algorithms, transitions, z-layers
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { GridChunk, GridTile, GridFeature } from '@daicer/shared';
import { GridMapRenderer } from './GridMapRenderer';
import { TileMetadataPanel } from './TileMetadataPanel';
import {
  createEmptyChunk,
  createBiomeChunk,
  createTransitionChunk,
  createMockFetch,
  createChunkGrid,
} from './story-helpers';

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
 * Interactive wrapper with tile selection
 */
interface InteractiveRendererProps {
  roomId: string;
  currentLayer: number;
  chunks: Record<string, GridChunk>;
}

function InteractiveRenderer({ roomId, currentLayer, chunks }: InteractiveRendererProps) {
  const [selectedTile, setSelectedTile] = useState<GridTile | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<GridFeature[]>([]);

  // Install mock fetch
  (globalThis as Record<string, unknown>).fetch = createMockFetch(chunks);

  return (
    <div className="relative">
      <GridMapRenderer
        roomId={roomId}
        currentLayer={currentLayer}
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
 * CATEGORY 1: FUNDAMENTALS
 */

export const EmptyGrid: Story = {
  render: () => {
    const chunks = createChunkGrid((cx, cy, z) => createEmptyChunk(cx, cy, z));
    return <InteractiveRenderer roomId="empty-grid" currentLayer={0} chunks={chunks} />;
  },
};

export const SingleBiomePlains: Story = {
  render: () => {
    const chunks = createChunkGrid((cx, cy, z) => createBiomeChunk(cx, cy, z, 'plains'));
    return <InteractiveRenderer roomId="plains" currentLayer={0} chunks={chunks} />;
  },
};

/**
 * CATEGORY 2: ALL BIOMES SHOWCASE
 */

export const AllBiomes: Story = {
  render: () => {
    const biomes = [
      'ocean',
      'deep_ocean',
      'frozen_ocean',
      'beach',
      'plains',
      'forest',
      'birch_forest',
      'dark_forest',
      'jungle',
      'savanna',
      'desert',
      'badlands',
      'mountains',
      'snowy_peaks',
      'tundra',
      'taiga',
      'snowy_taiga',
      'swamp',
      'mushroom_fields',
    ];

    const chunks: Record<string, GridChunk> = {};
    let biomeIndex = 0;

    for (let cy = -2; cy <= 2; cy++) {
      for (let cx = -2; cx <= 2; cx++) {
        const biome = biomes[biomeIndex % biomes.length];
        chunks[`${cx}_${cy}_0`] = createBiomeChunk(cx, cy, 0, biome);
        biomeIndex++;
      }
    }

    (globalThis as Record<string, unknown>).fetch = createMockFetch(chunks);

    return (
      <div className="space-y-4 p-4">
        <h2 className="text-xl font-bold">All 17 Biomes</h2>
        <p className="text-sm text-muted-foreground">Each chunk shows a different biome. Pan to see all!</p>
        <GridMapRenderer roomId="all-biomes" currentLayer={0} />
      </div>
    );
  },
};

/**
 * CATEGORY 3: BIOME TRANSITIONS
 */

export const OceanToBeach: Story = {
  render: () => {
    const chunks = createChunkGrid((cx, cy, z) => createTransitionChunk(cx, cy, z, 'ocean', 'beach', 'x'));
    return <InteractiveRenderer roomId="ocean-beach" currentLayer={0} chunks={chunks} />;
  },
};

export const ForestToDesert: Story = {
  render: () => {
    const chunks = createChunkGrid((cx, cy, z) => createTransitionChunk(cx, cy, z, 'forest', 'desert', 'x'));
    return <InteractiveRenderer roomId="forest-desert" currentLayer={0} chunks={chunks} />;
  },
};

export const PlainsToMountains: Story = {
  render: () => {
    const chunks = createChunkGrid((cx, cy, z) => createTransitionChunk(cx, cy, z, 'plains', 'mountains', 'y'));
    return <InteractiveRenderer roomId="plains-mountains" currentLayer={0} chunks={chunks} />;
  },
};

export const TundraToTaiga: Story = {
  render: () => {
    const chunks = createChunkGrid((cx, cy, z) => createTransitionChunk(cx, cy, z, 'tundra', 'taiga', 'y'));
    return <InteractiveRenderer roomId="tundra-taiga" currentLayer={0} chunks={chunks} />;
  },
};

/**
 * CATEGORY 4: INDIVIDUAL BIOME SHOWCASES
 */

export const Ocean: Story = {
  render: () => {
    const chunks = createChunkGrid((cx, cy, z) => createBiomeChunk(cx, cy, z, 'ocean'));
    return <InteractiveRenderer roomId="ocean" currentLayer={0} chunks={chunks} />;
  },
};

export const Desert: Story = {
  render: () => {
    const chunks = createChunkGrid((cx, cy, z) => createBiomeChunk(cx, cy, z, 'desert'));
    return <InteractiveRenderer roomId="desert" currentLayer={0} chunks={chunks} />;
  },
};

export const Forest: Story = {
  render: () => {
    const chunks = createChunkGrid((cx, cy, z) => createBiomeChunk(cx, cy, z, 'forest'));
    return <InteractiveRenderer roomId="forest" currentLayer={0} chunks={chunks} />;
  },
};

export const Mountains: Story = {
  render: () => {
    const chunks = createChunkGrid((cx, cy, z) => createBiomeChunk(cx, cy, z, 'mountains'));
    return <InteractiveRenderer roomId="mountains" currentLayer={0} chunks={chunks} />;
  },
};

export const Jungle: Story = {
  render: () => {
    const chunks = createChunkGrid((cx, cy, z) => createBiomeChunk(cx, cy, z, 'jungle'));
    return <InteractiveRenderer roomId="jungle" currentLayer={0} chunks={chunks} />;
  },
};

export const SnowyPeaks: Story = {
  render: () => {
    const chunks = createChunkGrid((cx, cy, z) => createBiomeChunk(cx, cy, z, 'snowy_peaks'));
    return <InteractiveRenderer roomId="snowy-peaks" currentLayer={0} chunks={chunks} />;
  },
};

export const Swamp: Story = {
  render: () => {
    const chunks = createChunkGrid((cx, cy, z) => createBiomeChunk(cx, cy, z, 'swamp'));
    return <InteractiveRenderer roomId="swamp" currentLayer={0} chunks={chunks} />;
  },
};

export const MushroomFields: Story = {
  render: () => {
    const chunks = createChunkGrid((cx, cy, z) => createBiomeChunk(cx, cy, z, 'mushroom_fields'));
    return <InteractiveRenderer roomId="mushroom" currentLayer={0} chunks={chunks} />;
  },
};

/**
 * CATEGORY 5: Z-LAYER SHOWCASE
 */

export const MultiLayer: Story = {
  render: () => {
    const [layer, setLayer] = useState(0);

    const chunks: Record<string, GridChunk> = {};

    // Create chunks for multiple z-layers
    for (let z = -3; z <= 3; z++) {
      for (let cy = -1; cy <= 1; cy++) {
        for (let cx = -1; cx <= 1; cx++) {
          if (z < 0) {
            // Underground - stone/caves
            chunks[`${cx}_${cy}_${z}`] = createBiomeChunk(cx, cy, z, 'mountains');
          } else if (z === 0) {
            // Surface - varied biomes
            chunks[`${cx}_${cy}_${z}`] = createBiomeChunk(cx, cy, z, 'forest');
          } else {
            // Sky - air
            chunks[`${cx}_${cy}_${z}`] = createEmptyChunk(cx, cy, z);
          }
        }
      }
    }

    (globalThis as Record<string, unknown>).fetch = createMockFetch(chunks);

    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Z-Layer:</span>
          <input
            type="range"
            min={-3}
            max={3}
            value={layer}
            onChange={(e) => setLayer(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm font-mono">{layer}</span>
          <span className="text-xs text-muted-foreground">
            {layer < 0 ? '⛏️ Underground' : layer === 0 ? '🌍 Surface' : '☁️ Sky'}
          </span>
        </div>
        <GridMapRenderer roomId="multilayer" currentLayer={layer} />
      </div>
    );
  },
};

/**
 * LEGACY STORIES (kept for compatibility)
 */

export const ForestBiome: Story = {
  render: () => {
    const chunks = createChunkGrid((cx, cy, z) => createBiomeChunk(cx, cy, z, 'forest'));
    return <InteractiveRenderer roomId="forest-biome" currentLayer={0} chunks={chunks} />;
  },
};

export const DesertRuins: Story = {
  render: () => {
    const chunks = createChunkGrid((cx, cy, z) => createBiomeChunk(cx, cy, z, 'desert'));
    return <InteractiveRenderer roomId="desert-ruins" currentLayer={0} chunks={chunks} />;
  },
};

export const MountainTerrain: Story = {
  render: () => {
    const chunks = createChunkGrid((cx, cy, z) => createBiomeChunk(cx, cy, z, 'mountains'));
    return <InteractiveRenderer roomId="mountain-terrain" currentLayer={0} chunks={chunks} />;
  },
};
