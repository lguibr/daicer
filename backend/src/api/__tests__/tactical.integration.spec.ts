/**
 * Tactical Combat API integration tests
 * Full coverage for encounter lifecycle and phase validation
 * @file backend/src/api/__tests__/tactical.integration.spec.ts
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { app, httpServer } from '../../server.js';
import { getFirestore } from 'firebase-admin/firestore';
import { setupTestEnvironment, cleanupTestEnvironment, createMockCharacter } from '../../../test/helpers.js';
import { GamePhase } from '@/types/index';

// Mock worker pool to avoid import.meta.url issues
jest.mock('@/workers/workerPool');

describe('Tactical Combat API Integration', () => {
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

    // Create room and player
    const roomResponse = await request(app).post('/api/rooms').set('Authorization', `Bearer ${testToken}`);
    roomId = roomResponse.body.data.id;

    await firestore.collection('rooms').doc(roomId).update({
      phase: GamePhase.GAMEPLAY,
      worldDescription: 'A fantasy world',
    });

    playerId = testUserId;
    await firestore
      .collection('rooms')
      .doc(roomId)
      .collection('players')
      .doc(playerId)
      .set({
        id: playerId,
        userId: testUserId,
        name: 'Test Fighter',
        character: createMockCharacter({
          basics: { name: 'Test Fighter', race: 'Human', class: 'Fighter' },
          combat: {
            hitPoints: 40,
            maxHitPoints: 40,
            armorClass: 18,
            initiative: 2,
          },
        }),
        action: null,
        isReady: false,
        joinedAt: Date.now(),
      });
  });

  afterEach(async () => {
    await cleanupTestEnvironment(testUserId);
    if (httpServer.listening) {
      httpServer.close();
    }
  });

  describe('POST /api/tactical/:roomId/encounter', () => {
    it('should create a new encounter as room owner', async () => {
      const encounterData = {
        name: 'Goblin Ambush',
        description: 'A group of goblins attacks!',
        gridSize: { width: 20, height: 15 },
        enemies: [
          {
            id: 'goblin-1',
            name: 'Goblin Warrior',
            hp: 7,
            maxHp: 7,
            ac: 13,
            initiative: 10,
            position: { x: 10, y: 5 },
          },
          {
            id: 'goblin-2',
            name: 'Goblin Archer',
            hp: 7,
            maxHp: 7,
            ac: 13,
            initiative: 12,
            position: { x: 12, y: 6 },
          },
        ],
        seed: 42,
      };

      const response = await request(app)
        .post(`/api/tactical/${roomId}/encounter`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(encounterData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: expect.any(String),
        roomId,
        round: 1,
        turn: 0,
        phase: 'in_progress',
        units: expect.arrayContaining([
          expect.objectContaining({ id: 'goblin-1' }),
          expect.objectContaining({ id: 'goblin-2' }),
        ]),
      });

      // Verify in Firestore
      const encounterDoc = await firestore
        .collection('rooms')
        .doc(roomId)
        .collection('encounters')
        .doc(response.body.data.id)
        .get();
      expect(encounterDoc.exists).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app).post(`/api/tactical/${roomId}/encounter`).send({}).expect(401);
    });

    it('should return 403 when non-owner tries to create encounter', async () => {
      const { setupTestEnvironment: setup } = await import('../../../test/helpers.js');
      const otherEnv = await setup();
      const otherToken = otherEnv.testToken;

      const encounterData = {
        name: 'Test Encounter',
        gridSize: { width: 20, height: 15 },
        enemies: [],
        seed: 42,
      };

      await request(app)
        .post(`/api/tactical/${roomId}/encounter`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(encounterData)
        .expect(403);

      await cleanupTestEnvironment(otherEnv.testUser.uid);
    });

    it('should validate encounter schema', async () => {
      const invalidData = {
        name: 'Test',
        // Missing required fields
      };

      await request(app)
        .post(`/api/tactical/${roomId}/encounter`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/tactical/:roomId/encounter/:encounterId', () => {
    let encounterId: string;

    beforeEach(async () => {
      // Create an encounter
      const createResponse = await request(app)
        .post(`/api/tactical/${roomId}/encounter`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'Test Encounter',
          gridSize: { width: 20, height: 15 },
          enemies: [
            {
              id: 'goblin-1',
              name: 'Goblin',
              hp: 7,
              maxHp: 7,
              ac: 13,
              initiative: 10,
              position: { x: 10, y: 5 },
            },
          ],
          seed: 42,
        });

      encounterId = createResponse.body.data.id;
    });

    it('should return encounter details', async () => {
      const response = await request(app)
        .get(`/api/tactical/${roomId}/encounter/${encounterId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: encounterId,
        roomId,
        phase: 'in_progress',
        units: expect.any(Array),
      });
    });

    it('should return 404 for nonexistent encounter', async () => {
      await request(app)
        .get(`/api/tactical/${roomId}/encounter/nonexistent-id`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app).get(`/api/tactical/${roomId}/encounter/${encounterId}`).expect(401);
    });
  });

  describe('POST /api/tactical/:roomId/encounter/:encounterId/action', () => {
    let encounterId: string;

    beforeEach(async () => {
      // Create encounter with player unit
      const createResponse = await request(app)
        .post(`/api/tactical/${roomId}/encounter`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'Combat Encounter',
          gridSize: { width: 20, height: 15 },
          enemies: [
            {
              id: 'goblin-1',
              name: 'Goblin',
              hp: 7,
              maxHp: 7,
              ac: 13,
              initiative: 8,
              position: { x: 10, y: 5 },
            },
          ],
          seed: 42,
        });

      encounterId = createResponse.body.data.id;
    });

    it('should submit combat action', async () => {
      const action = {
        type: 'attack',
        actorId: playerId,
        targetId: 'goblin-1',
        weaponId: 'longsword',
      };

      const response = await request(app)
        .post(`/api/tactical/${roomId}/encounter/${encounterId}/action`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(action)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('log');
      expect(Array.isArray(response.body.data.log)).toBe(true);
    });

    it('should validate action schema', async () => {
      const invalidAction = {
        type: 'attack',
        // Missing required fields
      };

      await request(app)
        .post(`/api/tactical/${roomId}/encounter/${encounterId}/action`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(invalidAction)
        .expect(400);
    });

    it('should return 400 for invalid target', async () => {
      const action = {
        type: 'attack',
        actorId: playerId,
        targetId: 'nonexistent-target',
        weaponId: 'longsword',
      };

      await request(app)
        .post(`/api/tactical/${roomId}/encounter/${encounterId}/action`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(action)
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app)
        .post(`/api/tactical/${roomId}/encounter/${encounterId}/action`)
        .send({ type: 'attack' })
        .expect(401);
    });
  });

  describe('POST /api/tactical/:roomId/encounter/:encounterId/end', () => {
    let encounterId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post(`/api/tactical/${roomId}/encounter`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'Test Encounter',
          gridSize: { width: 20, height: 15 },
          enemies: [],
          seed: 42,
        });

      encounterId = createResponse.body.data.id;
    });

    it('should end encounter as room owner', async () => {
      const response = await request(app)
        .post(`/api/tactical/${roomId}/encounter/${encounterId}/end`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.phase).toBe('complete');

      // Verify in Firestore
      const encounterDoc = await firestore
        .collection('rooms')
        .doc(roomId)
        .collection('encounters')
        .doc(encounterId)
        .get();
      expect(encounterDoc.data()?.phase).toBe('complete');
    });

    it('should return 403 when non-owner tries to end encounter', async () => {
      const { setupTestEnvironment: setup } = await import('../../../test/helpers.js');
      const otherEnv = await setup();
      const otherToken = otherEnv.testToken;

      await request(app)
        .post(`/api/tactical/${roomId}/encounter/${encounterId}/end`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      await cleanupTestEnvironment(otherEnv.testUser.uid);
    });

    it('should require authentication', async () => {
      await request(app).post(`/api/tactical/${roomId}/encounter/${encounterId}/end`).expect(401);
    });

    it('should return 404 for nonexistent encounter', async () => {
      await request(app)
        .post(`/api/tactical/${roomId}/encounter/nonexistent-id/end`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });
  });

  describe('DELETE /api/tactical/:roomId/encounter/:encounterId', () => {
    let encounterId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post(`/api/tactical/${roomId}/encounter`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'Test Encounter',
          gridSize: { width: 20, height: 15 },
          enemies: [],
          seed: 42,
        });

      encounterId = createResponse.body.data.id;
    });

    it('should delete encounter as room owner', async () => {
      await request(app)
        .delete(`/api/tactical/${roomId}/encounter/${encounterId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      // Verify deleted from Firestore
      const encounterDoc = await firestore
        .collection('rooms')
        .doc(roomId)
        .collection('encounters')
        .doc(encounterId)
        .get();
      expect(encounterDoc.exists).toBe(false);
    });

    it('should return 403 when non-owner tries to delete', async () => {
      const { setupTestEnvironment: setup } = await import('../../../test/helpers.js');
      const otherEnv = await setup();
      const otherToken = otherEnv.testToken;

      await request(app)
        .delete(`/api/tactical/${roomId}/encounter/${encounterId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      await cleanupTestEnvironment(otherEnv.testUser.uid);
    });

    it('should require authentication', async () => {
      await request(app).delete(`/api/tactical/${roomId}/encounter/${encounterId}`).expect(401);
    });

    it('should return 404 for nonexistent encounter', async () => {
      await request(app)
        .delete(`/api/tactical/${roomId}/encounter/nonexistent-id`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });
  });
});
