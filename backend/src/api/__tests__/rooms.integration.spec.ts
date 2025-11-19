/**
 * Rooms API integration tests
 * @file backend/src/api/__tests__/rooms.integration.spec.ts
 */

import { describe, it, expect, beforeEach, afterEach, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import { app, httpServer } from '../../server.js';
import { getFirestore } from 'firebase-admin/firestore';
import { setupTestEnvironment, cleanupTestEnvironment, createMockRoom } from '../../../test/helpers.js';
import { GamePhase } from '@/types/index';

// Mock worker pool to avoid import.meta.url issues
jest.mock('@/workers/workerPool');

describe('Rooms API Integration', () => {
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

    // Create another test user
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

  describe('POST /api/rooms', () => {
    it('should create new room with authenticated user', async () => {
      const response = await request(app).post('/api/rooms').set('Authorization', `Bearer ${testToken}`).expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: expect.any(String),
        code: expect.stringMatching(/^[A-Z0-9]{6}$/),
        ownerId: testUserId,
        phase: GamePhase.SETUP,
      });

      // Verify in Firestore
      const roomDoc = await firestore.collection('rooms').doc(response.body.data.id).get();
      expect(roomDoc.exists).toBe(true);
      expect(roomDoc.data()?.ownerId).toBe(testUserId);
    });

    it('should require authentication', async () => {
      await request(app).post('/api/rooms').expect(401);
    });

    it('should return unique room codes', async () => {
      const response1 = await request(app).post('/api/rooms').set('Authorization', `Bearer ${testToken}`).expect(201);

      const response2 = await request(app).post('/api/rooms').set('Authorization', `Bearer ${testToken}`).expect(201);

      expect(response1.body.data.code).not.toBe(response2.body.data.code);
    });
  });

  describe('GET /api/rooms', () => {
    it('should list rooms owned by user', async () => {
      // Create a room
      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(201);

      const roomId = createResponse.body.data.id;

      // List rooms
      const response = await request(app).get('/api/rooms').set('Authorization', `Bearer ${testToken}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);

      const membership = response.body.data.find((m: any) => m.room.id === roomId);
      expect(membership).toBeDefined();
      expect(membership.isOwner).toBe(true);
    });

    it('should return empty array when user has no rooms', async () => {
      const response = await request(app).get('/api/rooms').set('Authorization', `Bearer ${testToken}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/rooms').expect(401);
    });
  });

  describe('POST /api/rooms/:code/join', () => {
    it('should join room by valid code', async () => {
      // Create room
      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(201);

      const roomCode = createResponse.body.data.code;

      // Join room
      const response = await request(app)
        .post(`/api/rooms/${roomCode}/join`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe(roomCode);
    });

    it('should return 404 for nonexistent code', async () => {
      await request(app).post('/api/rooms/INVALID/join').set('Authorization', `Bearer ${testToken}`).expect(404);
    });

    it('should require authentication', async () => {
      await request(app).post('/api/rooms/ABC123/join').expect(401);
    });

    it('should be case insensitive for room code', async () => {
      // Create room
      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(201);

      const roomCode = createResponse.body.data.code;

      // Join with lowercase code
      const response = await request(app)
        .post(`/api/rooms/${roomCode.toLowerCase()}/join`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/rooms/:roomId', () => {
    it('should return room details for authenticated user', async () => {
      // Create room
      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(201);

      const roomId = createResponse.body.data.id;

      // Get room
      const response = await request(app)
        .get(`/api/rooms/${roomId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.room).toMatchObject({
        id: roomId,
        ownerId: testUserId,
      });
      // Owner is automatically added as a player
      expect(response.body.data.players).toHaveLength(1);
      expect(response.body.data.players[0].userId).toBe(testUserId);
    });

    it('should return 404 for nonexistent room', async () => {
      await request(app).get('/api/rooms/nonexistent-id').set('Authorization', `Bearer ${testToken}`).expect(404);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/rooms/some-id').expect(401);
    });
  });

  describe('PATCH /api/rooms/:roomId/settings', () => {
    it.skip('should update room settings as owner', async () => {
      // Create room
      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(201);

      const roomId = createResponse.body.data.id;

      const settings = {
        theme: 'High Fantasy',
        setting: 'Medieval Kingdom',
        tone: 'Heroic',
        playerCount: 4,
        adventureLength: 'medium',
        difficulty: 'medium',
      };

      // Update settings
      const response = await request(app)
        .patch(`/api/rooms/${roomId}/settings`)
        .set('Authorization', `Bearer ${testToken}`)
        .set('Content-Type', 'application/json')
        .send(settings)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settings).toMatchObject(settings);

      // Verify in Firestore
      const roomDoc = await firestore.collection('rooms').doc(roomId).get();
      expect(roomDoc.data()?.settings).toMatchObject(settings);
    });

    it.skip('should return 403 when non-owner tries to update', async () => {
      // Create room as testUser
      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(201);

      const roomId = createResponse.body.data.id;

      const settings = {
        theme: 'Dark Fantasy',
        setting: 'Underworld',
        tone: 'Grim',
        playerCount: 3,
        adventureLength: 'short',
        difficulty: 'hard',
      };

      // Try to update as otherUser
      await request(app)
        .patch(`/api/rooms/${roomId}/settings`)
        .set('Authorization', `Bearer ${otherToken}`)
        .set('Content-Type', 'application/json')
        .send(settings)
        .expect(403);
    });

    it.skip('should validate settings schema', async () => {
      // Create room
      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(201);

      const roomId = createResponse.body.data.id;

      const invalidSettings = {
        theme: 'High Fantasy',
        // Missing required fields
      };

      await request(app)
        .patch(`/api/rooms/${roomId}/settings`)
        .set('Authorization', `Bearer ${testToken}`)
        .set('Content-Type', 'application/json')
        .send(invalidSettings)
        .expect(400);
    });

    it.skip('should require authentication', async () => {
      await request(app)
        .patch('/api/rooms/some-id/settings')
        .set('Content-Type', 'application/json')
        .send({})
        .expect(401);
    });
  });

  describe('DELETE /api/rooms/:roomId', () => {
    it('should delete room as owner', async () => {
      // Create room
      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(201);

      const roomId = createResponse.body.data.id;

      // Delete room
      await request(app).delete(`/api/rooms/${roomId}`).set('Authorization', `Bearer ${testToken}`).expect(200);

      // Verify deleted from Firestore
      const roomDoc = await firestore.collection('rooms').doc(roomId).get();
      expect(roomDoc.exists).toBe(false);
    });

    it('should return 403 when non-owner tries to delete', async () => {
      // Create room as testUser
      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(201);

      const roomId = createResponse.body.data.id;

      // Try to delete as otherUser
      await request(app).delete(`/api/rooms/${roomId}`).set('Authorization', `Bearer ${otherToken}`).expect(403);
    });

    it('should return 404 for nonexistent room', async () => {
      await request(app).delete('/api/rooms/nonexistent-id').set('Authorization', `Bearer ${testToken}`).expect(404);
    });

    it('should require authentication', async () => {
      await request(app).delete('/api/rooms/some-id').expect(401);
    });
  });

  describe('DELETE /api/rooms/:roomId/membership', () => {
    it('should allow player to leave room', async () => {
      // Create room
      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(201);

      const roomId = createResponse.body.data.id;

      // Owner can leave (no player entry)
      await request(app)
        .delete(`/api/rooms/${roomId}/membership`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);
    });

    it('should return 403 when user is not member', async () => {
      // Create room as testUser
      const createResponse = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(201);

      const roomId = createResponse.body.data.id;

      // Try to leave as non-member
      await request(app)
        .delete(`/api/rooms/${roomId}/membership`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should return 404 for nonexistent room', async () => {
      await request(app)
        .delete('/api/rooms/nonexistent-id/membership')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app).delete('/api/rooms/some-id/membership').expect(401);
    });
  });
});
