import { BiomeType, BlockType, Chunk, Coordinates, Tile, WorldConfig, ZLevel } from '../types';
import { Alea, FastNoise } from './math';
import { CHUNK_SIZE } from '../constants';

interface StructureInfo {
  type: 'city' | 'castle' | 'tower' | 'dungeon' | 'none';
  worldX: number;
  worldY: number;
  size: number;
  seed: string;
}

export class WorldGenerator {
  private noiseElevation: FastNoise;
  private noiseMoisture: FastNoise;
  private noiseCaves: FastNoise;
  private rng: Alea;
  private config: WorldConfig;
  private chunkCache: Map<string, Chunk> = new Map();

  constructor(config: WorldConfig) {
    this.config = config;
    this.rng = new Alea(config.seed);
    this.noiseElevation = new FastNoise(config.seed + '_elev');
    this.noiseMoisture = new FastNoise(config.seed + '_moist');
    this.noiseCaves = new FastNoise(config.seed + '_caves');
  }

  public getChunk(chunkX: number, chunkY: number): Chunk {
    const key = `${chunkX},${chunkY}`;
    if (this.chunkCache.has(key)) return this.chunkCache.get(key)!;

    const chunk = this.generateChunkData(chunkX, chunkY);
    if (this.chunkCache.size > 200) {
      const firstKey = this.chunkCache.keys().next().value;
      this.chunkCache.delete(firstKey);
    }
    this.chunkCache.set(key, chunk);
    return chunk;
  }

  // --- 1. CORE CHUNK GENERATION ---
  private generateChunkData(chunkX: number, chunkY: number): Chunk {
    const size = this.config.chunkSize;
    const worldOffsetX = chunkX * size;
    const worldOffsetY = chunkY * size;

    // Initialize 7-layer grid
    const tiles: Tile[][][] = Array(7).fill(null).map(() => 
      Array(size).fill(null).map(() => Array(size).fill(null))
    );

    // A. Base Terrain Generation
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const wx = worldOffsetX + x;
        const wy = worldOffsetY + y;
        
        // Noise Calculations
        const nx = wx * this.config.globalScale;
        const ny = wy * this.config.globalScale;
        const elev = this.noiseElevation.fbm(nx * this.config.elevationScale, ny * this.config.elevationScale, Math.floor(this.config.detail), this.config.roughness);
        const moist = this.noiseMoisture.fbm(nx * this.config.moistureScale, ny * this.config.moistureScale, 2);

        const { biome, surfaceBlock } = this.determineBiome(elev, moist);

        // Z=0 (Surface)
        tiles[3][y][x] = this.createTile(wx, wy, 0, surfaceBlock, biome);

        // Z<0 (Underground)
        for (let zIndex = 2; zIndex >= 0; zIndex--) {
           const realZ = (zIndex - 3) as ZLevel;
           const block = (realZ === -3 && this.rng.next() > 0.5) ? BlockType.BEDROCK : BlockType.STONE;
           tiles[zIndex][y][x] = this.createTile(wx, wy, realZ, block, biome);
        }

        // Z>0 (Sky)
        for (let zIndex = 4; zIndex <= 6; zIndex++) {
           tiles[zIndex][y][x] = this.createTile(wx, wy, (zIndex - 3) as ZLevel, BlockType.AIR, biome);
        }
      }
    }

    // B. Apply Roads & Structures (Deterministically)
    this.applyCivilization(chunkX, chunkY, tiles, worldOffsetX, worldOffsetY);

    return { x: chunkX, y: chunkY, tiles };
  }

  // --- 2. CIVILIZATION LAYER (Roads & Structures) ---
  private applyCivilization(chunkX: number, chunkY: number, tiles: Tile[][][], wOffX: number, wOffY: number) {
    // Determine the logical "Grid Region" for structures
    const regionSize = Math.max(1, Math.floor(this.config.structureSpacing)) * this.config.chunkSize;
    
    // Check overlapping and adjacent regions
    const currentRegionX = Math.floor(wOffX / regionSize);
    const currentRegionY = Math.floor(wOffY / regionSize);

    // We scan 3x3 regions to ensure roads crossing chunks are drawn
    for (let ry = currentRegionY - 1; ry <= currentRegionY + 1; ry++) {
      for (let rx = currentRegionX - 1; rx <= currentRegionX + 1; rx++) {
        const struct = this.getRegionStructure(rx, ry, regionSize);
        if (struct.type === 'none') continue;

        // 1. Draw Roads Connecting this structure to neighbors
        this.connectStructureToNeighbors(struct, rx, ry, regionSize, tiles, wOffX, wOffY);

        // 2. Render Structure (if it overlaps this chunk)
        if (this.intersects(wOffX, wOffY, this.config.chunkSize, struct.worldX, struct.worldY, struct.size)) {
           this.renderStructure(struct, tiles, wOffX, wOffY);
        }
      }
    }
  }

  // --- 3. DETERMINISTIC STRUCTURE INFO ---
  private getRegionStructure(regionX: number, regionY: number, regionSize: number): StructureInfo {
    // Unique seed for this region's structure
    const seed = `${this.config.seed}_reg_${regionX}_${regionY}`;
    const rng = new Alea(seed);
    
    // Chance check
    if (rng.next() > this.config.structureChance) {
      return { type: 'none', worldX: 0, worldY: 0, size: 0, seed };
    }

    // Position: Center-biased random within region
    const padding = 20;
    const availableSize = Math.max(10, regionSize - (padding * 2));
    const offsetX = Math.floor(rng.next() * availableSize) + padding;
    const offsetY = Math.floor(rng.next() * availableSize) + padding;
    
    const worldX = (regionX * regionSize) + offsetX;
    const worldY = (regionY * regionSize) + offsetY;

    // Type Selection (Weighted)
    const roll = rng.next();
    let type: StructureInfo['type'] = 'tower';
    let baseSize = this.config.structureSizeAvg;

    if (roll < 0.25) { 
        type = 'city'; 
        baseSize = Math.floor(baseSize * 3); 
    } else if (roll < 0.45) { 
        type = 'castle'; 
        baseSize = Math.floor(baseSize * 2.5); 
    } else if (roll < 0.70) { 
        type = 'dungeon'; 
        baseSize = Math.floor(baseSize * 1.5); 
    } else { 
        type = 'tower'; 
        baseSize = Math.floor(baseSize * 1.2); 
    }

    // Clamp size logic
    const size = Math.min(regionSize - 4, Math.max(8, baseSize));

    return { type, worldX, worldY, size, seed };
  }

  // --- 4. ROAD GENERATION ---
  private connectStructureToNeighbors(
    source: StructureInfo, rx: number, ry: number, regionSize: number, 
    tiles: Tile[][][], chunkOffX: number, chunkOffY: number
  ) {
    // Connect to East (rx+1) and South (ry+1) neighbors
    const neighbors = [
      { dx: 1, dy: 0 }, // East
      { dx: 0, dy: 1 }, // South
    ];

    const rng = new Alea(source.seed + "_roads");

    for (const n of neighbors) {
      // Chance to have road
      if (rng.next() > this.config.roadDensity) continue;

      const target = this.getRegionStructure(rx + n.dx, ry + n.dy, regionSize);
      if (target.type !== 'none') {
        this.rasterizeRoad(
          source.worldX + Math.floor(source.size/2), 
          source.worldY + Math.floor(source.size/2),
          target.worldX + Math.floor(target.size/2), 
          target.worldY + Math.floor(target.size/2),
          tiles, chunkOffX, chunkOffY
        );
      }
    }
  }

  private rasterizeRoad(x0: number, y0: number, x1: number, y1: number, tiles: Tile[][][], cx: number, cy: number) {
    // Bresenham's Line Algorithm
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0;
    let y = y0;

    const brushSize = 1; // Radius 1 = 3x3 width roughly

    while (true) {
      // Draw Brush (3x3) around point
      for(let by = -brushSize; by <= brushSize; by++) {
          for(let bx = -brushSize; bx <= brushSize; bx++) {
              const wx = x + bx;
              const wy = y + by;
              const lx = wx - cx;
              const ly = wy - cy;

              if (lx >= 0 && lx < this.config.chunkSize && ly >= 0 && ly < this.config.chunkSize) {
                // Carve Road on Surface
                if (tiles[3][ly][lx].block !== BlockType.WATER) {
                    tiles[3][ly][lx].block = BlockType.FLOOR_STONE;
                    // Clear vegetation above
                    tiles[4][ly][lx].block = BlockType.AIR; 
                    tiles[5][ly][lx].block = BlockType.AIR;
                } else {
                    // Bridge over water
                    tiles[3][ly][lx].block = BlockType.FLOOR_WOOD;
                }
              }
          }
      }

      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }

  // --- 5. STRUCTURE RENDERING ---
  private renderStructure(struct: StructureInfo, tiles: Tile[][][], cx: number, cy: number) {
    switch(struct.type) {
      case 'city': this.generateCity(struct, tiles, cx, cy); break;
      case 'castle': this.generateCastle(struct, tiles, cx, cy); break;
      case 'tower': this.generateTower(struct, tiles, cx, cy); break;
      case 'dungeon': this.generateDungeon(struct, tiles, cx, cy); break;
    }
  }

  private generateCity(s: StructureInfo, tiles: Tile[][][], cx: number, cy: number) {
    const rng = new Alea(s.seed);
    const buildingCount = Math.floor(s.size / 4); 
    
    // Main Plaza
    const centerSize = Math.floor(s.size * 0.3);
    const cxStart = Math.floor(s.size/2) - Math.floor(centerSize/2);
    for(let y=0; y<centerSize; y++) {
      for(let x=0; x<centerSize; x++) {
        this.setBlock(tiles, cx, cy, s.worldX + cxStart + x, s.worldY + cxStart + y, 0, BlockType.FLOOR_STONE);
      }
    }
    
    // Buildings around
    for(let i=0; i<buildingCount; i++) {
        const bx = Math.floor(rng.next() * (s.size - 6));
        const by = Math.floor(rng.next() * (s.size - 6));
        const bSize = 4 + Math.floor(rng.next() * 3);
        
        // Don't overwrite plaza mostly
        if (Math.abs(bx - cxStart) < centerSize && Math.abs(by - cxStart) < centerSize) continue;

        const material = rng.next() > 0.5 ? 'wood' : 'stone';
        this.stampBuilding(tiles, cx, cy, s.worldX + bx, s.worldY + by, bSize, 2, material);
    }
  }

  private generateCastle(s: StructureInfo, tiles: Tile[][][], cx: number, cy: number) {
     // Outer Walls
     this.stampBuilding(tiles, cx, cy, s.worldX, s.worldY, s.size, 3, 'stone', true);
     
     // Central Keep (Higher)
     const keepSize = Math.floor(s.size / 2);
     const keepOff = Math.floor((s.size - keepSize) / 2);
     this.stampBuilding(tiles, cx, cy, s.worldX + keepOff, s.worldY + keepOff, keepSize, 5, 'stone');

     // Entrance
     const doorX = s.worldX + Math.floor(s.size/2);
     const doorY = s.worldY + s.size - 1;
     this.setBlock(tiles, cx, cy, doorX, doorY, 0, BlockType.DOOR);
     this.setBlock(tiles, cx, cy, doorX, doorY, 1, BlockType.AIR); // Archway
  }

  private generateTower(s: StructureInfo, tiles: Tile[][][], cx: number, cy: number) {
     this.stampBuilding(tiles, cx, cy, s.worldX, s.worldY, s.size, 6, 'stone');
     
     const midX = Math.floor(s.size/2);
     const midY = Math.floor(s.size/2);

     // Alternating stair pattern for Towers (0 to 3)
     for(let z=0; z<=3; z++) {
         const wx = s.worldX + midX;
         const wy = s.worldY + midY;
         
         // Even floors (0, 2): UP at center, DOWN at center+1
         // Odd floors (1, 3): DOWN at center, UP at center+1
         
         if (z % 2 === 0) {
            // Even Level (e.g. 0): Go UP at Center
            if (z < 3) this.setBlock(tiles, cx, cy, wx, wy, z, BlockType.STAIRS_UP);
            // Receive DOWN from Z+1 at Center+1 (must be clear or have stair)
            if (z > 0) this.setBlock(tiles, cx, cy, wx+1, wy, z, BlockType.STAIRS_DOWN);
         } else {
            // Odd Level (e.g. 1): Go DOWN at Center
            this.setBlock(tiles, cx, cy, wx, wy, z, BlockType.STAIRS_DOWN);
            // Go UP at Center+1
            if (z < 3) this.setBlock(tiles, cx, cy, wx+1, wy, z, BlockType.STAIRS_UP);
         }
     }
  }

  private generateDungeon(s: StructureInfo, tiles: Tile[][][], cx: number, cy: number) {
     // Surface Ruin (Broken walls)
     this.stampBuilding(tiles, cx, cy, s.worldX, s.worldY, s.size, 2, 'stone', true);
     
     const midX = Math.floor(s.size/2);
     const midY = Math.floor(s.size/2);
     const wx = s.worldX + midX;
     const wy = s.worldY + midY;

     // Surface Entrance
     this.setBlock(tiles, cx, cy, wx, wy, 0, BlockType.STAIRS_DOWN);

     // Underground Maze (Z-1 to Z-3)
     const caveRng = new Alea(s.seed + "_maze");
     
     for(let z=-1; z>=-3; z--) {
       // Carve Rooms first to ensure space
       const roomCount = 3 + Math.floor(caveRng.next() * 4);
       for(let i=0; i<roomCount; i++) {
         const rw = 5 + Math.floor(caveRng.next() * 8);
         const rh = 5 + Math.floor(caveRng.next() * 8);
         // Bias rooms towards center where stairs are
         const rx = s.worldX + Math.floor(caveRng.next() * (s.size - rw));
         const ry = s.worldY + Math.floor(caveRng.next() * (s.size - rh));
         this.carveRoom(tiles, cx, cy, rx, ry, rw, rh, z);
       }
       
       // Force clear area around stairs
       this.carveRoom(tiles, cx, cy, wx-1, wy-1, 3, 3, z);

       // Stair Logic (Alternating)
       // Surface (0) connects to -1 at Center (wx, wy)
       // So -1 needs UP at Center.
       
       const depth = Math.abs(z); // 1, 2, 3

       if (depth % 2 === 1) { // Odd depth (-1, -3)
           // -1: UP at Center (to 0), DOWN at Center+1 (to -2)
           this.setBlock(tiles, cx, cy, wx, wy, z, BlockType.STAIRS_UP);
           if (z > -3) this.setBlock(tiles, cx, cy, wx+1, wy, z, BlockType.STAIRS_DOWN);
       } else { // Even depth (-2)
           // -2: DOWN at Center (to -3?), wait.
           // Connectivity:
           // 0: Down(A)
           // -1: Up(A), Down(B)
           // -2: Up(B), Down(A) -> Alternating positions A and B
           
           // A = Center (wx, wy)
           // B = Center+1 (wx+1, wy)
           
           // -2 needs UP at B (to connect to -1 Down(B))
           this.setBlock(tiles, cx, cy, wx+1, wy, z, BlockType.STAIRS_UP);
           if (z > -3) this.setBlock(tiles, cx, cy, wx, wy, z, BlockType.STAIRS_DOWN);
       }
     }
  }

  // --- UTILS ---

  private stampBuilding(
      tiles: Tile[][][], cx: number, cy: number, 
      wx: number, wy: number, size: number, height: number, 
      mat: 'wood' | 'stone', hollow = false
  ) {
    const wall = mat === 'wood' ? BlockType.WALL_WOOD : BlockType.WALL_STONE;
    const floor = mat === 'wood' ? BlockType.FLOOR_WOOD : BlockType.FLOOR_STONE;

    for (let z = 0; z < height; z++) {
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const isEdge = x === 0 || x === size - 1 || y === 0 || y === size - 1;
                if (hollow && !isEdge && z < height-1) {
                    if (z === 0) this.setBlock(tiles, cx, cy, wx+x, wy+y, z, floor);
                    continue;
                }
                const blk = isEdge ? wall : floor;
                if (hollow && z===height-1 && !isEdge) continue;

                this.setBlock(tiles, cx, cy, wx+x, wy+y, z, blk);
            }
        }
    }
    // Simple Door
    this.setBlock(tiles, cx, cy, wx + Math.floor(size/2), wy + size - 1, 0, BlockType.DOOR);
  }

  private carveRoom(tiles: Tile[][][], cx: number, cy: number, wx: number, wy: number, w: number, h: number, z: number) {
      for(let y=0; y<h; y++) {
          for(let x=0; x<w; x++) {
              this.setBlock(tiles, cx, cy, wx+x, wy+y, z, BlockType.FLOOR_STONE);
          }
      }
  }

  private setBlock(tiles: Tile[][][], cx: number, cy: number, wx: number, wy: number, z: number, block: BlockType) {
      const lx = wx - cx;
      const ly = wy - cy;
      const lz = z + 3; // Map -3..3 to 0..6
      if (lx >= 0 && lx < CHUNK_SIZE && ly >= 0 && ly < CHUNK_SIZE && lz >= 0 && lz <= 6) {
          const t = tiles[lz][ly][lx];
          t.block = block;
          t.isWalkable = [BlockType.FLOOR_STONE, BlockType.FLOOR_WOOD, BlockType.STAIRS_UP, BlockType.STAIRS_DOWN, BlockType.DOOR].includes(block);
          t.isTransparent = t.isWalkable;
      }
  }

  private intersects(x1: number, y1: number, s1: number, x2: number, y2: number, s2: number): boolean {
      return x1 < x2 + s2 && x1 + s1 > x2 && y1 < y2 + s2 && y1 + s1 > y2;
  }

  private determineBiome(elev: number, moist: number): { biome: BiomeType, surfaceBlock: BlockType } {
    if (elev < this.config.seaLevel) return { biome: BiomeType.OCEAN, surfaceBlock: BlockType.WATER };
    if (elev < this.config.seaLevel + 0.05) return { biome: BiomeType.BEACH, surfaceBlock: BlockType.SAND };
    const adjustedMoist = moist + (this.config.temperatureOffset * 0.5);
    if (elev > 0.6) return { biome: BiomeType.SNOWY_PEAKS, surfaceBlock: BlockType.SNOW };
    if (elev > 0.4) return { biome: BiomeType.MOUNTAIN, surfaceBlock: BlockType.STONE };
    if (adjustedMoist < -0.2) return { biome: BiomeType.DESERT, surfaceBlock: BlockType.SAND };
    if (adjustedMoist > 0.2) return { biome: BiomeType.FOREST, surfaceBlock: BlockType.GRASS };
    return { biome: BiomeType.PLAINS, surfaceBlock: BlockType.GRASS };
  }

  private createTile(x: number, y: number, z: ZLevel, block: BlockType, biome: BiomeType): Tile {
    const isTransparent = [
        BlockType.AIR, BlockType.WATER, BlockType.DOOR, BlockType.GRASS, BlockType.DIRT,
        BlockType.SAND, BlockType.SNOW, BlockType.FLOOR_WOOD, BlockType.FLOOR_STONE,
        BlockType.TREE_LEAVES, BlockType.CACTUS, BlockType.STAIRS_UP, BlockType.STAIRS_DOWN
    ].includes(block);

    const isWalkable = [
        BlockType.FLOOR_WOOD, BlockType.FLOOR_STONE,
        BlockType.GRASS, BlockType.DIRT, BlockType.SAND, BlockType.SNOW, BlockType.DOOR,
        BlockType.STAIRS_UP, BlockType.STAIRS_DOWN, BlockType.WATER 
    ].includes(block);

    return { x, y, z, block, biome, isWalkable, isTransparent, variant: this.rng.next() };
  }
}
