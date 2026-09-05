/**
 * ⚠️ DOCUMENTATION MANDATE: Update JSDoc & README with ANY change.
 * Keep documentation synchronized with code at all times.
 */
import { BlockType, Tile } from '@daicer/engine/types';
import { TileHelper } from '@/api/voxel-engine/services/utils/tile-helper';
import { Alea } from '@/api/voxel-engine/src/utils/math';

export class FloraGenerator {
  private static setBlock(
    tiles: Tile[][][],
    cx: number,
    cy: number,
    wx: number,
    wy: number,
    z: number,
    block: BlockType
  ) {
    const lx = wx - cx * (tiles[0]?.[0]?.length ?? 0);
    const ly = wy - cy * (tiles[0]?.length ?? 0);
    const lz = z + 3;
    if (
      tiles.length > 0 &&
      tiles[0].length > 0 &&
      tiles[0][0].length > 0 &&
      lx >= 0 &&
      lx < tiles[0][0].length &&
      ly >= 0 &&
      ly < tiles[0].length &&
      lz >= 0 &&
      lz < tiles.length
    ) {
      const t = tiles[lz][ly][lx];
      TileHelper.applyBlock(t, block);
    }
  }

  /**
   * Generates a single tree/plant/rock instance at the given world coordinates.
   */
  public static generate(
    tiles: Tile[][][],
    cx: number,
    cy: number,
    wx: number,
    wy: number,
    z: number,
    type: BlockType,
    rng: Alea
  ) {
    if (type.startsWith('tree_')) {
      this.generateTree(tiles, cx, cy, wx, wy, z, type, rng);
    } else if (type.startsWith('plant_')) {
      this.generatePlant(tiles, cx, cy, wx, wy, z, type, rng);
    } else if (type.startsWith('rock_') || type.startsWith('ore_')) {
      this.generateRock(tiles, cx, cy, wx, wy, z, type, rng);
    }
  }

  private static generateTree(
    tiles: Tile[][][],
    cx: number,
    cy: number,
    wx: number,
    wy: number,
    z: number,
    type: BlockType,
    rng: Alea
  ) {
    const height = 4 + Math.floor(rng.next() * 3); // Base height

    switch (type) {
      case BlockType.TREE_PALM:
        this.buildPalmTree(tiles, cx, cy, wx, wy, z, height + 4, rng);
        break;
      case BlockType.TREE_PINE:
      case BlockType.TREE_SPRUCE:
      case BlockType.TREE_FIR:
        this.buildPineTree(tiles, cx, cy, wx, wy, z, height, type);
        break;
      case BlockType.TREE_BAOBAB:
        this.buildBaobabTree(tiles, cx, cy, wx, wy, z, height, rng);
        break;
      case BlockType.TREE_WILLOW:
      case BlockType.TREE_MANGROVE:
        this.buildWillowTree(tiles, cx, cy, wx, wy, z, height, type, rng);
        break;
      case BlockType.TREE_BAMBOO_GIANT:
        this.buildBamboo(tiles, cx, cy, wx, wy, z, 10 + Math.floor(rng.next() * 10));
        break;
      case BlockType.TREE_OAK:
      case BlockType.TREE_BIRCH:
      case BlockType.TREE_MAPLE:
      case BlockType.TREE_CHERRY:
      default:
        // Generic "Lollipop" tree signature
        this.buildGenericTree(tiles, cx, cy, wx, wy, z, height, type);
        break;
    }
  }

  private static buildGenericTree(
    tiles: Tile[][][],
    cx: number,
    cy: number,
    wx: number,
    wy: number,
    z: number,
    h: number,
    woodType: BlockType
  ) {
    // Trunk
    this.setBlock(tiles, cx, cy, wx, wy, z, woodType);
    for (let i = 1; i < h; i++) {
      this.setBlock(tiles, cx, cy, wx, wy, z + i, woodType);
    }

    // Leaves
    const leaveStart = z + h - 2;
    const leaveEnd = z + h + 1;
    for (let lz = leaveStart; lz <= leaveEnd; lz++) {
      const radius = lz === leaveEnd ? 1 : 2;
      for (let ly = -radius; ly <= radius; ly++) {
        for (let lx = -radius; lx <= radius; lx++) {
          if (Math.abs(lx) + Math.abs(ly) > radius + 1) continue; // Rounded corners
          this.setBlock(tiles, cx, cy, wx + lx, wy + ly, lz, BlockType.TREE_LEAVES);
        }
      }
    }
  }

  private static buildPalmTree(
    tiles: Tile[][][],
    cx: number,
    cy: number,
    wx: number,
    wy: number,
    z: number,
    h: number,
    rng: Alea
  ) {
    // Lean: slight offset as we go up
    let curX = wx;
    let curY = wy;

    for (let i = 0; i < h; i++) {
      this.setBlock(tiles, cx, cy, Math.floor(curX), Math.floor(curY), z + i, BlockType.TREE_PALM);
      if (i > 2 && rng.next() > 0.6) {
        curX += (rng.next() - 0.5) * 0.5;
        curY += (rng.next() - 0.5) * 0.5;
      }
    }

    // Top Leaves (Cross pattern)
    const topZ = z + h;
    const offsets = [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: -1 },
      { x: -1, y: 0 },
      { x: -2, y: 0 },
      { x: -3, y: 0 },
      { x: -3, y: -1 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
      { x: 1, y: 3 },
      { x: 0, y: -1 },
      { x: 0, y: -2 },
      { x: 0, y: -3 },
      { x: -1, y: -3 },
    ];

    offsets.forEach((off) => {
      this.setBlock(tiles, cx, cy, Math.floor(curX) + off.x, Math.floor(curY) + off.y, topZ, BlockType.TREE_LEAVES);
    });
    // Center top
    this.setBlock(tiles, cx, cy, Math.floor(curX), Math.floor(curY), topZ, BlockType.TREE_LEAVES);
  }

  private static buildPineTree(
    tiles: Tile[][][],
    cx: number,
    cy: number,
    wx: number,
    wy: number,
    z: number,
    h: number,
    woodType: BlockType
  ) {
    // Tall trunk
    for (let i = 0; i < h; i++) {
      this.setBlock(tiles, cx, cy, wx, wy, z + i, woodType);
    }

    // Cone shape leaves
    let radius = 2;
    for (let lz = z + 2; lz < z + h + 2; lz++) {
      if ((lz - z) % 2 === 0 && radius > 0) radius--;
      for (let ly = -radius; ly <= radius; ly++) {
        for (let lx = -radius; lx <= radius; lx++) {
          if (Math.abs(lx) + Math.abs(ly) > radius + 0.5) continue;
          if (lx === 0 && ly === 0 && lz < z + h) continue; // Don't overwrite trunk
          this.setBlock(tiles, cx, cy, wx + lx, wy + ly, lz, BlockType.TREE_LEAVES);
        }
      }
    }
  }

  private static buildBaobabTree(
    tiles: Tile[][][],
    cx: number,
    cy: number,
    wx: number,
    wy: number,
    z: number,
    h: number,
    rng: Alea
  ) {
    // Thick trunk (3x3 or 2x2 base)
    const trunkW = 2;
    for (let i = 0; i < h; i++) {
      for (let tx = 0; tx < trunkW; tx++) {
        for (let ty = 0; ty < trunkW; ty++) {
          this.setBlock(tiles, cx, cy, wx + tx, wy + ty, z + i, BlockType.TREE_BAOBAB);
        }
      }
    }

    // Flat top foliage
    const topZ = z + h;
    for (let lx = -3; lx <= 4; lx++) {
      for (let ly = -3; ly <= 4; ly++) {
        if (Math.abs(lx) + Math.abs(ly) > 5) continue;
        this.setBlock(tiles, cx, cy, wx + lx, wy + ly, topZ, BlockType.TREE_LEAVES);
        if (rng.next() > 0.5) this.setBlock(tiles, cx, cy, wx + lx, wy + ly, topZ + 1, BlockType.TREE_LEAVES);
      }
    }
  }

  private static buildWillowTree(
    tiles: Tile[][][],
    cx: number,
    cy: number,
    wx: number,
    wy: number,
    z: number,
    h: number,
    type: BlockType,
    rng: Alea
  ) {
    // Trunk
    for (let i = 0; i < h - 1; i++) this.setBlock(tiles, cx, cy, wx, wy, z + i, type);

    // Hanging leaves
    const crownZ = z + h - 1;
    const radius = 3;

    for (let ly = -radius; ly <= radius; ly++) {
      for (let lx = -radius; lx <= radius; lx++) {
        if (lx * lx + ly * ly > radius * radius) continue;
        this.setBlock(tiles, cx, cy, wx + lx, wy + ly, crownZ, BlockType.TREE_LEAVES);

        // Vines down
        const length = 1 + Math.floor(rng.next() * (h - 2));
        if (Math.abs(lx) > 1 || Math.abs(ly) > 1) {
          for (let d = 1; d <= length; d++) {
            this.setBlock(tiles, cx, cy, wx + lx, wy + ly, crownZ - d, BlockType.PLANT_VINES);
          }
        }
      }
    }
  }

  private static buildBamboo(tiles: Tile[][][], cx: number, cy: number, wx: number, wy: number, z: number, h: number) {
    for (let i = 0; i < h; i++) {
      this.setBlock(tiles, cx, cy, wx, wy, z + i, BlockType.TREE_BAMBOO_GIANT);
      // Leaves every few blocks and at top
      if (i > 3 && (i % 3 === 0 || i === h - 1)) {
        this.setBlock(tiles, cx, cy, wx + 1, wy, z + i, BlockType.TREE_LEAVES);
        this.setBlock(tiles, cx, cy, wx - 1, wy, z + i, BlockType.TREE_LEAVES);
      }
    }
  }

  private static generatePlant(
    tiles: Tile[][][],
    cx: number,
    cy: number,
    wx: number,
    wy: number,
    z: number,
    type: BlockType,
    rng: Alea
  ) {
    // simple 1-block plants usually
    if (type === BlockType.PLANT_CACTUS) {
      const h = 2 + Math.floor(rng.next() * 3);
      for (let i = 0; i < h; i++) {
        this.setBlock(tiles, cx, cy, wx, wy, z + i, BlockType.CACTUS);
      }
    } else if (type === BlockType.PLANT_SUGARCANE) {
      const h = 2 + Math.floor(rng.next() * 3);
      for (let i = 0; i < h; i++) {
        this.setBlock(tiles, cx, cy, wx, wy, z + i, BlockType.PLANT_SUGARCANE);
      }
    } else if (type === BlockType.PLANT_PUMPKIN || type === BlockType.PLANT_MELON) {
      this.setBlock(tiles, cx, cy, wx, wy, z, type);
    } else {
      // Flowers, grass, bushes
      this.setBlock(tiles, cx, cy, wx, wy, z, type);
    }
  }

  private static generateRock(
    tiles: Tile[][][],
    cx: number,
    cy: number,
    wx: number,
    wy: number,
    z: number,
    type: BlockType,
    rng: Alea
  ) {
    // Single rock or small cluster
    this.setBlock(tiles, cx, cy, wx, wy, z, type);
    if (rng.next() > 0.7) {
      this.setBlock(tiles, cx, cy, wx + 1, wy, z, type);
    }
  }

  public static populateChunk(chunkX: number, chunkY: number, tiles: Tile[][][], chunkSize: number, seed: string) {
    const rng = new Alea(seed + `_flora_${chunkX}_${chunkY}`);
    const wxStart = chunkX * chunkSize;
    const wyStart = chunkY * chunkSize;

    for (let y = 0; y < chunkSize; y++) {
      for (let x = 0; x < chunkSize; x++) {
        // Find Surface Z
        let surfaceZ = -4; // Below bottom
        for (let z = 3; z >= -3; z--) {
          const idx = z + 3;
          if (
            tiles[idx][y][x].block !== BlockType.AIR &&
            tiles[idx][y][x].block !== BlockType.WATER &&
            tiles[idx][y][x].block !== BlockType.LAVA
          ) {
            surfaceZ = z;
            break;
          }
        }

        if (surfaceZ === -4) continue; // No surface found (sky/void)

        // Don't spawn on top of water/lava/bedrock/leaves
        const surfaceBlock = tiles[surfaceZ + 3][y][x].block as BlockType;
        if (
          (
            [BlockType.WATER, BlockType.LAVA, BlockType.BEDROCK, BlockType.TREE_LEAVES, BlockType.SAND] as BlockType[]
          ).includes(surfaceBlock) &&
          surfaceBlock !== BlockType.SAND
        )
          continue;
        // Allow SAND for Palm/Cactus

        const biome = tiles[3][y][x].biome; // Surface biome at Z=0 layer usually correct for context

        // Get Flora Palette
        const palette = this.BIOME_FLORA[biome];
        if (!palette) continue;

        // Roll for spawn
        if (rng.next() < palette.density) {
          // Select Type
          const roll = rng.next();
          let accumulated = 0;
          let selectedType = palette.types[0].type;

          for (const item of palette.types) {
            accumulated += item.weight;
            if (roll <= accumulated) {
              selectedType = item.type;
              break;
            }
          }

          // Special Check: Sand/Beach
          if (surfaceBlock === BlockType.SAND) {
            if (!([BlockType.CACTUS, BlockType.TREE_PALM, BlockType.PLANT_CACTUS] as string[]).includes(selectedType)) {
              continue; // Don't grow Oaks on sand normally
            }
          }

          this.generate(tiles, chunkX, chunkY, wxStart + x, wyStart + y, surfaceZ + 1, selectedType, rng);
        }
      }
    }
  }

  private static BIOME_FLORA: Record<string, { density: number; types: { type: BlockType; weight: number }[] }> = {
    plains: {
      density: 0.05,
      types: [
        { type: BlockType.PLANT_GRASS, weight: 0.6 },
        { type: BlockType.PLANT_FLOWER_RED, weight: 0.1 },
        { type: BlockType.PLANT_FLOWER_YELLOW, weight: 0.1 },
        { type: BlockType.TREE_OAK, weight: 0.05 },
        { type: BlockType.ROCK_MOSSY, weight: 0.02 },
        { type: BlockType.PLANT_PUMPKIN, weight: 0.01 },
      ],
    },
    forest: {
      density: 0.15,
      types: [
        { type: BlockType.TREE_OAK, weight: 0.3 },
        { type: BlockType.TREE_BIRCH, weight: 0.2 },
        { type: BlockType.PLANT_GRASS, weight: 0.3 },
        { type: BlockType.PLANT_BUSH, weight: 0.1 },
        { type: BlockType.PLANT_FERN, weight: 0.1 },
        { type: BlockType.ROCK_MOSSY, weight: 0.05 },
      ],
    },
    desert: {
      density: 0.02,
      types: [
        { type: BlockType.CACTUS, weight: 0.3 },
        { type: BlockType.PLANT_CACTUS, weight: 0.4 },
        { type: BlockType.ROCK_SANDY, weight: 0.3 },
      ],
    },
    beach: {
      density: 0.03,
      types: [
        { type: BlockType.TREE_PALM, weight: 0.4 },
        { type: BlockType.ROCK_SANDSTONE, weight: 0.3 },
        { type: BlockType.PLANT_GRASS, weight: 0.3 },
      ],
    },
    jungle: {
      density: 0.3,
      types: [
        { type: BlockType.TREE_JUNGLE, weight: 0.3 },
        { type: BlockType.TREE_MAHOGANY, weight: 0.1 },
        { type: BlockType.TREE_BAMBOO_GIANT, weight: 0.2 },
        { type: BlockType.PLANT_FERN, weight: 0.2 },
        { type: BlockType.PLANT_MELON, weight: 0.1 },
        { type: BlockType.PLANT_VINES, weight: 0.1 }, // Logic needed to place vines specifically
      ],
    },
    mystic_forest: {
      density: 0.2,
      types: [
        { type: BlockType.TREE_WILLOW, weight: 0.2 },
        { type: BlockType.TREE_CHERRY, weight: 0.2 },
        { type: BlockType.TREE_MAPLE, weight: 0.1 },
        { type: BlockType.PLANT_FLOWER_BLUE, weight: 0.2 },
        { type: BlockType.ROCK_CRYSTAL_BLUE, weight: 0.05 },
        { type: BlockType.MUSHROOM_GIANT, weight: 0.1 },
      ],
    },
    swamp: {
      density: 0.1,
      types: [
        { type: BlockType.TREE_MANGROVE, weight: 0.4 },
        { type: BlockType.TREE_WILLOW, weight: 0.2 },
        { type: BlockType.PLANT_SUGARCANE, weight: 0.2 },
        { type: BlockType.ROCK_MOSSY, weight: 0.2 },
      ],
    },
    mountain: {
      density: 0.02,
      types: [
        { type: BlockType.TREE_PINE, weight: 0.3 },
        { type: BlockType.TREE_SPRUCE, weight: 0.2 },
        { type: BlockType.ROCK_GRANITE, weight: 0.3 },
        { type: BlockType.ROCK_DIORITE, weight: 0.2 },
      ],
    },
    snowy_peaks: {
      density: 0.01,
      types: [
        { type: BlockType.TREE_FIR, weight: 0.2 },
        { type: BlockType.ROCK_ICE, weight: 0.5 },
        { type: BlockType.ROCK_SLATE, weight: 0.3 },
      ],
    },
    lava_wastes: {
      density: 0.05,
      types: [
        { type: BlockType.ROCK_MAGMA, weight: 0.5 },
        { type: BlockType.ROCK_OBSIDIAN, weight: 0.3 },
        { type: BlockType.ROCK_BASALT, weight: 0.2 },
      ],
    },
    crystal_peaks: {
      density: 0.05,
      types: [
        { type: BlockType.ROCK_CRYSTAL_RED, weight: 0.25 },
        { type: BlockType.ROCK_CRYSTAL_BLUE, weight: 0.25 },
        { type: BlockType.ROCK_CRYSTAL_GREEN, weight: 0.25 },
        { type: BlockType.ROCK_CRYSTAL_PURPLE, weight: 0.25 },
      ],
    },
    badlands: {
      density: 0.02,
      types: [
        { type: BlockType.PLANT_CACTUS, weight: 0.5 },
        { type: BlockType.ROCK_SANDSTONE, weight: 0.3 },
        { type: BlockType.ORE_GOLD, weight: 0.05 }, // Surface gold!
        { type: BlockType.TREE_ACACIA, weight: 0.15 },
      ],
    },
    savanna: {
      density: 0.05,
      types: [
        { type: BlockType.TREE_ACACIA, weight: 0.5 },
        { type: BlockType.TREE_BAOBAB, weight: 0.2 },
        { type: BlockType.PLANT_GRASS, weight: 0.3 },
      ],
    },
  };
}
