/**
 * Characters API integration tests
 * @file backend/src/api/__tests__/characters.integration.spec.ts
 */

import { describe, it, expect, beforeEach, afterEach, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import { app, httpServer } from '../../server.js';
import { getFirestore } from 'firebase-admin/firestore';
import { setupTestEnvironment, cleanupTestEnvironment, createMockCharacter } from '../../../test/helpers.js';
import { GamePhase } from '@/types/index';

// Mock worker pool to avoid import.meta.url issues
jest.mock('@/workers/workerPool');

describe('Characters API Integration', () => {
  let firestore: ReturnType<typeof getFirestore>;
  let testUserId: string;
  let testToken: string;
  let roomId: string;
  let playerId: string;

  beforeEach(async () => {
    const env = await setupTestEnvironment();
    firestore = env.firestore;
    testUserId = env.testUser.uid;
    testToken = env.testToken;

    // Create a room
    const roomResponse = await request(app).post('/api/rooms').set('Authorization', `Bearer ${testToken}`);
    roomId = roomResponse.body.data.id;

    // Add a player
    playerId = testUserId;
    await firestore.collection('rooms').doc(roomId).collection('players').doc(playerId).set({
      id: playerId,
      userId: testUserId,
      name: 'Test Character',
      character: createMockCharacter(),
      action: null,
      isReady: false,
      joinedAt: Date.now(),
    });
  });

  afterEach(async () => {
    await cleanupTestEnvironment(testUserId);
  });

  afterAll(async () => {
    if (httpServer.listening) {
      httpServer.close();
    }
  });

  describe('GET /api/characters/:roomId', () => {
    it('should list all characters in room', async () => {
      const response = await request(app)
        .get(`/api/characters/${roomId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe(playerId);
    });

    it('should return empty array for room with no players', async () => {
      // Create new room without players
      const newRoomResponse = await request(app).post('/api/rooms').set('Authorization', `Bearer ${testToken}`);

      const newRoomId = newRoomResponse.body.data.id;

      const response = await request(app)
        .get(`/api/characters/${newRoomId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

    it('should return 404 for nonexistent room', async () => {
      await request(app).get('/api/characters/nonexistent-id').set('Authorization', `Bearer ${testToken}`).expect(404);
    });

    it('should require authentication', async () => {
      await request(app).get(`/api/characters/${roomId}`).expect(401);
    });
  });

  describe('GET /api/characters/:roomId/:playerId', () => {
    it('should return specific character', async () => {
      const response = await request(app)
        .get(`/api/characters/${roomId}/${playerId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: playerId,
        name: 'Test Character',
        character: expect.objectContaining({
          name: 'Test Character',
          race: 'Human',
          characterClass: 'Fighter',
        }),
      });
    });

    it('should return 404 for nonexistent player', async () => {
      await request(app)
        .get(`/api/characters/${roomId}/nonexistent-player`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app).get(`/api/characters/${roomId}/${playerId}`).expect(401);
    });
  });

  describe('PUT /api/characters/:roomId/:playerId', () => {
    it('should update character sheet', async () => {
      const updates = {
        name: 'Updated Name',
        level: 2,
        attributes: {
          Strength: 18,
        },
      };

      const response = await request(app)
        .put(`/api/characters/${roomId}/${playerId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .type('application/json')
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.character.name).toBe('Updated Name');
      expect(response.body.data.character.level).toBe(2);

      // Verify in Firestore
      const playerDoc = await firestore.collection('rooms').doc(roomId).collection('players').doc(playerId).get();
      expect(playerDoc.data()?.character.name).toBe('Updated Name');
    });

    it('should return 400 when no fields provided', async () => {
      await request(app)
        .put(`/api/characters/${roomId}/${playerId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .type('application/json')
        .send({})
        .expect(400);
    });

    it('should return 404 for nonexistent player', async () => {
      await request(app)
        .put(`/api/characters/${roomId}/nonexistent-player`)
        .set('Authorization', `Bearer ${testToken}`)
        .type('application/json')
        .send({ name: 'Test' })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app)
        .put(`/api/characters/${roomId}/${playerId}`)
        .type('application/json')
        .send({ name: 'Test' })
        .expect(401);
    });

    it('should merge updates with existing data', async () => {
      // Get original character
      const originalResponse = await request(app)
        .get(`/api/characters/${roomId}/${playerId}`)
        .set('Authorization', `Bearer ${testToken}`);

      const originalRace = originalResponse.body.data.character.race;

      // Update only name
      await request(app)
        .put(`/api/characters/${roomId}/${playerId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .type('application/json')
        .send({ name: 'New Name' });

      // Get updated character
      const updatedResponse = await request(app)
        .get(`/api/characters/${roomId}/${playerId}`)
        .set('Authorization', `Bearer ${testToken}`);

      // Name should be updated, race should remain
      expect(updatedResponse.body.data.character.name).toBe('New Name');
      expect(updatedResponse.body.data.character.race).toBe(originalRace);
    });
  });

  describe('POST /api/characters/:roomId/:playerId/import', () => {
    it('should import full character sheet', async () => {
      const fullCharacter = createMockCharacter({
        name: 'Imported Character',
        race: 'Elf',
        characterClass: 'Wizard',
        level: 5,
      });

      const response = await request(app)
        .post(`/api/characters/${roomId}/${playerId}/import`)
        .set('Authorization', `Bearer ${testToken}`)
        .type('application/json')
        .send(fullCharacter)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.character.name).toBe('Imported Character');
      expect(response.body.data.character.level).toBe(5);
    });

    it('should validate imported character schema', async () => {
      const invalidCharacter = {
        // Invalid character structure
        invalid: 'data',
      };

      await request(app)
        .post(`/api/characters/${roomId}/${playerId}/import`)
        .set('Authorization', `Bearer ${testToken}`)
        .type('application/json')
        .send(invalidCharacter)
        .expect(400);
    });

    it('should return 404 for nonexistent player', async () => {
      await request(app)
        .post(`/api/characters/${roomId}/nonexistent-player/import`)
        .set('Authorization', `Bearer ${testToken}`)
        .type('application/json')
        .send(createMockCharacter())
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app)
        .post(`/api/characters/${roomId}/${playerId}/import`)
        .type('application/json')
        .send(createMockCharacter())
        .expect(401);
    });
  });
});
