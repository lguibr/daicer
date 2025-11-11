/**
 * @file backend/src/api/__tests__/spells.test.ts
 * @description Tests for spell API endpoints and data structure
 */

import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

// Test the spell data directly without server dependencies
function loadSpells() {
  // Use relative path from test file location
  const spellsPath = join(process.cwd(), '..', 'seeds', 'game-data', 'spells.json');
  const data = readFileSync(spellsPath, 'utf-8');
  return JSON.parse(data);
}

describe('Spells API Logic', () => {
  describe('Spell Data Loading', () => {
    it('loads spell data from JSON', () => {
      const spells = loadSpells();

      expect(Array.isArray(spells)).toBe(true);
      expect(spells.length).toBeGreaterThan(400);
    });

    it('all spells have required fields', () => {
      const spells = loadSpells();

      spells.forEach((spell: any) => {
        expect(spell).toHaveProperty('id');
        expect(spell).toHaveProperty('name');
        expect(spell).toHaveProperty('level');
        expect(spell).toHaveProperty('school');
        expect(spell).toHaveProperty('effectShape');
        expect(spell).toHaveProperty('effectDimensions');
      });
    });

    it('spell levels are 0-9 (not character levels)', () => {
      const spells = loadSpells();

      spells.forEach((spell: any) => {
        expect(spell.level).toBeGreaterThanOrEqual(0);
        expect(spell.level).toBeLessThanOrEqual(9);
      });
    });
  });

  describe('Filtering Logic', () => {
    it('filters by spell level', () => {
      const spells = loadSpells();
      const cantrips = spells.filter((s: any) => s.level === 0);

      expect(cantrips.length).toBeGreaterThan(0);
      expect(cantrips.every((s: any) => s.level === 0)).toBe(true);
    });

    it('filters by school', () => {
      const spells = loadSpells();
      const evocation = spells.filter((s: any) => s.school === 'evocation');

      expect(evocation.length).toBeGreaterThan(0);
      expect(evocation.every((s: any) => s.school === 'evocation')).toBe(true);
    });

    it('filters by effect shape', () => {
      const spells = loadSpells();
      const cones = spells.filter((s: any) => s.effectShape === 'cone');

      expect(cones.length).toBeGreaterThan(0);
      expect(cones.every((s: any) => s.effectShape === 'cone')).toBe(true);
    });

    it('finds specific spell by ID', () => {
      const spells = loadSpells();
      const fireball = spells.find((s: any) => s.id === 'fireball');

      expect(fireball).toBeDefined();
      expect(fireball.name).toContain('Fire');
      expect(fireball.effectShape).toBe('sphere');
    });
  });

  describe('Effect Shape Coverage', () => {
    it('has cone spells', () => {
      const spells = loadSpells();
      const cones = spells.filter((s: any) => s.effectShape === 'cone');
      expect(cones.length).toBeGreaterThan(5);
    });

    it('has sphere spells', () => {
      const spells = loadSpells();
      const spheres = spells.filter((s: any) => s.effectShape === 'sphere');
      expect(spheres.length).toBeGreaterThan(15);
    });

    it('has line spells', () => {
      const spells = loadSpells();
      const lines = spells.filter((s: any) => s.effectShape === 'line');
      expect(lines.length).toBeGreaterThan(5);
    });

    it('has cube spells', () => {
      const spells = loadSpells();
      const cubes = spells.filter((s: any) => s.effectShape === 'cube');
      expect(cubes.length).toBeGreaterThan(20);
    });

    it('has all critical shapes for combat', () => {
      const spells = loadSpells();
      const shapes = new Set(spells.map((s: any) => s.effectShape));

      expect(shapes.has('cone')).toBe(true);
      expect(shapes.has('line')).toBe(true);
      expect(shapes.has('sphere')).toBe(true);
      expect(shapes.has('cube')).toBe(true);
      expect(shapes.has('cylinder')).toBe(true);
      expect(shapes.has('melee_touch')).toBe(true);
      expect(shapes.has('ranged_single')).toBe(true);
    });
  });
});
