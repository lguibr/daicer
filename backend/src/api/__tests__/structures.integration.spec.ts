/**
 * Structures API integration tests
 */

import { describe, it, expect, beforeEach, afterEach, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import { app, httpServer } from '../../server.js';
import { getFirestore } from 'firebase-admin/firestore';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../../test/helpers.js';

jest.mock('@/workers/workerPool');

describe('Structures API Integration', () => {
  let firestore: ReturnType<typeof getFirestore>;
  let testUserId: string;
  let testToken: string;
  let otherUserId: string;
  let otherToken: string;

  beforeEach(async () => {
    const env = await setupTestEnvironment();
    firestore = env.firestore;
    testUserId = env.testUser.uid;
    testToken = env.testToken;

    const { setupTestEnvironment: setup } = await import('../../../test/helpers.js');
    const otherEnv = await setup();
    otherUserId = otherEnv.testUser.uid;
    otherToken = otherEnv.testToken;
  });

  afterEach(async () => {
    await cleanupTestEnvironment(testUserId);
    await cleanupTestEnvironment(otherUserId);
  });

  afterAll(async () => {
    if (httpServer.listening) {
      httpServer.close();
    }
  });

  describe('POST /api/structures', () => {
    it('should create structure with valid payload', async () => {
      const payload = {
        name: 'Ancient Tower',
        size: 'medium',
        type: 'landmark',
        description: 'A mysterious tower',
        significance: 7,
      };

      const response = await request(app)
        .post('/api/structures')
        .set('Authorization', `Bearer ${testToken}`)
        .send(payload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: expect.any(String),
        name: 'Ancient Tower',
        size: 'medium',
        type: 'landmark',
        description: 'A mysterious tower',
        significance: 7,
        userId: testUserId,
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
      });

      const doc = await firestore.collection('user_structures').doc(response.body.data.id).get();
      expect(doc.exists).toBe(true);
    });

    it('should apply default significance if not provided', async () => {
      const payload = {
        name: 'Simple Hut',
        size: 'small',
        type: 'settlement',
      };

      const response = await request(app)
        .post('/api/structures')
        .set('Authorization', `Bearer ${testToken}`)
        .send(payload)
        .expect(201);

      expect(response.body.data.significance).toBe(5);
    });

    it('should reject invalid size enum', async () => {
      const payload = {
        name: 'Invalid Structure',
        size: 'enormous',
        type: 'landmark',
      };

      await request(app).post('/api/structures').set('Authorization', `Bearer ${testToken}`).send(payload).expect(400);
    });

    it('should reject invalid type enum', async () => {
      const payload = {
        name: 'Invalid Structure',
        size: 'medium',
        type: 'castle',
      };

      await request(app).post('/api/structures').set('Authorization', `Bearer ${testToken}`).send(payload).expect(400);
    });

    it('should reject name exceeding 100 chars', async () => {
      const payload = {
        name: 'A'.repeat(101),
        size: 'medium',
        type: 'landmark',
      };

      await request(app).post('/api/structures').set('Authorization', `Bearer ${testToken}`).send(payload).expect(400);
    });

    it('should reject description exceeding 1000 chars', async () => {
      const payload = {
        name: 'Test',
        size: 'medium',
        type: 'landmark',
        description: 'A'.repeat(1001),
      };

      await request(app).post('/api/structures').set('Authorization', `Bearer ${testToken}`).send(payload).expect(400);
    });

    it('should reject significance outside 1-10 range', async () => {
      const payload1 = {
        name: 'Test',
        size: 'medium',
        type: 'landmark',
        significance: 0,
      };

      await request(app).post('/api/structures').set('Authorization', `Bearer ${testToken}`).send(payload1).expect(400);

      const payload2 = {
        name: 'Test',
        size: 'medium',
        type: 'landmark',
        significance: 11,
      };

      await request(app).post('/api/structures').set('Authorization', `Bearer ${testToken}`).send(payload2).expect(400);
    });

    it('should require authentication', async () => {
      const payload = {
        name: 'Test',
        size: 'medium',
        type: 'landmark',
      };

      await request(app).post('/api/structures').send(payload).expect(401);
    });
  });

  describe('GET /api/structures/user/:userId', () => {
    it('should return user structures ordered by updatedAt desc', async () => {
      await request(app)
        .post('/api/structures')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'First', size: 'small', type: 'settlement' })
        .expect(201);

      await new Promise((resolve) => setTimeout(resolve, 10));

      await request(app)
        .post('/api/structures')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Second', size: 'medium', type: 'dungeon' })
        .expect(201);

      const response = await request(app)
        .get(`/api/structures/user/${testUserId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe('Second');
      expect(response.body.data[1].name).toBe('First');
    });

    it('should enforce user can only access own structures', async () => {
      await request(app)
        .get(`/api/structures/user/${otherUserId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(403);
    });

    it('should return empty array for user with no structures', async () => {
      const response = await request(app)
        .get(`/api/structures/user/${testUserId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app).get(`/api/structures/user/${testUserId}`).expect(401);
    });
  });

  describe('GET /api/structures/:id', () => {
    it('should return single structure by id', async () => {
      const created = await request(app)
        .post('/api/structures')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Test Structure', size: 'large', type: 'ruin', significance: 9 })
        .expect(201);

      const structureId = created.body.data.id;

      const response = await request(app)
        .get(`/api/structures/${structureId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: structureId,
        name: 'Test Structure',
        size: 'large',
        type: 'ruin',
        significance: 9,
        userId: testUserId,
      });
    });

    it('should return 404 for non-existent structure', async () => {
      await request(app).get('/api/structures/non-existent-id').set('Authorization', `Bearer ${testToken}`).expect(404);
    });

    it('should enforce access control (cannot get other user structure)', async () => {
      const created = await request(app)
        .post('/api/structures')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: 'Other User Structure', size: 'small', type: 'settlement' })
        .expect(201);

      const structureId = created.body.data.id;

      await request(app).get(`/api/structures/${structureId}`).set('Authorization', `Bearer ${testToken}`).expect(403);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/structures/some-id').expect(401);
    });
  });

  describe('PUT /api/structures/:id', () => {
    it('should update structure fields', async () => {
      const created = await request(app)
        .post('/api/structures')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Original', size: 'small', type: 'settlement', significance: 3 })
        .expect(201);

      const structureId = created.body.data.id;

      const response = await request(app)
        .put(`/api/structures/${structureId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Updated', significance: 8 })
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: structureId,
        name: 'Updated',
        size: 'small',
        type: 'settlement',
        significance: 8,
      });

      expect(response.body.data.updatedAt).toBeGreaterThan(created.body.data.createdAt);
    });

    it('should allow partial updates', async () => {
      const created = await request(app)
        .post('/api/structures')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Test', size: 'medium', type: 'landmark' })
        .expect(201);

      const response = await request(app)
        .put(`/api/structures/${created.body.data.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ description: 'New description' })
        .expect(200);

      expect(response.body.data.description).toBe('New description');
      expect(response.body.data.name).toBe('Test');
    });

    it('should return 404 for non-existent structure', async () => {
      await request(app)
        .put('/api/structures/non-existent')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Updated' })
        .expect(404);
    });

    it('should enforce access control (cannot update other user structure)', async () => {
      const created = await request(app)
        .post('/api/structures')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: 'Other', size: 'small', type: 'settlement' })
        .expect(201);

      await request(app)
        .put(`/api/structures/${created.body.data.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Hacked' })
        .expect(403);
    });

    it('should validate updated data', async () => {
      const created = await request(app)
        .post('/api/structures')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Test', size: 'small', type: 'settlement' })
        .expect(201);

      await request(app)
        .put(`/api/structures/${created.body.data.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ size: 'invalid' })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app).put('/api/structures/some-id').send({ name: 'Updated' }).expect(401);
    });
  });

  describe('DELETE /api/structures/:id', () => {
    it('should delete structure successfully', async () => {
      const created = await request(app)
        .post('/api/structures')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'To Delete', size: 'tiny', type: 'natural' })
        .expect(201);

      const structureId = created.body.data.id;

      await request(app)
        .delete(`/api/structures/${structureId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      const doc = await firestore.collection('user_structures').doc(structureId).get();
      expect(doc.exists).toBe(false);
    });

    it('should return 404 for non-existent structure', async () => {
      await request(app).delete('/api/structures/non-existent').set('Authorization', `Bearer ${testToken}`).expect(404);
    });

    it('should enforce access control (cannot delete other user structure)', async () => {
      const created = await request(app)
        .post('/api/structures')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: 'Other', size: 'small', type: 'settlement' })
        .expect(201);

      await request(app)
        .delete(`/api/structures/${created.body.data.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app).delete('/api/structures/some-id').expect(401);
    });
  });
});
