/**
 * Structure Material Definitions
 * Colors, properties, and metadata for structure materials
 */

import type { StructureMaterial } from './types';

export interface MaterialProperties {
  name: string;
  color: string; // Hex color for rendering
  durability: number; // 1-10 scale
  weight: number; // Probability weight for random selection
  naturalness: number; // How natural vs artificial (0-10)
}

export const MATERIAL_PROPERTIES: Record<StructureMaterial, MaterialProperties> = {
  wood: {
    name: 'Wood',
    color: '#8B4513', // Saddle brown
    durability: 4,
    weight: 40,
    naturalness: 7,
  },
  stone: {
    name: 'Stone',
    color: '#696969', // Dim gray
    durability: 8,
    weight: 30,
    naturalness: 6,
  },
  metal: {
    name: 'Metal',
    color: '#A9A9A9', // Dark gray (silver)
    durability: 9,
    weight: 10,
    naturalness: 2,
  },
  marble: {
    name: 'Marble',
    color: '#F5F5DC', // Beige
    durability: 7,
    weight: 5,
    naturalness: 5,
  },
  rock: {
    name: 'Rock',
    color: '#4A4A4A', // Very dark gray
    durability: 6,
    weight: 15,
    naturalness: 9,
  },
};

/**
 * Get color for a specific material
 */
export function getMaterialColor(material: StructureMaterial): string {
  return MATERIAL_PROPERTIES[material].color;
}

/**
 * Select a random material based on weights
 */
export function selectRandomMaterial(rng: () => number): StructureMaterial {
  const totalWeight = Object.values(MATERIAL_PROPERTIES).reduce((sum, prop) => sum + prop.weight, 0);
  let random = rng() * totalWeight;

  for (const [material, props] of Object.entries(MATERIAL_PROPERTIES)) {
    random -= props.weight;
    if (random <= 0) {
      return material as StructureMaterial;
    }
  }

  return 'stone'; // Default fallback
}

/**
 * Get material by name (case-insensitive)
 */
export function getMaterialByName(name: string): StructureMaterial | null {
  const normalized = name.toLowerCase();
  if (normalized in MATERIAL_PROPERTIES) {
    return normalized as StructureMaterial;
  }
  return null;
}
