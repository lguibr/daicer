/**
 * Spells API integration tests
 * @file backend/src/api/__tests__/spells.integration.spec.ts
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import { app, httpServer } from '../../server.js';

// Mock worker pool to avoid import.meta.url issues
jest.mock('@/workers/workerPool');

describe('Spells API Integration', () => {
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

  describe('GET /api/spells', () => {
    it('should list all spells without authentication', async () => {
      const response = await request(app).get('/api/spells').expect(200);

      expect(response.body).toHaveProperty('spells');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.spells)).toBe(true);
    });

    it('should return spells with required fields', async () => {
      const response = await request(app).get('/api/spells').expect(200);

      if (response.body.spells.length > 0) {
        const spell = response.body.spells[0];
        expect(spell).toHaveProperty('id');
        expect(spell).toHaveProperty('name');
        expect(spell).toHaveProperty('level');
        expect(spell).toHaveProperty('school');
      }
    });

    it('should filter spells by level', async () => {
      const response = await request(app).get('/api/spells?level=1').expect(200);

      expect(response.body.spells).toBeInstanceOf(Array);
      response.body.spells.forEach((spell: any) => {
        expect(spell.level).toBe(1);
      });
    });

    it('should filter spells by school', async () => {
      const response = await request(app).get('/api/spells?school=evocation').expect(200);

      expect(response.body.spells).toBeInstanceOf(Array);
      response.body.spells.forEach((spell: any) => {
        expect(spell.school.toLowerCase()).toBe('evocation');
      });
    });

    it('should filter spells by class', async () => {
      const response = await request(app).get('/api/spells?class=Wizard').expect(200);

      expect(response.body.spells).toBeInstanceOf(Array);
      response.body.spells.forEach((spell: any) => {
        expect(spell.classes).toContain('Wizard');
      });
    });

    it('should paginate results', async () => {
      const page1 = await request(app).get('/api/spells?page=1&limit=5').expect(200);
      const page2 = await request(app).get('/api/spells?page=2&limit=5').expect(200);

      expect(page1.body.spells).toHaveLength(5);
      expect(page1.body.page).toBe(1);
      expect(page2.body.page).toBe(2);
      // Pages should have different spells
      expect(page1.body.spells[0]?.id).not.toBe(page2.body.spells[0]?.id);
    });

    it('should handle large page numbers gracefully', async () => {
      const response = await request(app).get('/api/spells?page=9999&limit=10').expect(200);

      expect(response.body.spells).toBeInstanceOf(Array);
      expect(response.body.page).toBe(9999);
    });

    it('should combine multiple filters', async () => {
      const response = await request(app).get('/api/spells?level=1&school=evocation&class=Wizard').expect(200);

      expect(response.body.spells).toBeInstanceOf(Array);
      response.body.spells.forEach((spell: any) => {
        expect(spell.level).toBe(1);
        expect(spell.school.toLowerCase()).toBe('evocation');
        expect(spell.classes).toContain('Wizard');
      });
    });

    it('should filter spells by effect shape', async () => {
      const response = await request(app).get('/api/spells?effectShape=cone').expect(200);

      expect(response.body.spells).toBeInstanceOf(Array);
      response.body.spells.forEach((spell: any) => {
        expect(spell.effectShape).toBe('cone');
      });
    });

    it('should search spells by name', async () => {
      const response = await request(app).get('/api/spells?name=fire').expect(200);

      expect(response.body.spells).toBeInstanceOf(Array);
      response.body.spells.forEach((spell: any) => {
        expect(spell.name.toLowerCase()).toContain('fire');
      });
    });

    it('should support pagination', async () => {
      const response1 = await request(app).get('/api/spells?page=1&limit=10').expect(200);

      expect(response1.body.page).toBe(1);
      expect(response1.body.limit).toBe(10);
      expect(response1.body.spells.length).toBeLessThanOrEqual(10);
      expect(response1.body).toHaveProperty('totalPages');
    });

    it('should return different pages with pagination', async () => {
      const response1 = await request(app).get('/api/spells?page=1&limit=5').expect(200);

      const response2 = await request(app).get('/api/spells?page=2&limit=5').expect(200);

      if (response1.body.spells.length > 0 && response2.body.spells.length > 0) {
        expect(response1.body.spells[0].id).not.toBe(response2.body.spells[0].id);
      }
    });

    it('should combine multiple filters', async () => {
      const response = await request(app).get('/api/spells?level=1&school=evocation').expect(200);

      response.body.spells.forEach((spell: any) => {
        expect(spell.level).toBe(1);
        expect(spell.school.toLowerCase()).toBe('evocation');
      });
    });

    it('should return empty array when no spells match filters', async () => {
      const response = await request(app).get('/api/spells?level=99').expect(200);

      expect(response.body.spells).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  describe('GET /api/spells/:id', () => {
    it('should return spell by ID', async () => {
      // First get list to find a valid ID
      const listResponse = await request(app).get('/api/spells?limit=1').expect(200);

      if (listResponse.body.spells.length > 0) {
        const spellId = listResponse.body.spells[0].id;

        const response = await request(app).get(`/api/spells/${spellId}`).expect(200);

        expect(response.body).toHaveProperty('id', spellId);
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('level');
      }
    });

    it('should return 404 for nonexistent spell ID', async () => {
      await request(app).get('/api/spells/nonexistent-spell-id').expect(404);
    });

    it('should not require authentication', async () => {
      const listResponse = await request(app).get('/api/spells?limit=1').expect(200);

      if (listResponse.body.spells.length > 0) {
        const spellId = listResponse.body.spells[0].id;

        await request(app)
          .get(`/api/spells/${spellId}`)
          .set('Authorization', '') // No auth
          .expect(200);
      }
    });

    it('should return complete spell details', async () => {
      const listResponse = await request(app).get('/api/spells?limit=1').expect(200);

      if (listResponse.body.spells.length > 0) {
        const spellId = listResponse.body.spells[0].id;

        const response = await request(app).get(`/api/spells/${spellId}`).expect(200);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('level');
        expect(response.body).toHaveProperty('school');
        expect(response.body).toHaveProperty('description');
      }
    });
  });
});
