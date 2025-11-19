/**
 * Structure Presets and Templates
 * Predefined structure layouts for common building types
 */

import type {
  Structure,
  StructureTile,
  StructureType,
  StructureMaterial,
  StructureFloor,
  LayoutAlgorithm,
} from './types';
import { generateRoomLayout, generateWFCLayout, generateCALayout, addStairs } from './layouts';

/**
 * Structure template (before placement)
 */
export interface StructureTemplate {
  type: StructureType;
  name: string;
  width: number;
  height: number;
  defaultMaterial: StructureMaterial;
  floors: StructureFloor[]; // Which floors this structure has (e.g., [-1, 0, 1])
  layoutAlgorithm: LayoutAlgorithm;
  generator: (material: StructureMaterial, seed: string) => Record<StructureFloor, StructureTile[][]>;
}

/**
 * Generate a house layout (2 floors: 0 ground, 1 upper)
 */
function generateHouseLayout(material: StructureMaterial, seed: string): Record<StructureFloor, StructureTile[][]> {
  const size = 10;
  const layouts: Record<StructureFloor, StructureTile[][]> = {};
  const floors: StructureFloor[] = [0, 1];

  for (const floor of floors) {
    layouts[floor] = generateRoomLayout(size, size, floor, material, `${seed}_${floor}`, 4);
  }

  // Add stairs connecting floors
  addStairs(layouts[0], layouts[1], 0, 1, material, seed);

  return layouts;
}

/**
 * Generate a tower layout (5 floors: -1, 0, 1, 2, 3)
 */
function generateTowerLayout(material: StructureMaterial, seed: string): Record<StructureFloor, StructureTile[][]> {
  const size = 8;
  const layouts: Record<StructureFloor, StructureTile[][]> = {};
  const floors: StructureFloor[] = [-1, 0, 1, 2, 3];

  for (const floor of floors) {
    layouts[floor] = generateRoomLayout(size, size, floor, material, `${seed}_${floor}`, 5);
  }

  // Add stairs connecting each floor
  for (let i = 0; i < floors.length - 1; i++) {
    addStairs(layouts[floors[i]], layouts[floors[i + 1]], floors[i], floors[i + 1], material, seed);
  }

  return layouts;
}

/**
 * Generate a castle layout (3 floors: -1, 0, 1) with large courtyards
 */
function generateCastleLayout(material: StructureMaterial, seed: string): Record<StructureFloor, StructureTile[][]> {
  const size = 32;
  const layouts: Record<StructureFloor, StructureTile[][]> = {};
  const floors: StructureFloor[] = [-1, 0, 1];

  for (const floor of floors) {
    layouts[floor] = generateRoomLayout(size, size, floor, material, `${seed}_${floor}`, 6);
  }

  // Add stairs connecting floors
  for (let i = 0; i < floors.length - 1; i++) {
    addStairs(layouts[floors[i]], layouts[floors[i + 1]], floors[i], floors[i + 1], material, seed);
  }

  return layouts;
}

/**
 * Generate a dungeon using cellular automata (3 floors: -3, -2, -1)
 */
function generateDungeonLayout(material: StructureMaterial, seed: string): Record<StructureFloor, StructureTile[][]> {
  const size = 20;
  const layouts: Record<StructureFloor, StructureTile[][]> = {};
  const floors: StructureFloor[] = [-3, -2, -1];

  for (const floor of floors) {
    layouts[floor] = generateCALayout(size, size, floor, material, `${seed}_${floor}`, 0.45, 4);
  }

  // Add stairs connecting floors
  for (let i = 0; i < floors.length - 1; i++) {
    addStairs(layouts[floors[i]], layouts[floors[i + 1]], floors[i], floors[i + 1], material, seed);
  }

  return layouts;
}

/**
 * Generate a temple using WFC (2 floors: -1 basement, 0 main hall)
 */
function generateTempleLayout(material: StructureMaterial, seed: string): Record<StructureFloor, StructureTile[][]> {
  const size = 16;
  const layouts: Record<StructureFloor, StructureTile[][]> = {};
  const floors: StructureFloor[] = [-1, 0];

  for (const floor of floors) {
    layouts[floor] = generateWFCLayout(size, size, floor, material, `${seed}_${floor}`);
  }

  // Add stairs connecting basement to main hall
  addStairs(layouts[-1], layouts[0], -1, 0, material, seed);

  return layouts;
}

/**
 * Generate a cave entrance (floors -1, 0)
 */
function generateCaveEntranceLayout(
  material: StructureMaterial,
  seed: string
): Record<StructureFloor, StructureTile[][]> {
  const size = 12;
  const layouts: Record<StructureFloor, StructureTile[][]> = {};
  const floors: StructureFloor[] = [-1, 0];

  for (const floor of floors) {
    layouts[floor] = generateCALayout(size, size, floor, material, `${seed}_${floor}`, 0.4, 3);
  }

  addStairs(layouts[-1], layouts[0], -1, 0, material, seed);

  return layouts;
}

/**
 * Generate an ancient tree (floors 0, 1, 2)
 */
function generateAncientTreeLayout(
  material: StructureMaterial,
  seed: string
): Record<StructureFloor, StructureTile[][]> {
  const size = 10;
  const layouts: Record<StructureFloor, StructureTile[][]> = {};
  const floors: StructureFloor[] = [0, 1, 2];

  for (const floor of floors) {
    layouts[floor] = generateRoomLayout(size, size, floor, material, `${seed}_${floor}`, 4);
  }

  // Connect floors with stairs
  for (let i = 0; i < floors.length - 1; i++) {
    addStairs(layouts[floors[i]], layouts[floors[i + 1]], floors[i], floors[i + 1], material, seed);
  }

  return layouts;
}

/**
 * Generate a stone circle (floor 0 only)
 */
function generateStoneCircleLayout(
  material: StructureMaterial,
  seed: string
): Record<StructureFloor, StructureTile[][]> {
  const size = 8;
  const floor0: StructureTile[][] = [];

  // Simple circular pattern
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 1;

  for (let y = 0; y < size; y++) {
    const row: StructureTile[] = [];
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (dist >= radius - 0.5 && dist <= radius + 0.5) {
        row.push({ material, tileType: 'wall', floor: 0 });
      } else if (dist < radius) {
        row.push({ material, tileType: 'floor', floor: 0 });
      } else {
        row.push({ material, tileType: 'empty', floor: 0 });
      }
    }
    floor0.push(row);
  }

  return { 0: floor0 };
}

/**
 * Road segment (floor 0 only, simple straight line)
 */
function generateRoadLayout(material: StructureMaterial, seed: string): Record<StructureFloor, StructureTile[][]> {
  const width = 3;
  const height = 1;
  const floor0: StructureTile[][] = [];

  for (let y = 0; y < height; y++) {
    const row: StructureTile[] = [];
    for (let x = 0; x < width; x++) {
      row.push({ material, tileType: 'road', floor: 0 });
    }
    floor0.push(row);
  }

  return { 0: floor0 };
}

/**
 * Bridge segment (floor 0 only)
 */
function generateBridgeLayout(material: StructureMaterial, seed: string): Record<StructureFloor, StructureTile[][]> {
  const width = 5;
  const height = 1;
  const floor0: StructureTile[][] = [];

  for (let y = 0; y < height; y++) {
    const row: StructureTile[] = [];
    for (let x = 0; x < width; x++) {
      if (x === 0 || x === width - 1) {
        row.push({ material, tileType: 'wall', floor: 0 });
      } else {
        row.push({ material, tileType: 'floor', floor: 0 });
      }
    }
    floor0.push(row);
  }

  return { 0: floor0 };
}

/**
 * All structure templates
 */
export const STRUCTURE_TEMPLATES: Record<StructureType, StructureTemplate> = {
  house: {
    type: 'house',
    name: 'House',
    width: 10,
    height: 10,
    defaultMaterial: 'wood',
    floors: [0, 1],
    layoutAlgorithm: 'manual',
    generator: generateHouseLayout,
  },
  tower: {
    type: 'tower',
    name: 'Tower',
    width: 8,
    height: 8,
    defaultMaterial: 'stone',
    floors: [-1, 0, 1, 2, 3],
    layoutAlgorithm: 'manual',
    generator: generateTowerLayout,
  },
  castle: {
    type: 'castle',
    name: 'Castle',
    width: 32,
    height: 32,
    defaultMaterial: 'stone',
    floors: [-1, 0, 1],
    layoutAlgorithm: 'manual',
    generator: generateCastleLayout,
  },
  dungeon: {
    type: 'dungeon',
    name: 'Dungeon',
    width: 20,
    height: 20,
    defaultMaterial: 'rock',
    floors: [-3, -2, -1],
    layoutAlgorithm: 'cellular-automata',
    generator: generateDungeonLayout,
  },
  temple: {
    type: 'temple',
    name: 'Temple',
    width: 16,
    height: 16,
    defaultMaterial: 'marble',
    floors: [-1, 0],
    layoutAlgorithm: 'wfc',
    generator: generateTempleLayout,
  },
  cave_entrance: {
    type: 'cave_entrance',
    name: 'Cave Entrance',
    width: 12,
    height: 12,
    defaultMaterial: 'rock',
    floors: [-1, 0],
    layoutAlgorithm: 'cellular-automata',
    generator: generateCaveEntranceLayout,
  },
  ancient_tree: {
    type: 'ancient_tree',
    name: 'Ancient Tree',
    width: 10,
    height: 10,
    defaultMaterial: 'wood',
    floors: [0, 1, 2],
    layoutAlgorithm: 'manual',
    generator: generateAncientTreeLayout,
  },
  stone_circle: {
    type: 'stone_circle',
    name: 'Stone Circle',
    width: 8,
    height: 8,
    defaultMaterial: 'stone',
    floors: [0],
    layoutAlgorithm: 'manual',
    generator: generateStoneCircleLayout,
  },
  road: {
    type: 'road',
    name: 'Road',
    width: 3,
    height: 1,
    defaultMaterial: 'stone',
    floors: [0],
    layoutAlgorithm: 'manual',
    generator: generateRoadLayout,
  },
  bridge: {
    type: 'bridge',
    name: 'Bridge',
    width: 5,
    height: 1,
    defaultMaterial: 'wood',
    floors: [0],
    layoutAlgorithm: 'manual',
    generator: generateBridgeLayout,
  },
};

/**
 * Structure type selection weights
 */
export const DEFAULT_STRUCTURE_WEIGHTS: Record<StructureType, number> = {
  house: 0.3,
  tower: 0.15,
  temple: 0.1,
  castle: 0.05,
  dungeon: 0.15,
  cave_entrance: 0.1,
  ancient_tree: 0.1,
  stone_circle: 0.05,
  road: 0, // Roads are generated separately via pathfinding
  bridge: 0, // Bridges are generated separately
};
