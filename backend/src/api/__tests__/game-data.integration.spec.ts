/**
 * Game Data API integration tests
 * Full coverage for all 20+ SRD endpoints
 * @file backend/src/api/__tests__/game-data.integration.spec.ts
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import { app, httpServer } from '../../server.js';

// Mock worker pool to avoid import.meta.url issues
jest.mock('@/workers/workerPool');

describe('Game Data API Integration', () => {
  beforeAll(() => {
    if (httpServer.listening) {
      httpServer.close();
    }
  });

  afterAll(() => {
    if (httpServer.listening) {
      httpServer.close();
    }
  });

  // Helper to test list endpoints
  const testListEndpoint = (path: string, resourceName: string) => {
    describe(`GET ${path}`, () => {
      it(`should list all ${resourceName} without authentication`, async () => {
        const response = await request(app).get(path).expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).toHaveProperty('id');
          expect(response.body.data[0]).toHaveProperty('name');
        }
      });

      it(`should return ${resourceName} with required fields`, async () => {
        const response = await request(app).get(path).expect(200);

        if (response.body.data.length > 0) {
          const item = response.body.data[0];
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('name');
          expect(typeof item.id).toBe('string');
          expect(typeof item.name).toBe('string');
        }
      });
    });
  };

  // Helper to test get-by-id endpoints
  const testGetByIdEndpoint = (path: string, resourceName: string) => {
    describe(`GET ${path}/:id`, () => {
      it(`should return ${resourceName} by ID`, async () => {
        // First get list to find a valid ID
        const listResponse = await request(app).get(path).expect(200);

        if (listResponse.body.data.length > 0) {
          const itemId = listResponse.body.data[0].id || listResponse.body.data[0].index;

          const response = await request(app).get(`${path}/${itemId}`).expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.data).toHaveProperty('id');
          expect(response.body.data).toHaveProperty('name');
        }
      });

      it(`should return 404 for nonexistent ${resourceName} ID`, async () => {
        await request(app).get(`${path}/nonexistent-id-12345`).expect(404);
      });

      it(`should not require authentication`, async () => {
        const listResponse = await request(app).get(path).expect(200);

        if (listResponse.body.data.length > 0) {
          const itemId = listResponse.body.data[0].id || listResponse.body.data[0].index;

          await request(app)
            .get(`${path}/${itemId}`)
            .set('Authorization', '') // No auth
            .expect(200);
        }
      });
    });
  };

  // Test all SRD endpoints
  testListEndpoint('/api/game-data/classes', 'classes');
  testGetByIdEndpoint('/api/game-data/classes', 'class');

  testListEndpoint('/api/game-data/races', 'races');
  testGetByIdEndpoint('/api/game-data/races', 'race');

  testListEndpoint('/api/game-data/backgrounds', 'backgrounds');
  testGetByIdEndpoint('/api/game-data/backgrounds', 'background');

  testListEndpoint('/api/game-data/skills', 'skills');
  testGetByIdEndpoint('/api/game-data/skills', 'skill');

  testListEndpoint('/api/game-data/ability-scores', 'ability scores');
  testGetByIdEndpoint('/api/game-data/ability-scores', 'ability score');

  testListEndpoint('/api/game-data/alignments', 'alignments');
  testGetByIdEndpoint('/api/game-data/alignments', 'alignment');

  testListEndpoint('/api/game-data/languages', 'languages');
  testGetByIdEndpoint('/api/game-data/languages', 'language');

  testListEndpoint('/api/game-data/proficiencies', 'proficiencies');
  testGetByIdEndpoint('/api/game-data/proficiencies', 'proficiency');

  testListEndpoint('/api/game-data/equipment', 'equipment');
  testGetByIdEndpoint('/api/game-data/equipment', 'equipment item');

  testListEndpoint('/api/game-data/weapons', 'weapons');
  testGetByIdEndpoint('/api/game-data/weapons', 'weapon');

  testListEndpoint('/api/game-data/armor', 'armor');
  testGetByIdEndpoint('/api/game-data/armor', 'armor item');

  testListEndpoint('/api/game-data/magic-items', 'magic items');
  testGetByIdEndpoint('/api/game-data/magic-items', 'magic item');

  testListEndpoint('/api/game-data/monsters', 'monsters');
  testGetByIdEndpoint('/api/game-data/monsters', 'monster');

  testListEndpoint('/api/game-data/conditions', 'conditions');
  testGetByIdEndpoint('/api/game-data/conditions', 'condition');

  testListEndpoint('/api/game-data/damage-types', 'damage types');
  testGetByIdEndpoint('/api/game-data/damage-types', 'damage type');

  testListEndpoint('/api/game-data/magic-schools', 'magic schools');
  testGetByIdEndpoint('/api/game-data/magic-schools', 'magic school');

  testListEndpoint('/api/game-data/features', 'features');
  testGetByIdEndpoint('/api/game-data/features', 'feature');

  testListEndpoint('/api/game-data/traits', 'traits');
  testGetByIdEndpoint('/api/game-data/traits', 'trait');

  testListEndpoint('/api/game-data/rules', 'rules');
  testGetByIdEndpoint('/api/game-data/rules', 'rule');

  testListEndpoint('/api/game-data/rule-sections', 'rule sections');
  testGetByIdEndpoint('/api/game-data/rule-sections', 'rule section');

  // Additional edge case tests
  describe('Edge Cases', () => {
    it('should handle malformed IDs gracefully', async () => {
      await request(app).get('/api/game-data/classes/!!!invalid!!!').expect(404);
    });

    it('should handle empty path segments', async () => {
      const response = await request(app).get('/api/game-data/classes/').expect(200);
      // Should return list, not 404
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle trailing slashes', async () => {
      const response = await request(app).get('/api/game-data/classes/').expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return consistent data structure across endpoints', async () => {
      const classes = await request(app).get('/api/game-data/classes').expect(200);
      const races = await request(app).get('/api/game-data/races').expect(200);

      // Both should be wrapped in successResponse
      expect(classes.body.success).toBe(true);
      expect(races.body.success).toBe(true);
      expect(Array.isArray(classes.body.data)).toBe(true);
      expect(Array.isArray(races.body.data)).toBe(true);

      if (classes.body.data.length > 0) {
        expect(classes.body.data[0]).toHaveProperty('id');
        expect(classes.body.data[0]).toHaveProperty('name');
      }

      if (races.body.data.length > 0) {
        expect(races.body.data[0]).toHaveProperty('id');
        expect(races.body.data[0]).toHaveProperty('name');
      }
    });
  });

  // Performance tests
  describe('Performance', () => {
    it('should respond quickly to list requests', async () => {
      const start = Date.now();
      await request(app).get('/api/game-data/classes').expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should respond in under 1 second
    });

    it('should handle multiple concurrent requests', async () => {
      const requests = [
        request(app).get('/api/game-data/classes'),
        request(app).get('/api/game-data/races'),
        request(app).get('/api/game-data/weapons'),
        request(app).get('/api/game-data/spells'),
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });
  });
});
