/**
 * Health endpoint tests
 * @file backend/src/api/__tests__/health.spec.ts
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import { app, httpServer } from '../../server.js';

// Mock worker pool to avoid import.meta.url issues
jest.mock('@/workers/workerPool');

describe('Health Check Endpoint', () => {
  beforeAll(() => {
    // Ensure server is not listening (test mode)
    if (httpServer.listening) {
      httpServer.close();
    }
  });

  afterAll(() => {
    // Cleanup
    if (httpServer.listening) {
      httpServer.close();
    }
  });

  describe('GET /health', () => {
    it('should return 200 status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toBeDefined();
    });

    it('should return status ok', async () => {
      const response = await request(app).get('/health');

      expect(response.body.status).toBe('ok');
    });

    it('should return valid ISO timestamp', async () => {
      const response = await request(app).get('/health');

      expect(response.body.timestamp).toBeDefined();

      // Validate ISO 8601 format
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });

    it('should not require authentication', async () => {
      const response = await request(app)
        .get('/health')
        .set('Authorization', '') // No auth header
        .expect(200);

      expect(response.body.status).toBe('ok');
    });

    it('should return JSON content type', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should return timestamp close to current time', async () => {
      const before = new Date().getTime();
      const response = await request(app).get('/health');
      const after = new Date().getTime();

      const timestamp = new Date(response.body.timestamp).getTime();

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });
});
