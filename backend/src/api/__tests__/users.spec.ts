/**
 * Users API tests
 * @file backend/src/api/__tests__/users.spec.ts
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { app, httpServer } from '../../server.js';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../../test/helpers.js';

// Mock worker pool to avoid import.meta.url issues
jest.mock('@/workers/workerPool');

describe('Users API', () => {
  let firestore: ReturnType<typeof getFirestore>;
  let testUserId: string;
  let testToken: string;
  let testUserEmail: string;

  beforeEach(async () => {
    const env = await setupTestEnvironment();
    firestore = env.firestore;
    testUserId = env.testUser.uid;
    testUserEmail = env.testUser.email;
    testToken = env.testToken;
  });

  afterEach(async () => {
    await cleanupTestEnvironment(testUserId);
    if (httpServer.listening) {
      httpServer.close();
    }
  });

  describe('GET /api/users/me', () => {
    it('should return existing user profile when authenticated', async () => {
      // Pre-create user in Firestore
      await firestore.collection('users').doc(testUserId).set({
        id: testUserId,
        email: testUserEmail,
        displayName: 'Test User',
        avatarUrl: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const response = await request(app).get('/api/users/me').set('Authorization', `Bearer ${testToken}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: testUserId,
        email: testUserEmail,
        displayName: 'Test User',
      });
    });

    it('should create new user profile on first login', async () => {
      // Don't pre-create user in Firestore
      const response = await request(app).get('/api/users/me').set('Authorization', `Bearer ${testToken}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: testUserId,
        email: testUserEmail,
      });

      // Verify user was created in Firestore
      const userDoc = await firestore.collection('users').doc(testUserId).get();
      expect(userDoc.exists).toBe(true);
      expect(userDoc.data()?.id).toBe(testUserId);
    });

    it('should return 401 when token is missing', async () => {
      await request(app).get('/api/users/me').expect(401);
    });

    it('should return 401 when token is invalid', async () => {
      await request(app).get('/api/users/me').set('Authorization', 'Bearer invalid-token').expect(401);
    });

    it('should return 401 when token is malformed', async () => {
      await request(app).get('/api/users/me').set('Authorization', 'Invalid format').expect(401);
    });

    it('should return user with all required fields', async () => {
      const response = await request(app).get('/api/users/me').set('Authorization', `Bearer ${testToken}`).expect(200);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('displayName');
      expect(response.body.data).toHaveProperty('avatarUrl');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
    });

    it('should maintain same user data across multiple requests', async () => {
      // First request (creates user)
      const response1 = await request(app).get('/api/users/me').set('Authorization', `Bearer ${testToken}`).expect(200);

      // Second request (retrieves existing user)
      const response2 = await request(app).get('/api/users/me').set('Authorization', `Bearer ${testToken}`).expect(200);

      expect(response1.body.data.id).toBe(response2.body.data.id);
      expect(response1.body.data.email).toBe(response2.body.data.email);
      expect(response1.body.data.createdAt).toBe(response2.body.data.createdAt);
    });

    it('should update Firestore user document correctly', async () => {
      await request(app).get('/api/users/me').set('Authorization', `Bearer ${testToken}`).expect(200);

      const userDoc = await firestore.collection('users').doc(testUserId).get();
      const userData = userDoc.data();

      expect(userData).toBeDefined();
      expect(userData?.id).toBe(testUserId);
      expect(userData?.email).toBe(testUserEmail);
      expect(userData?.createdAt).toBeDefined();
      expect(userData?.updatedAt).toBeDefined();
    });

    it('should handle concurrent requests correctly', async () => {
      // Make multiple requests simultaneously
      const requests = Array.from({ length: 5 }, () =>
        request(app).get('/api/users/me').set('Authorization', `Bearer ${testToken}`)
      );

      const responses = await Promise.all(requests);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(testUserId);
      });

      // Should only create one user document
      const userDocs = await firestore.collection('users').where('id', '==', testUserId).get();
      expect(userDocs.size).toBe(1);
    });
  });
});
