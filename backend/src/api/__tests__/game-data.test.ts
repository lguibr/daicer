/**
 * Game Data API endpoint tests
 */

import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../../server';
import { initializeFirebase, getDb } from '@/config/firebase';

jest.mock('mime');

describe('Game Data API', () => {
  beforeAll(async () => {
    // Ensure Firebase is initialized for tests
    initializeFirebase();

    // Seed minimal test data
    const db = getDb();

    // Add test race
    await db
      .collection('game_data_races')
      .doc('human')
      .set({
        id: 'human',
        name: 'Human',
        description: 'Humans are the most adaptable and ambitious people.',
        speed: 30,
        size: 'Medium',
        abilityBonuses: [
          { ability: 'STR', bonus: 1 },
          { ability: 'DEX', bonus: 1 },
          { ability: 'CON', bonus: 1 },
          { ability: 'INT', bonus: 1 },
          { ability: 'WIS', bonus: 1 },
          { ability: 'CHA', bonus: 1 },
        ],
        imageUrl: null,
      });

    // Add test class
    await db
      .collection('game_data_classes')
      .doc('fighter')
      .set({
        id: 'fighter',
        name: 'Fighter',
        description: 'A master of martial combat.',
        hitDie: 10,
        primaryAbility: 'Strength or Dexterity',
        savingThrows: ['Strength', 'Constitution'],
        proficiencies: {
          armor: ['All armor', 'shields'],
          weapons: ['Simple weapons', 'martial weapons'],
          skills: {
            choose: 2,
            from: [
              'Acrobatics',
              'Animal Handling',
              'Athletics',
              'History',
              'Insight',
              'Intimidation',
              'Perception',
              'Survival',
            ],
          },
        },
        imageUrl: null,
      });

    // Add test background
    await db
      .collection('game_data_backgrounds')
      .doc('soldier')
      .set({
        id: 'soldier',
        name: 'Soldier',
        description: 'You have a military background.',
        skillProficiencies: ['Athletics', 'Intimidation'],
        toolProficiencies: ['Gaming set'],
        languages: 0,
        equipment: ['Insignia of rank', 'Trophy', 'Playing card set', 'Common clothes', '10 gp'],
        imageUrl: null,
      });

    // Add test alignment
    await db.collection('game_data_alignments').doc('lawful-good').set({
      id: 'lawful-good',
      name: 'Lawful Good',
      abbreviation: 'LG',
      description: 'Creatures that can be counted on to do the right thing.',
      imageUrl: null,
    });

    // Add test ability
    await db.collection('game_data_abilities').doc('strength').set({
      id: 'strength',
      name: 'Strength',
      abbreviation: 'STR',
      description: 'Measures physical power.',
      imageUrl: null,
    });

    // Add test skill
    await db.collection('game_data_skills').doc('athletics').set({
      id: 'athletics',
      name: 'Athletics',
      ability: 'Strength',
      description: 'Your Strength check covers difficult situations.',
      imageUrl: null,
    });
  });

  afterAll(async () => {
    // Clean up test data
    const db = getDb();
    await db.collection('game_data_races').doc('human').delete();
    await db.collection('game_data_classes').doc('fighter').delete();
    await db.collection('game_data_backgrounds').doc('soldier').delete();
    await db.collection('game_data_alignments').doc('lawful-good').delete();
    await db.collection('game_data_abilities').doc('strength').delete();
    await db.collection('game_data_skills').doc('athletics').delete();
  });

  describe('GET /api/game-data/races', () => {
    test('returns list of races', async () => {
      const res = await request(app).get('/api/game-data/races').expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const human = res.body.data.find((r: any) => r.id === 'human');
      expect(human).toBeDefined();
      expect(human.name).toBe('Human');
      expect(human.speed).toBe(30);
      expect(human).toHaveProperty('imageUrl');
    });

    test('includes required fields', async () => {
      const res = await request(app).get('/api/game-data/races').expect(200);

      const race = res.body.data[0];
      expect(race).toHaveProperty('id');
      expect(race).toHaveProperty('name');
      expect(race).toHaveProperty('description');
      expect(race).toHaveProperty('speed');
      expect(race).toHaveProperty('size');
      expect(race).toHaveProperty('imageUrl');
    });
  });

  describe('GET /api/game-data/classes', () => {
    test('returns list of classes', async () => {
      const res = await request(app).get('/api/game-data/classes').expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const fighter = res.body.data.find((c: any) => c.id === 'fighter');
      expect(fighter).toBeDefined();
      expect(fighter.name).toBe('Fighter');
      expect(fighter.hitDie).toBe(10);
      expect(fighter).toHaveProperty('imageUrl');
    });

    test('includes required fields', async () => {
      const res = await request(app).get('/api/game-data/classes').expect(200);

      const charClass = res.body.data[0];
      expect(charClass).toHaveProperty('id');
      expect(charClass).toHaveProperty('name');
      expect(charClass).toHaveProperty('description');
      expect(charClass).toHaveProperty('hitDie');
      expect(charClass).toHaveProperty('primaryAbility');
      expect(charClass).toHaveProperty('savingThrows');
      expect(charClass).toHaveProperty('imageUrl');
    });
  });

  describe('GET /api/game-data/backgrounds', () => {
    test('returns list of backgrounds', async () => {
      const res = await request(app).get('/api/game-data/backgrounds').expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const soldier = res.body.data.find((b: any) => b.id === 'soldier');
      expect(soldier).toBeDefined();
      expect(soldier.name).toBe('Soldier');
      expect(soldier).toHaveProperty('imageUrl');
    });

    test('includes required fields', async () => {
      const res = await request(app).get('/api/game-data/backgrounds').expect(200);

      const background = res.body.data[0];
      expect(background).toHaveProperty('id');
      expect(background).toHaveProperty('name');
      expect(background).toHaveProperty('description');
      expect(background).toHaveProperty('imageUrl');
    });
  });

  describe('GET /api/game-data/alignments', () => {
    test('returns list of alignments', async () => {
      const res = await request(app).get('/api/game-data/alignments').expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('includes abbreviations', async () => {
      const res = await request(app).get('/api/game-data/alignments').expect(200);

      const alignment = res.body.data[0];
      expect(alignment).toHaveProperty('id');
      expect(alignment).toHaveProperty('name');
      expect(alignment).toHaveProperty('abbreviation');
    });
  });

  describe('GET /api/game-data/skills', () => {
    test('returns list of skills', async () => {
      const res = await request(app).get('/api/game-data/skills').expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('skills have ability associations', async () => {
      const res = await request(app).get('/api/game-data/skills').expect(200);

      const athletics = res.body.data.find((s: any) => s.id === 'athletics');
      expect(athletics).toBeDefined();
      expect(athletics.ability).toBe('Strength');
    });
  });

  describe('GET /api/game-data/abilities', () => {
    test('returns list of abilities', async () => {
      const res = await request(app).get('/api/game-data/abilities').expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('abilities have abbreviations', async () => {
      const res = await request(app).get('/api/game-data/abilities').expect(200);

      const strength = res.body.data.find((a: any) => a.id === 'strength');
      expect(strength).toBeDefined();
      expect(strength.abbreviation).toBe('STR');
    });
  });

  describe('GET /api/game-data/conditions', () => {
    test('returns list of conditions', async () => {
      const res = await request(app).get('/api/game-data/conditions').expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/game-data/damage-types', () => {
    test('returns list of damage types', async () => {
      const res = await request(app).get('/api/game-data/damage-types').expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/game-data/languages', () => {
    test('returns list of languages', async () => {
      const res = await request(app).get('/api/game-data/languages').expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/game-data/magic-schools', () => {
    test('returns list of magic schools', async () => {
      const res = await request(app).get('/api/game-data/magic-schools').expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/game-data/equipment-categories', () => {
    test('returns list of equipment categories', async () => {
      const res = await request(app).get('/api/game-data/equipment-categories').expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/game-data/equipment', () => {
    test('returns list of equipment', async () => {
      const res = await request(app).get('/api/game-data/equipment').expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/game-data/weapon-properties', () => {
    test('returns list of weapon properties', async () => {
      const res = await request(app).get('/api/game-data/weapon-properties').expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
