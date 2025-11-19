/**
 * Structure placement and template tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  STRUCTURE_TEMPLATES,
  generateStructureVariant,
  placeStructure,
  canSpawnStructure,
  loadStructureFromJSON,
  saveStructureToJSON,
  type StructureTemplate,
} from '../structures';

describe('Structure Template System', () => {
  describe('Built-in Templates', () => {
    it('should have oak_tree template with correct dimensions', () => {
      const template = STRUCTURE_TEMPLATES.oak_tree;
      expect(template).toBeDefined();
      expect(template.id).toBe('oak_tree');
      expect(template.name).toBe('Oak Tree');
      expect(template.width).toBe(5);
      expect(template.height).toBe(5);
      expect(template.depth).toBe(8);
      expect(template.blocks.length).toBeGreaterThan(0);
    });

    it('should have stone_ruin template with correct spawn rules', () => {
      const template = STRUCTURE_TEMPLATES.stone_ruin;
      expect(template).toBeDefined();
      expect(template.spawnRules.biomes).toContain('plains');
      expect(template.spawnRules.minDistance).toBe(50);
      expect(template.spawnRules.rarity).toBe(0.1);
      expect(template.spawnRules.onlyOnSurface).toBe(true);
    });

    it('should have village_house template with foundation blocks', () => {
      const template = STRUCTURE_TEMPLATES.village_house;
      expect(template).toBeDefined();
      expect(template.width).toBe(9);
      expect(template.height).toBe(9);
      expect(template.blocks.length).toBeGreaterThan(50);
    });

    it('should have shrine template with minimum elevation requirement', () => {
      const template = STRUCTURE_TEMPLATES.shrine;
      expect(template).toBeDefined();
      expect(template.spawnRules.minElevation).toBe(20);
      expect(template.spawnRules.rarity).toBe(0.02);
    });

    it('should have all templates with valid spawn rules', () => {
      Object.values(STRUCTURE_TEMPLATES).forEach((template) => {
        expect(template.spawnRules).toBeDefined();
        expect(template.spawnRules.onlyOnSurface !== undefined || template.spawnRules.underground !== undefined).toBe(
          true
        );
        if (template.spawnRules.rarity !== undefined) {
          expect(template.spawnRules.rarity).toBeGreaterThanOrEqual(0);
          expect(template.spawnRules.rarity).toBeLessThanOrEqual(1);
        }
      });
    });
  });

  describe('generateStructureVariant()', () => {
    const template = STRUCTURE_TEMPLATES.oak_tree;

    it('should generate variant with same dimensions', () => {
      const variant = generateStructureVariant(template, 'test-seed', 0);
      expect(variant.width).toBe(template.width);
      expect(variant.height).toBe(template.height);
      expect(variant.depth).toBe(template.depth);
    });

    it('should create unique id for variant', () => {
      const variant1 = generateStructureVariant(template, 'test-seed', 0);
      const variant2 = generateStructureVariant(template, 'test-seed', 1);
      expect(variant1.id).toBe('oak_tree_variant_0');
      expect(variant2.id).toBe('oak_tree_variant_1');
    });

    it('should apply probability to blocks', () => {
      const variant = generateStructureVariant(template, 'test-seed', 0);
      expect(variant.blocks.length).toBeLessThanOrEqual(template.blocks.length);
    });

    it('should be deterministic with same seed and index', () => {
      const variant1a = generateStructureVariant(template, 'seed-123', 0);
      const variant1b = generateStructureVariant(template, 'seed-123', 0);
      expect(variant1a.blocks.length).toBe(variant1b.blocks.length);
    });

    it('should produce different results with different seeds', () => {
      const variant1 = generateStructureVariant(template, 'seed-1', 0);
      const variant2 = generateStructureVariant(template, 'seed-2', 0);
      const sameLength = variant1.blocks.length === variant2.blocks.length;
      expect(sameLength).toBe(false);
    });

    it('should preserve spawn rules in variant', () => {
      const variant = generateStructureVariant(template, 'test-seed', 0);
      expect(variant.spawnRules).toEqual(template.spawnRules);
    });
  });

  describe('placeStructure()', () => {
    const simpleTemplate: StructureTemplate = {
      id: 'test',
      name: 'Test',
      width: 3,
      height: 3,
      depth: 2,
      blocks: [
        { x: 0, y: 0, z: 0, blockType: 'stone' },
        { x: 1, y: 0, z: 0, blockType: 'dirt' },
        { x: 2, y: 0, z: 0, blockType: 'grass' },
        { x: 1, y: 1, z: 1, blockType: 'stone' },
      ],
      spawnRules: { onlyOnSurface: true },
    };

    it('should place structure at world coordinates (rotation 0)', () => {
      const placed = placeStructure(simpleTemplate, 100, 200, 10, 0);
      expect(placed).toHaveLength(4);
      expect(placed[0]).toEqual({ x: 100, y: 200, z: 10, blockType: 'stone' });
      expect(placed[1]).toEqual({ x: 101, y: 200, z: 10, blockType: 'dirt' });
      expect(placed[2]).toEqual({ x: 102, y: 200, z: 10, blockType: 'grass' });
      expect(placed[3]).toEqual({ x: 101, y: 201, z: 11, blockType: 'stone' });
    });

    it('should rotate structure 90 degrees', () => {
      const placed = placeStructure(simpleTemplate, 0, 0, 0, 90);
      const firstBlock = placed.find((b) => b.blockType === 'stone' && b.z === 0);
      expect(firstBlock).toBeDefined();
      expect(firstBlock?.x).toBe(simpleTemplate.height - 1);
      expect(firstBlock?.y).toBe(0);
    });

    it('should rotate structure 180 degrees', () => {
      const placed = placeStructure(simpleTemplate, 0, 0, 0, 180);
      const firstBlock = placed.find((b) => b.blockType === 'stone' && b.z === 0);
      expect(firstBlock).toBeDefined();
      expect(firstBlock?.x).toBe(simpleTemplate.width - 1);
      expect(firstBlock?.y).toBe(simpleTemplate.height - 1);
    });

    it('should rotate structure 270 degrees', () => {
      const placed = placeStructure(simpleTemplate, 0, 0, 0, 270);
      const firstBlock = placed.find((b) => b.blockType === 'stone' && b.z === 0);
      expect(firstBlock).toBeDefined();
      expect(firstBlock?.y).toBe(simpleTemplate.width - 1);
    });

    it('should preserve block types after rotation', () => {
      const placed90 = placeStructure(simpleTemplate, 0, 0, 0, 90);
      const placed180 = placeStructure(simpleTemplate, 0, 0, 0, 180);
      const placed270 = placeStructure(simpleTemplate, 0, 0, 0, 270);

      expect(placed90.map((b) => b.blockType).sort()).toEqual(['dirt', 'grass', 'stone', 'stone']);
      expect(placed180.map((b) => b.blockType).sort()).toEqual(['dirt', 'grass', 'stone', 'stone']);
      expect(placed270.map((b) => b.blockType).sort()).toEqual(['dirt', 'grass', 'stone', 'stone']);
    });

    it('should place all blocks from complex template', () => {
      const placed = placeStructure(STRUCTURE_TEMPLATES.stone_ruin, 50, 50, 5, 0);
      expect(placed.length).toBe(STRUCTURE_TEMPLATES.stone_ruin.blocks.length);
    });
  });

  describe('canSpawnStructure()', () => {
    const template: StructureTemplate = {
      id: 'test',
      name: 'Test',
      width: 5,
      height: 5,
      depth: 3,
      blocks: [],
      spawnRules: {
        biomes: ['forest', 'plains'],
        minDistance: 50,
        rarity: 0.5,
        onlyOnSurface: true,
        minElevation: 10,
        maxElevation: 100,
      },
    };

    it('should allow spawn in valid biome', () => {
      const result = canSpawnStructure(template, 0, 0, 5, 'forest', 50, []);
      expect(result).toBe(true);
    });

    it('should reject spawn in invalid biome', () => {
      const result = canSpawnStructure(template, 0, 0, 5, 'desert', 50, []);
      expect(result).toBe(false);
    });

    it('should reject spawn below minimum elevation', () => {
      const result = canSpawnStructure(template, 0, 0, 5, 'forest', 5, []);
      expect(result).toBe(false);
    });

    it('should reject spawn above maximum elevation', () => {
      const result = canSpawnStructure(template, 0, 0, 5, 'forest', 150, []);
      expect(result).toBe(false);
    });

    it('should reject spawn underground when onlyOnSurface is true', () => {
      const result = canSpawnStructure(template, 0, 0, -5, 'forest', 50, []);
      expect(result).toBe(false);
    });

    it('should allow spawn on surface when onlyOnSurface is true', () => {
      const result = canSpawnStructure(template, 0, 0, 5, 'forest', 50, []);
      expect(result).toBe(true);
    });

    it('should reject spawn too close to existing structure', () => {
      const existingStructures = [{ x: 25, y: 25, z: 5, template }];
      const result = canSpawnStructure(template, 30, 30, 5, 'forest', 50, existingStructures);
      expect(result).toBe(false);
    });

    it('should allow spawn far from existing structures', () => {
      const existingStructures = [{ x: 0, y: 0, z: 5, template }];
      const result = canSpawnStructure(template, 100, 100, 5, 'forest', 50, existingStructures);
      expect(result).toBe(true);
    });

    it('should calculate distance correctly', () => {
      const existingStructures = [{ x: 0, y: 0, z: 5, template }];
      const result1 = canSpawnStructure(template, 50, 0, 5, 'forest', 50, existingStructures);
      expect(result1).toBe(true);

      const result2 = canSpawnStructure(template, 30, 40, 5, 'forest', 50, existingStructures);
      expect(result2).toBe(true);
    });

    it('should work with underground spawn rules', () => {
      const undergroundTemplate: StructureTemplate = {
        ...template,
        spawnRules: {
          underground: true,
          onlyOnSurface: false,
        },
      };

      const result1 = canSpawnStructure(undergroundTemplate, 0, 0, -5, 'cave', 0, []);
      expect(result1).toBe(true);

      const result2 = canSpawnStructure(undergroundTemplate, 0, 0, 5, 'cave', 0, []);
      expect(result2).toBe(false);
    });

    it('should work without biome restrictions', () => {
      const templateNoBiome: StructureTemplate = {
        ...template,
        spawnRules: {
          onlyOnSurface: true,
        },
      };

      const result = canSpawnStructure(templateNoBiome, 0, 0, 5, 'any_biome', 50, []);
      expect(result).toBe(true);
    });
  });

  describe('JSON serialization', () => {
    it('should save template to JSON', () => {
      const template = STRUCTURE_TEMPLATES.oak_tree;
      const json = saveStructureToJSON(template);
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.id).toBe('oak_tree');
      expect(parsed.blocks).toBeDefined();
    });

    it('should load template from JSON', () => {
      const original = STRUCTURE_TEMPLATES.shrine;
      const json = saveStructureToJSON(original);
      const loaded = loadStructureFromJSON(json);
      expect(loaded.id).toBe(original.id);
      expect(loaded.name).toBe(original.name);
      expect(loaded.width).toBe(original.width);
      expect(loaded.blocks.length).toBe(original.blocks.length);
    });

    it('should preserve spawn rules in serialization', () => {
      const template = STRUCTURE_TEMPLATES.village_house;
      const json = saveStructureToJSON(template);
      const loaded = loadStructureFromJSON(json);
      expect(loaded.spawnRules).toEqual(template.spawnRules);
    });

    it('should format JSON with indentation', () => {
      const template = STRUCTURE_TEMPLATES.oak_tree;
      const json = saveStructureToJSON(template);
      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });
  });
});
