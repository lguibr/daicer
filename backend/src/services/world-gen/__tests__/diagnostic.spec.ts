/**
 * World Map Rendering Diagnostic Tool
 * Run this to test the full pipeline: generation → socket → rendering
 */

import { describe, it, expect } from '@jest/globals';
import { generateChunk } from '../worldGenService';
import type { WorldGenerationParams } from '../worldGenService';

describe('World Map Rendering Pipeline Diagnostic', () => {
  it('should generate chunk with renderable surface tiles', () => {
    const params: WorldGenerationParams = {
      seed: 'diagnostic-test',
      width: 256,
      height: 256,
      depth: 21,
      waterLevel: -0.5,
      mountainousness: 0.5,
      jaggedness: 0.5,
      temperature: 0,
      moisture: 0,
      continentalness: 0,
      erosion: 0,
      weirdness: 0,
      caveFrequency: 0,
      oreDistribution: {},
    };

    console.log('\n=== DIAGNOSTIC: Generating chunk for rendering ===\n');

    const chunk = generateChunk('diagnostic-test', 0, 0, 0, params);

    console.log('📦 Generated chunk:', {
      chunkX: chunk.chunkX,
      chunkY: chunk.chunkY,
      chunkZ: chunk.chunkZ,
      totalTiles: chunk.tiles.length,
      biomes: Array.from(chunk.biomes),
    });

    // Analyze surface tiles (what gets sent to frontend)
    // This is the EXACT logic from worldChunks.ts - pick topmost non-air tile per (x,y)
    const tileMap = new Map();
    for (const tile of chunk.tiles) {
      const key = `${tile.x},${tile.y}`;
      const existing = tileMap.get(key);
      if (tile.blockType !== 'air') {
        if (!existing || tile.z > existing.z) {
          tileMap.set(key, tile);
        }
      }
    }
    const surfaceTiles = Array.from(tileMap.values());

    console.log('\n🎨 Surface tiles for rendering:', {
      total: surfaceTiles.length,
      percentage: ((surfaceTiles.length / chunk.tiles.length) * 100).toFixed(2) + '%',
    });

    // Sample first 5 tiles
    console.log('\n📍 Sample tiles (first 5):');
    surfaceTiles.slice(0, 5).forEach((tile, i) => {
      console.log(
        `  ${i + 1}. x:${tile.x} y:${tile.y} z:${tile.z} biome:${tile.biome} elevation:${tile.elevation.toFixed(2)}`
      );
    });

    // Analyze biome distribution
    const biomeCount: Record<string, number> = {};
    surfaceTiles.forEach((tile) => {
      biomeCount[tile.biome] = (biomeCount[tile.biome] || 0) + 1;
    });

    console.log('\n🌍 Biome distribution:');
    Object.entries(biomeCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([biome, count]) => {
        const pct = ((count / surfaceTiles.length) * 100).toFixed(1);
        console.log(`  ${biome}: ${count} tiles (${pct}%)`);
      });

    // Check elevation range
    const elevations = surfaceTiles.map((t) => t.elevation);
    const minElev = Math.min(...elevations);
    const maxElev = Math.max(...elevations);
    const avgElev = elevations.reduce((sum, e) => sum + e, 0) / elevations.length;

    console.log('\n⛰️  Elevation stats:');
    console.log(`  Min: ${minElev.toFixed(2)}`);
    console.log(`  Max: ${maxElev.toFixed(2)}`);
    console.log(`  Avg: ${avgElev.toFixed(2)}`);
    console.log(`  Range: ${(maxElev - minElev).toFixed(2)}`);

    // Simulate canvas rendering
    console.log('\n🖼️  Simulating canvas rendering...');

    const TILE_SIZE = 4;
    const zoom = 1.0;
    const viewOffset = { x: 0, y: 0 };

    let renderedCount = 0;
    let outOfBoundsCount = 0;
    const canvasWidth = 800;
    const canvasHeight = 600;

    surfaceTiles.forEach((tile) => {
      const screenX = tile.x * TILE_SIZE * zoom + viewOffset.x;
      const screenY = tile.y * TILE_SIZE * zoom + viewOffset.y;

      if (screenX >= -TILE_SIZE && screenX <= canvasWidth && screenY >= -TILE_SIZE && screenY <= canvasHeight) {
        renderedCount++;
      } else {
        outOfBoundsCount++;
      }
    });

    console.log(`  Tiles in viewport: ${renderedCount}`);
    console.log(`  Tiles out of bounds: ${outOfBoundsCount}`);

    // Mock biome colors (from WorldCanvas)
    const BIOME_COLORS: Record<string, string> = {
      ocean: '#3f76e4',
      plains: '#91bd59',
      forest: '#79c05a',
      desert: '#f5deb3',
      mountains: '#8ab689',
      taiga: '#86b776',
      void: '#0f0a1e',
    };

    console.log('\n🎨 Biome colors check:');
    Object.keys(biomeCount).forEach((biome) => {
      const color = BIOME_COLORS[biome] || '#888888';
      console.log(`  ${biome}: ${color}${color === '#888888' ? ' ⚠️  FALLBACK COLOR!' : ''}`);
    });

    // Verify brightness calculation
    console.log('\n💡 Brightness calculation (sample):');
    const sampleTile = surfaceTiles[0];
    const brightness = 0.6 + ((sampleTile.elevation + 100) / 200) * 0.4;
    console.log(`  Elevation: ${sampleTile.elevation.toFixed(2)}`);
    console.log(`  Brightness factor: ${brightness.toFixed(3)} (0.6 to 1.0 range)`);

    console.log('\n=== DIAGNOSTIC COMPLETE ===\n');

    // Assertions
    expect(chunk.tiles.length).toBeGreaterThan(0);
    expect(surfaceTiles.length).toBeGreaterThan(0);
    expect(chunk.biomes.size).toBeGreaterThan(0);
    expect(renderedCount).toBeGreaterThan(0);
  });

  it('should generate chunk that matches socket handler filtering', () => {
    const params: WorldGenerationParams = {
      seed: 'socket-filter-test',
      width: 32,
      height: 32,
      depth: 21,
      waterLevel: -0.5,
      mountainousness: 0.5,
      jaggedness: 0.5,
      temperature: 0,
      moisture: 0,
      continentalness: 0,
      erosion: 0,
      weirdness: 0,
      caveFrequency: 0,
      oreDistribution: {},
    };

    const chunk = generateChunk('socket-filter-test', 0, 0, 0, params);

    // This is the EXACT logic used in worldChunks.ts
    const tileMap = new Map();
    for (const tile of chunk.tiles) {
      const key = `${tile.x},${tile.y}`;
      const existing = tileMap.get(key);
      if (tile.blockType !== 'air') {
        if (!existing || tile.z > existing.z) {
          tileMap.set(key, tile);
        }
      }
    }
    const surfaceTiles = Array.from(tileMap.values()).map((tile: any) => ({
      x: tile.x,
      y: tile.y,
      z: tile.z,
      biome: tile.biome,
      elevation: tile.elevation,
    }));

    console.log('\n🔍 Socket handler filter test:');
    console.log(`  Total tiles generated: ${chunk.tiles.length}`);
    console.log(`  After surface filter: ${surfaceTiles.length}`);
    console.log(`  Filter kept: ${((surfaceTiles.length / chunk.tiles.length) * 100).toFixed(1)}%`);

    // The filter should give us 1 tile per (x,y) position = CHUNK_SIZE * CHUNK_SIZE
    // For 32x32 chunk with 12288 total 3D tiles, we expect surface tiles
    expect(surfaceTiles.length).toBeGreaterThan(50);
    expect(surfaceTiles.length / chunk.tiles.length).toBeGreaterThan(0.004); // At least 0.4%
  });
});
