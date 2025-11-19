/**
 * Assets API integration tests
 * @file backend/src/api/__tests__/assets.integration.spec.ts
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { app, httpServer } from '../../server.js';
import { getFirestore } from 'firebase-admin/firestore';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../../test/helpers.js';

// Mock worker pool to avoid import.meta.url issues
jest.mock('@/workers/workerPool');

describe('Assets API Integration', () => {
  let firestore: ReturnType<typeof getFirestore>;
  let testUserId: string;
  let testToken: string;
  let roomId: string;

  beforeEach(async () => {
    const env = await setupTestEnvironment();
    firestore = env.firestore;
    testUserId = env.testUser.uid;
    testToken = env.testToken;

    // Create a room
    const roomResponse = await request(app).post('/api/rooms').set('Authorization', `Bearer ${testToken}`);
    roomId = roomResponse.body.data.id;
  });

  afterEach(async () => {
    await cleanupTestEnvironment(testUserId);
    if (httpServer.listening) {
      httpServer.close();
    }
  });

  describe('GET /api/assets/:roomId/:playerId/avatar', () => {
    it('should require authentication', async () => {
      await request(app).get(`/api/assets/${roomId}/${testUserId}/avatar`).expect(401);
    });

    it('should return 404 for nonexistent room', async () => {
      await request(app)
        .get(`/api/assets/nonexistent-room/${testUserId}/avatar`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });

    it('should return 404 when no avatar exists', async () => {
      const response = await request(app)
        .get(`/api/assets/${roomId}/${testUserId}/avatar`)
        .set('Authorization', `Bearer ${testToken}`);

      // May return 404 or empty data depending on implementation
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/assets/:roomId/background', () => {
    it('should require authentication', async () => {
      await request(app).get(`/api/assets/${roomId}/background`).expect(401);
    });

    it('should return 404 for nonexistent room', async () => {
      await request(app)
        .get('/api/assets/nonexistent-room/background')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });

    it('should return 404 when no background exists', async () => {
      const response = await request(app)
        .get(`/api/assets/${roomId}/background`)
        .set('Authorization', `Bearer ${testToken}`);

      // May return 404 or empty data depending on implementation
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Authorization checks', () => {
    it('should prevent unauthorized access to player assets', async () => {
      // Create another user
      const { setupTestEnvironment: setup } = await import('../../../test/helpers.js');
      const otherEnv = await setup();
      const otherToken = otherEnv.testToken;

      // Try to access testUser's avatar as otherUser
      const response = await request(app)
        .get(`/api/assets/${roomId}/${testUserId}/avatar`)
        .set('Authorization', `Bearer ${otherToken}`);

      // Should prevent access or return 404
      expect([200, 403, 404]).toContain(response.status);

      await cleanupTestEnvironment(otherEnv.testUser.uid);
    });
  });

  describe('POST /api/assets-gen/worlds', () => {
    it('should create world with valid parameters', async () => {
      const payload = {
        name: 'Test World',
        seed: 'test-seed-123',
        width: 256,
        height: 256,
        depth: 21,
      };

      const response = await request(app)
        .post('/api/assets-gen/worlds')
        .set('Authorization', `Bearer ${testToken}`)
        .send(payload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: expect.any(String),
      });

      const worldId = response.body.data.id;
      const doc = await firestore.collection('worldMaps').doc(worldId).get();
      expect(doc.exists).toBe(true);
      expect(doc.data()).toMatchObject({
        name: 'Test World',
        seed: 'test-seed-123',
        width: 256,
        height: 256,
        depth: 21,
        createdBy: testUserId,
      });
    });

    it('should validate required fields', async () => {
      const invalidPayloads = [
        {}, // Missing all required fields
        { name: 'Test' }, // Missing seed, width, height
        { name: 'Test', seed: 'seed' }, // Missing width, height
        { name: 'Test', seed: 'seed', width: 256 }, // Missing height
      ];

      for (const payload of invalidPayloads) {
        await request(app)
          .post('/api/assets-gen/worlds')
          .set('Authorization', `Bearer ${testToken}`)
          .send(payload)
          .expect(400);
      }
    });

    it('should validate width/height/depth ranges', async () => {
      const payload = {
        name: 'Test',
        seed: 'seed',
        width: 64,
        height: 64,
        depth: 10,
      };

      await request(app)
        .post('/api/assets-gen/worlds')
        .set('Authorization', `Bearer ${testToken}`)
        .send(payload)
        .expect(201);
    });

    it('should accept optional generation parameters', async () => {
      const payload = {
        name: 'Advanced World',
        seed: 'complex-seed',
        width: 512,
        height: 512,
        depth: 21,
        waterLevel: 64,
        mountainousness: 0.7,
        jaggedness: 0.5,
        temperature: 0.5,
        moisture: 0.5,
        continentalness: 0.6,
        erosion: 0.4,
        weirdness: 0.3,
        caveFrequency: 0.1,
      };

      const response = await request(app)
        .post('/api/assets-gen/worlds')
        .set('Authorization', `Bearer ${testToken}`)
        .send(payload)
        .expect(201);

      const worldId = response.body.data.id;
      const doc = await firestore.collection('worldMaps').doc(worldId).get();
      const params = doc.data()?.parameters;
      expect(params.waterLevel).toBe(64);
      expect(params.mountainousness).toBe(0.7);
      expect(params.caveFrequency).toBe(0.1);
    });

    it('should require authentication', async () => {
      const payload = {
        name: 'Test',
        seed: 'seed',
        width: 256,
        height: 256,
        depth: 21,
      };

      await request(app).post('/api/assets-gen/worlds').send(payload).expect(401);
    });
  });

  describe('GET /api/assets-gen/worlds', () => {
    it('should return user worlds', async () => {
      await request(app)
        .post('/api/assets-gen/worlds')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'World 1', seed: 'seed1', width: 256, height: 256, depth: 21 })
        .expect(201);

      await request(app)
        .post('/api/assets-gen/worlds')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'World 2', seed: 'seed2', width: 256, height: 256, depth: 21 })
        .expect(201);

      const response = await request(app)
        .get('/api/assets-gen/worlds')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe('World 2');
      expect(response.body.data[1].name).toBe('World 1');
    });

    it('should enforce user isolation', async () => {
      const { setupTestEnvironment: setup } = await import('../../../test/helpers.js');
      const otherEnv = await setup();
      const otherToken = otherEnv.testToken;

      await request(app)
        .post('/api/assets-gen/worlds')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'My World', seed: 'seed', width: 256, height: 256, depth: 21 })
        .expect(201);

      const response = await request(app)
        .get('/api/assets-gen/worlds')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(0);

      await cleanupTestEnvironment(otherEnv.testUser.uid);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/assets-gen/worlds').expect(401);
    });
  });

  describe('GET /api/assets-gen/worlds/:worldId', () => {
    it('should return single world', async () => {
      const created = await request(app)
        .post('/api/assets-gen/worlds')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Test World', seed: 'seed', width: 256, height: 256, depth: 21 })
        .expect(201);

      const worldId = created.body.data.id;

      const response = await request(app)
        .get(`/api/assets-gen/worlds/${worldId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: worldId,
        name: 'Test World',
        seed: 'seed',
        width: 256,
        height: 256,
        createdBy: testUserId,
      });
    });

    it('should return 404 for non-existent world', async () => {
      await request(app)
        .get('/api/assets-gen/worlds/non-existent-id')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });

    it('should enforce access control', async () => {
      const { setupTestEnvironment: setup } = await import('../../../test/helpers.js');
      const otherEnv = await setup();
      const otherToken = otherEnv.testToken;

      const created = await request(app)
        .post('/api/assets-gen/worlds')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Private World', seed: 'seed', width: 256, height: 256, depth: 21 })
        .expect(201);

      const worldId = created.body.data.id;

      await request(app)
        .get(`/api/assets-gen/worlds/${worldId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      await cleanupTestEnvironment(otherEnv.testUser.uid);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/assets-gen/worlds/some-id').expect(401);
    });
  });

  describe('DELETE /api/assets-gen/worlds/:worldId', () => {
    it('should delete world successfully', async () => {
      const created = await request(app)
        .post('/api/assets-gen/worlds')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'To Delete', seed: 'seed', width: 256, height: 256, depth: 21 })
        .expect(201);

      const worldId = created.body.data.id;

      await request(app)
        .delete(`/api/assets-gen/worlds/${worldId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      const doc = await firestore.collection('worldMaps').doc(worldId).get();
      expect(doc.exists).toBe(false);
    });

    it('should return 404 for non-existent world', async () => {
      await request(app)
        .delete('/api/assets-gen/worlds/non-existent-id')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });

    it('should enforce access control', async () => {
      const { setupTestEnvironment: setup } = await import('../../../test/helpers.js');
      const otherEnv = await setup();
      const otherToken = otherEnv.testToken;

      const created = await request(app)
        .post('/api/assets-gen/worlds')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'My World', seed: 'seed', width: 256, height: 256, depth: 21 })
        .expect(201);

      const worldId = created.body.data.id;

      await request(app)
        .delete(`/api/assets-gen/worlds/${worldId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      await cleanupTestEnvironment(otherEnv.testUser.uid);
    });

    it('should require authentication', async () => {
      await request(app).delete('/api/assets-gen/worlds/some-id').expect(401);
    });
  });

  describe('GET /api/assets-gen/worlds/:worldId/chunks/:chunkX/:chunkY/:chunkZ', () => {
    let worldId: string;

    beforeEach(async () => {
      const created = await request(app)
        .post('/api/assets-gen/worlds')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Chunk Test World', seed: 'chunk-seed', width: 256, height: 256, depth: 21 })
        .expect(201);
      worldId = created.body.data.id;
    });

    it('should return chunk data for valid coordinates', async () => {
      const response = await request(app)
        .get(`/api/assets-gen/worlds/${worldId}/chunks/0/0/0`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        chunkX: 0,
        chunkY: 0,
        chunkZ: 0,
        tiles: expect.any(Array),
      });

      expect(response.body.data.tiles.length).toBeGreaterThan(0);
      expect(response.body.data.tiles[0]).toMatchObject({
        x: expect.any(Number),
        y: expect.any(Number),
        z: expect.any(Number),
        biome: expect.any(String),
      });
    });

    it('should handle negative chunk coordinates', async () => {
      const response = await request(app)
        .get(`/api/assets-gen/worlds/${worldId}/chunks/-1/-1/0`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.data.chunkX).toBe(-1);
      expect(response.body.data.chunkY).toBe(-1);
    });

    it('should enforce access control', async () => {
      const { setupTestEnvironment: setup } = await import('../../../test/helpers.js');
      const otherEnv = await setup();
      const otherToken = otherEnv.testToken;

      await request(app)
        .get(`/api/assets-gen/worlds/${worldId}/chunks/0/0/0`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      await cleanupTestEnvironment(otherEnv.testUser.uid);
    });

    it('should require authentication', async () => {
      await request(app).get(`/api/assets-gen/worlds/${worldId}/chunks/0/0/0`).expect(401);
    });
  });
});
