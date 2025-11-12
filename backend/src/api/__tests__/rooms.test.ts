/**
 * Room API endpoint tests
 */

import { describe, test, expect, beforeAll, jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../../server';

jest.mock('mime');

describe('Room API', () => {
  let authToken: string;

  beforeAll(async () => {
    // Mock auth token for testing
    authToken = 'test-token';
  });

  describe('POST /api/rooms', () => {
    test('creates a new room', async () => {
      const response = await request(app).post('/api/rooms').set('Authorization', `Bearer ${authToken}`).expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('code');
      expect(response.body.data.code).toHaveLength(6);
    });

    test('requires authentication', async () => {
      await request(app).post('/api/rooms').expect(401);
    });
  });

  describe('POST /api/rooms/:code/join', () => {
    test('joins existing room', async () => {
      // Create room first
      const createRes = await request(app).post('/api/rooms').set('Authorization', `Bearer ${authToken}`).expect(201);

      const { code } = createRes.body.data;

      // Join the room
      const joinRes = await request(app)
        .post(`/api/rooms/${code}/join`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(joinRes.body.success).toBe(true);
      expect(joinRes.body.data.code).toBe(code);
    });

    test('returns 404 for non-existent room', async () => {
      await request(app).post('/api/rooms/INVALID/join').set('Authorization', `Bearer ${authToken}`).expect(404);
    });
  });
});
