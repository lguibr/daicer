import { PNG } from 'pngjs';
import { Chunk, Player, Creature, ZLevel } from '@daicer/engine';

/**
 * Generates a PNG representation of the map chunk with visibility logic (Fog of War)
 */
export async function generateMapImage(
  chunk: Chunk,
  players: Player[],
  creatures: Creature[],
  exploredTiles: Set<string>,
  center: { x: number; y: number },
  width: number = 32,
  height: number = 32
): Promise<Buffer> {
  const png = new PNG({ width, height });

  // 1. Calculate Visibility (Simple distance based for now)
  const visibleTiles = new Set<string>();
  const VISION_RADIUS = 8; // Grid units

  // Collect vision sources (players)
  const visionSources = players.map((p) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pos = (p as any).position || (p as any).characterSheet?.position || { x: 0, y: 0, z: 0 };
    return pos;
  });

  // Populate visible tiles
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const worldX = center.x - Math.floor(width / 2) + x;
      const worldY = center.y - Math.floor(height / 2) + y;
      const key = `${worldX},${worldY}`;

      // Check distance to any player
      for (const src of visionSources) {
        const dx = worldX - src.x;
        const dy = worldY - src.y;
        if (Math.sqrt(dx * dx + dy * dy) <= VISION_RADIUS) {
          visibleTiles.add(key);
          break;
        }
      }
    }
  }

  // 2. Render Map
  // Iterate pixels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const worldX = center.x - Math.floor(width / 2) + x;
      const worldY = center.y - Math.floor(height / 2) + y;
      const key = `${worldX},${worldY}`;

      const idx = (width * y + x) << 2;

      // Visibility Check
      const isVisible = visibleTiles.has(key);
      const isExplored = exploredTiles.has(key);

      // Default: Black (Unseen)
      let r = 0,
        g = 0,
        b = 0,
        a = 255;

      if (isVisible || isExplored) {
        // Get Tile Data from Chunk
        // Chunk is typically 32x32. We need to handle if the requested view spans multiple chunks?
        // For simplicity v1: We assume the view passed IS contained in the chunk or we only render what's in 'chunk'.
        // If we want a dynamic view centered on player potentially crossing chunk boundaries, we'd need multiple chunks.
        // BUT: The plan says "call getChunk".
        // Let's assume we render just the localized view provided by that single chunk for now,
        // OR we map world coords to 0..31 if we assume 1 chunk context.
        // Actually, the chunk passed has absolute coords logic? No, chunk is usually local 0..31 internal, but indexed by world pos.
        // Let's assume we are rendering the specific chunk data passed.
        // Map worldX to chunk local x.
        const lx = ((worldX % 32) + 32) % 32;
        const ly = ((worldY % 32) + 32) % 32;

        // Determine Z? We'll take the highest non-air or 0.
        // Or player Z.
        const z: ZLevel = 3; // Ground level default
        // Safe access
        const tile = chunk.tiles[z]?.[ly]?.[lx];

        if (tile) {
          // Color logic (aligned with MapRenderer)
          if (tile.block === 'water') {
            r = 30;
            g = 58;
            b = 138;
          } // #1e3a8a
          else if (tile.block === 'grass') {
            r = 20;
            g = 83;
            b = 45;
          } // #14532d
          else if (tile.block === 'stone') {
            r = 68;
            g = 64;
            b = 60;
          } // #44403c
          else if (tile.block === 'sand') {
            r = 217;
            g = 119;
            b = 6;
          } // #d97706
          else if (tile.block === 'snow') {
            r = 229;
            g = 231;
            b = 235;
          } // #e5e7eb
          else if (tile.block.includes('floor')) {
            r = 87;
            g = 83;
            b = 78;
          } // #57534e
          else if (tile.block.includes('wall')) {
            r = 120;
            g = 113;
            b = 108;
          } // #78716c
          else {
            r = 50;
            g = 50;
            b = 50;
          } // Default

          // Dim if explored but not visible
          if (!isVisible && isExplored) {
            r = Math.floor(r * 0.4);
            g = Math.floor(g * 0.4);
            b = Math.floor(b * 0.4);
          }
        }
      }

      // Draw Entities (Only if visible)
      if (isVisible) {
        // Players
        for (const p of players) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pos = (p as any).position || (p as any).characterSheet?.position;
          if (pos && Math.round(pos.x) === worldX && Math.round(pos.y) === worldY) {
            r = 0;
            g = 255;
            b = 0; // Green for Players
          }
        }
        // Creatures
        for (const c of creatures) {
          if (c.hp > 0 && Math.round(c.position.x) === worldX && Math.round(c.position.y) === worldY) {
            r = 255;
            g = 0;
            b = 0; // Red for Creatures
          }
        }
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  return PNG.sync.write(png);
}
