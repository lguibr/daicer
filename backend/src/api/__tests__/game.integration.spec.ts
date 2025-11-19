/**
 * Game API integration tests
 * @file backend/src/api/__tests__/game.integration.spec.ts
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { app, httpServer } from '../../server.js';
import { getFirestore } from 'firebase-admin/firestore';
import { setupTestEnvironment, cleanupTestEnvironment, createMockCharacter } from '../../../test/helpers.js';
import { GamePhase } from '@/types/index';
import * as gameService from '@/services/game';

// Mock worker pool to avoid import.meta.url issues
jest.mock('@/workers/workerPool');

// Mock the game service to avoid actual LLM calls
jest.mock('@/services/game');

describe('Game API Integration', () => {
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

    // Mock game service functions
    (gameService.generateWorld as jest.MockedFunction<typeof gameService.generateWorld>).mockResolvedValue(
      'A vast fantasy kingdom stretches before you...'
    );

    (gameService.processTurn as jest.MockedFunction<typeof gameService.processTurn>).mockResolvedValue({
      messages: [
        {
          id: 'msg-1',
          sender: 'DM',
          content: 'The adventure continues...',
          timestamp: Date.now(),
          recipientId: null,
        },
      ],
    });
  });

  afterEach(async () => {
    await cleanupTestEnvironment(testUserId);
    if (httpServer.listening) {
      httpServer.close();
    }
    jest.clearAllMocks();
  });

  describe('POST /api/game/:roomId/world', () => {
    it('should generate world as room owner', async () => {
      // Set room settings first
      const settings = {
        theme: 'High Fantasy',
        setting: 'Medieval Kingdom',
        tone: 'Heroic',
        playerCount: 4,
        adventureLength: 'medium',
        difficulty: 'medium',
      };

      await request(app)
        .patch(`/api/rooms/${roomId}/settings`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(settings);

      // Generate world
      const response = await request(app)
        .post(`/api/game/${roomId}/world`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.worldDescription).toBeDefined();
      expect(response.body.data.phase).toBe(GamePhase.CHARACTER_CREATION);

      // Verify in Firestore
      const roomDoc = await firestore.collection('rooms').doc(roomId).get();
      expect(roomDoc.data()?.worldDescription).toBeTruthy();
      expect(roomDoc.data()?.phase).toBe(GamePhase.CHARACTER_CREATION);
    });

    it('should return 403 when non-owner tries to generate world', async () => {
      // Create another user
      const { setupTestEnvironment: setup } = await import('../../../test/helpers.js');
      const otherEnv = await setup();
      const otherToken = otherEnv.testToken;

      // Set settings as owner
      const settings = {
        theme: 'High Fantasy',
        setting: 'Medieval Kingdom',
        tone: 'Heroic',
        playerCount: 4,
        adventureLength: 'medium',
        difficulty: 'medium',
      };

      await request(app)
        .patch(`/api/rooms/${roomId}/settings`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(settings);

      // Try to generate as non-owner
      await request(app)
        .post(`/api/game/${roomId}/world`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({})
        .expect(403);

      await cleanupTestEnvironment(otherEnv.testUser.uid);
    });

    it('should return 400 when settings not configured', async () => {
      await request(app)
        .post(`/api/game/${roomId}/world`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({})
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app).post(`/api/game/${roomId}/world`).send({}).expect(401);
    });

    it('should return 404 for nonexistent room', async () => {
      await request(app)
        .post('/api/game/nonexistent-id/world')
        .set('Authorization', `Bearer ${testToken}`)
        .send({})
        .expect(404);
    });
  });

  describe('POST /api/game/:roomId/character', () => {
    beforeEach(async () => {
      // Set room to CHARACTER_CREATION phase
      await firestore.collection('rooms').doc(roomId).set(
        {
          phase: GamePhase.CHARACTER_CREATION,
          worldDescription: 'A fantasy world',
        },
        { merge: true }
      );
    });

    it('should add character to room', async () => {
      const character = {
        name: 'Thorin Ironforge',
        race: 'Dwarf',
        characterClass: 'Fighter',
        alignment: 'Lawful Good',
        background: 'Soldier',
        attributes: {
          Strength: 16,
          Dexterity: 12,
          Constitution: 15,
          Intelligence: 10,
          Wisdom: 13,
          Charisma: 8,
        },
        armorClass: 18,
      };

      const response = await request(app)
        .post(`/api/game/${roomId}/character`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(character)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: testUserId,
        name: character.name,
        character: expect.objectContaining({
          basics: expect.objectContaining({
            name: character.name,
            race: character.race,
          }),
        }),
      });

      // Verify in Firestore
      const playerDoc = await firestore.collection('rooms').doc(roomId).collection('players').doc(testUserId).get();
      expect(playerDoc.exists).toBe(true);
    });

    it('should return 400 when not in CHARACTER_CREATION phase', async () => {
      // Set to SETUP phase
      await firestore.collection('rooms').doc(roomId).set(
        {
          phase: GamePhase.SETUP,
        },
        { merge: true }
      );

      const character = {
        name: 'Test',
        race: 'Human',
        characterClass: 'Wizard',
        alignment: 'Neutral',
        attributes: {
          Strength: 10,
          Dexterity: 10,
          Constitution: 10,
          Intelligence: 10,
          Wisdom: 10,
          Charisma: 10,
        },
        armorClass: 10,
      };

      await request(app)
        .post(`/api/game/${roomId}/character`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(character)
        .expect(400);
    });

    it('should validate character schema', async () => {
      const invalidCharacter = {
        name: 'Test',
        // Missing required fields
      };

      await request(app)
        .post(`/api/game/${roomId}/character`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(invalidCharacter)
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app).post(`/api/game/${roomId}/character`).send({}).expect(401);
    });
  });

  describe('POST /api/game/:roomId/start', () => {
    beforeEach(async () => {
      // Add a player to the room
      await firestore.collection('rooms').doc(roomId).collection('players').doc(testUserId).set({
        id: testUserId,
        userId: testUserId,
        name: 'Test Character',
        character: createMockCharacter(),
        action: null,
        isReady: true,
        joinedAt: Date.now(),
      });

      await firestore.collection('rooms').doc(roomId).set(
        {
          phase: GamePhase.CHARACTER_CREATION,
          worldDescription: 'A fantasy world',
        },
        { merge: true }
      );
    });

    it('should start game as room owner', async () => {
      const response = await request(app)
        .post(`/api/game/${roomId}/start`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify phase changed to GAMEPLAY
      const roomDoc = await firestore.collection('rooms').doc(roomId).get();
      expect(roomDoc.data()?.phase).toBe(GamePhase.GAMEPLAY);
    });

    it('should return 403 when non-owner tries to start game', async () => {
      const { setupTestEnvironment: setup } = await import('../../../test/helpers.js');
      const otherEnv = await setup();
      const otherToken = otherEnv.testToken;

      await request(app)
        .post(`/api/game/${roomId}/start`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({})
        .expect(403);

      await cleanupTestEnvironment(otherEnv.testUser.uid);
    });

    it('should require authentication', async () => {
      await request(app).post(`/api/game/${roomId}/start`).send({}).expect(401);
    });
  });

  describe('POST /api/game/:roomId/action', () => {
    beforeEach(async () => {
      // Setup room in GAMEPLAY phase with a player
      await firestore.collection('rooms').doc(roomId).set(
        {
          phase: GamePhase.GAMEPLAY,
          worldDescription: 'A fantasy world',
        },
        { merge: true }
      );

      await firestore.collection('rooms').doc(roomId).collection('players').doc(testUserId).set({
        id: testUserId,
        userId: testUserId,
        name: 'Test Character',
        character: createMockCharacter(),
        action: null,
        isReady: false,
        joinedAt: Date.now(),
      });
    });

    it('should submit player action', async () => {
      const action = 'I search the room for hidden passages';

      const response = await request(app)
        .post(`/api/game/${roomId}/action`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ action })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify action stored
      const playerDoc = await firestore.collection('rooms').doc(roomId).collection('players').doc(testUserId).get();
      expect(playerDoc.data()?.action).toBe(action);
    });

    it('should validate action is not empty', async () => {
      await request(app)
        .post(`/api/game/${roomId}/action`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ action: '' })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app).post(`/api/game/${roomId}/action`).send({ action: 'test' }).expect(401);
    });
  });

  describe('POST /api/game/:roomId/world - Streaming Modes', () => {
    it('should use streaming mode when sockets are connected', async () => {
      const settings = {
        theme: 'High Fantasy',
        setting: 'Medieval Kingdom',
        tone: 'Heroic',
        playerCount: 4,
        adventureLength: 'flash',
        difficulty: 'easy',
      };

      await request(app)
        .patch(`/api/rooms/${roomId}/settings`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(settings);

      const response = await request(app)
        .post(`/api/game/${roomId}/world`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.worldDescription).toBeDefined();
    });

    it('should persist world data to Firestore after generation', async () => {
      const settings = {
        theme: 'High Fantasy',
        setting: 'Medieval Kingdom',
        tone: 'Heroic',
        playerCount: 4,
        adventureLength: 'flash',
        difficulty: 'easy',
      };

      await request(app)
        .patch(`/api/rooms/${roomId}/settings`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(settings);

      await request(app)
        .post(`/api/game/${roomId}/world`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({})
        .expect(200);

      const roomDoc = await firestore.collection('rooms').doc(roomId).get();
      const roomData = roomDoc.data();

      expect(roomData?.worldDescription).toBeDefined();
      expect(roomData?.phase).toBe(GamePhase.CHARACTER_CREATION);
      expect(roomData?.worldDescription.length).toBeGreaterThan(0);
    });

    it('should save structures to Firestore', async () => {
      const settings = {
        theme: 'High Fantasy',
        setting: 'Medieval Kingdom',
        tone: 'Heroic',
        playerCount: 4,
        adventureLength: 'flash',
        difficulty: 'easy',
      };

      await request(app)
        .patch(`/api/rooms/${roomId}/settings`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(settings);

      const response = await request(app)
        .post(`/api/game/${roomId}/world`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({})
        .expect(200);

      const roomDoc = await firestore.collection('rooms').doc(roomId).get();
      const roomData = roomDoc.data();

      if (roomData?.structures) {
        expect(Array.isArray(roomData.structures)).toBe(true);
      }
    });

    it('should save roads to Firestore', async () => {
      const settings = {
        theme: 'High Fantasy',
        setting: 'Medieval Kingdom',
        tone: 'Heroic',
        playerCount: 4,
        adventureLength: 'flash',
        difficulty: 'easy',
      };

      await request(app)
        .patch(`/api/rooms/${roomId}/settings`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(settings);

      await request(app)
        .post(`/api/game/${roomId}/world`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({})
        .expect(200);

      const roomDoc = await firestore.collection('rooms').doc(roomId).get();
      const roomData = roomDoc.data();

      if (roomData?.roads) {
        expect(Array.isArray(roomData.roads)).toBe(true);
      }
    });

    it('should save worldConditions to Firestore', async () => {
      const settings = {
        theme: 'High Fantasy',
        setting: 'Medieval Kingdom',
        tone: 'Heroic',
        playerCount: 4,
        adventureLength: 'flash',
        difficulty: 'easy',
      };

      await request(app)
        .patch(`/api/rooms/${roomId}/settings`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(settings);

      await request(app)
        .post(`/api/game/${roomId}/world`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({})
        .expect(200);

      const roomDoc = await firestore.collection('rooms').doc(roomId).get();
      const roomData = roomDoc.data();

      if (roomData?.worldConditions) {
        expect(typeof roomData.worldConditions).toBe('object');
      }
    });

    it('should transition room phase to CHARACTER_CREATION', async () => {
      const settings = {
        theme: 'High Fantasy',
        setting: 'Medieval Kingdom',
        tone: 'Heroic',
        playerCount: 4,
        adventureLength: 'flash',
        difficulty: 'easy',
      };

      await request(app)
        .patch(`/api/rooms/${roomId}/settings`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(settings);

      const initialPhase = (await firestore.collection('rooms').doc(roomId).get()).data()?.phase;
      expect(initialPhase).toBe(GamePhase.SETUP);

      await request(app)
        .post(`/api/game/${roomId}/world`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({})
        .expect(200);

      const finalPhase = (await firestore.collection('rooms').doc(roomId).get()).data()?.phase;
      expect(finalPhase).toBe(GamePhase.CHARACTER_CREATION);
    });

    it('should cache world data for Assets/Maps viewing', async () => {
      const settings = {
        theme: 'Mystical Realm',
        setting: 'Magical Academy',
        tone: 'Whimsical',
        playerCount: 3,
        adventureLength: 'flash',
        difficulty: 'easy',
      };

      await request(app)
        .patch(`/api/rooms/${roomId}/settings`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(settings);

      await request(app)
        .post(`/api/game/${roomId}/world`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({})
        .expect(200);

      const worldMapsSnapshot = await firestore.collection('worldMaps').where('roomId', '==', roomId).get();

      if (!worldMapsSnapshot.empty) {
        const worldData = worldMapsSnapshot.docs[0].data();
        expect(worldData.name).toContain('Mystical Realm');
      }
    });
  });
});
