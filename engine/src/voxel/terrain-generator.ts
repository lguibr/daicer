import { Alea, FastNoise } from './utils/math';
import { Tile, BlockType, BiomeType, ZLevel, WorldConfig } from '../types';

export class TerrainGenerator {
  private noiseElevation: FastNoise;
  private noiseMoisture: FastNoise;
  private rng: Alea;
  public config: WorldConfig;

  constructor(config: WorldConfig) {
    this.config = config;
    this.rng = new Alea(config.seed);
    this.noiseElevation = new FastNoise(config.seed + '_elev');
    this.noiseMoisture = new FastNoise(config.seed + '_moist');
  }

  public generate(chunkX: number, chunkY: number): Tile[][][] {
    const size = this.config.chunkSize;
    const worldOffsetX = chunkX * size;
    const worldOffsetY = chunkY * size;

    // Initialize 7-layer grid
    const tiles: Tile[][][] = Array(7)
      .fill(null)
      .map(() =>
        Array(size)
          .fill(null)
          .map(() => Array(size).fill(null))
      );

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const wx = worldOffsetX + x;
        const wy = worldOffsetY + y;

        const nx = wx * this.config.globalScale;
        const ny = wy * this.config.globalScale;
        const elev = this.noiseElevation.fbm(
          nx * this.config.elevationScale,
          ny * this.config.elevationScale,
          Math.floor(this.config.detail),
          this.config.roughness
        );
        const moist = this.noiseMoisture.fbm(nx * this.config.moistureScale, ny * this.config.moistureScale, 2);

        const { biome, surfaceBlock } = this.determineBiome(elev, moist);

        // Z=0 (Surface)
        tiles[3]![y]![x] = this.createTile(wx, wy, 0, surfaceBlock, biome);

        // Z<0 (Underground)
        for (let zIndex = 2; zIndex >= 0; zIndex--) {
          const realZ = (zIndex - 3) as ZLevel;
          const block = realZ === -3 && this.rng.next() > 0.5 ? BlockType.BEDROCK : BlockType.STONE;
          tiles[zIndex]![y]![x] = this.createTile(wx, wy, realZ, block, biome);
        }

        // Z>0 (Sky)
        for (let zIndex = 4; zIndex <= 6; zIndex++) {
          tiles[zIndex]![y]![x] = this.createTile(wx, wy, (zIndex - 3) as ZLevel, BlockType.AIR, biome);
        }
      }
    }

    return tiles;
  }

  public getTileAt(x: number, y: number, z: ZLevel): Tile {
    const nx = x * this.config.globalScale;
    const ny = y * this.config.globalScale;
    const elev = this.noiseElevation.fbm(
      nx * this.config.elevationScale,
      ny * this.config.elevationScale,
      Math.floor(this.config.detail),
      this.config.roughness
    );
    const moist = this.noiseMoisture.fbm(nx * this.config.moistureScale, ny * this.config.moistureScale, 2);

    const { biome, surfaceBlock } = this.determineBiome(elev, moist);

    let block;

    // Determine block based on Z
    if (z === 0) {
      block = surfaceBlock;
    } else if (z < 0) {
      block = z === -3 && this.rng.next() > 0.5 ? BlockType.BEDROCK : BlockType.STONE;
    } else {
      block = BlockType.AIR;
    }

    return this.createTile(x, y, z, block, biome);
  }

  private determineBiome(elev: number, moist: number): { biome: BiomeType; surfaceBlock: BlockType } {
    if (elev < this.config.seaLevel) return { biome: BiomeType.ocean, surfaceBlock: BlockType.WATER };
    if (elev < this.config.seaLevel + 0.05) return { biome: BiomeType.beach, surfaceBlock: BlockType.SAND };
    const adjustedMoist = moist + this.config.temperatureOffset * 0.5;
    if (elev > 0.6) return { biome: BiomeType.snowy_peaks, surfaceBlock: BlockType.SNOW };
    if (elev > 0.4) return { biome: BiomeType.mountain, surfaceBlock: BlockType.STONE };
    if (adjustedMoist < -0.2) return { biome: BiomeType.desert, surfaceBlock: BlockType.SAND };
    if (adjustedMoist > 0.2) return { biome: BiomeType.forest, surfaceBlock: BlockType.GRASS };
    return { biome: BiomeType.plains, surfaceBlock: BlockType.GRASS };
  }

  private createTile(x: number, y: number, z: ZLevel, block: BlockType, biome: BiomeType): Tile {
    const isTransparent = (
      [
        BlockType.AIR,
        BlockType.WATER,
        BlockType.DOOR,
        BlockType.GRASS,
        BlockType.DIRT,
        BlockType.SAND,
        BlockType.SNOW,
        BlockType.FLOOR_WOOD,
        BlockType.FLOOR_STONE,
        BlockType.TREE_LEAVES,
        BlockType.CACTUS,
        BlockType.STAIRS_UP,
        BlockType.STAIRS_DOWN,
      ] as BlockType[]
    ).includes(block);

    const isWalkable = (
      [
        BlockType.FLOOR_WOOD,
        BlockType.FLOOR_STONE,
        BlockType.GRASS,
        BlockType.DIRT,
        BlockType.SAND,
        BlockType.SNOW,
        BlockType.DOOR,
        BlockType.STAIRS_UP,
        BlockType.STAIRS_DOWN,
        BlockType.WATER,
      ] as BlockType[]
    ).includes(block);

    return { x, y, z, block, biome, isWalkable, isTransparent, variant: this.rng.next() };
  }
}

export function createUnifiedTerrainGenerator(seed: string, params: Partial<WorldConfig> = {}) {
  // Merge defaults with overrides
  const config: WorldConfig = {
    // defaults should be imported from constants but for simplicity/circular avoidance merging here or re-importing
    chunkSize: 16,
    globalScale: 0.02,
    seaLevel: 0.0,
    elevationScale: 0.5,
    roughness: 0.5,
    detail: 4,
    moistureScale: 0.015,
    temperatureOffset: 0.0,
    structureChance: 0.1,
    structureSpacing: 3,
    structureSizeAvg: 10,
    roadDensity: 0.2,
    fogRadius: 15,
    ...params,
    seed,
  };

  const generator = new TerrainGenerator(config);

  return (chunkX: number, chunkY: number, _size?: number) => {
    // If size is provided, it overrides config? Or just assert it matches
    // Currently generator uses config.chunkSize
    return generator.generate(chunkX, chunkY);
  };
}
