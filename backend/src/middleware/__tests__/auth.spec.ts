/**
 * Authentication middleware tests
 * @file backend/src/middleware/__tests__/auth.spec.ts
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import type { Response, NextFunction } from 'express';
import { authenticate, type AuthRequest } from '../auth.js';
import { getAuth } from 'firebase-admin/auth';
import { createMockRequest, createMockResponse, createMockNext } from '../../../test/mocks.js';
import { cleanupTestUser, createTestUser } from '../../../test/helpers.js';

describe('Authentication Middleware', () => {
  let mockRequest: AuthRequest;
  let mockResponse: Response;
  let mockNext: NextFunction;
  let testUserId: string;

  beforeEach(() => {
    mockRequest = createMockRequest() as AuthRequest;
    mockResponse = createMockResponse() as Response;
    mockNext = createMockNext() as NextFunction;
    testUserId = `test-user-${Date.now()}`;
  });

  afterEach(async () => {
    await cleanupTestUser(testUserId);
    jest.clearAllMocks();
  });

  describe('Valid authentication', () => {
    it('should attach user to request with valid token', async () => {
      // Create test user
      const testUser = await createTestUser(testUserId, 'test@example.com', 'Test User');
      const auth = getAuth();
      const token = await auth.createCustomToken(testUser.uid);

      // Set auth header
      mockRequest.headers.authorization = `Bearer ${token}`;

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.uid).toBe(testUser.uid);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Missing authentication', () => {
    it('should return 401 when Authorization header is missing', async () => {
      mockRequest.headers.authorization = undefined;

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'No authentication token provided',
        })
      );
    });

    it('should return 401 when Authorization header is empty string', async () => {
      mockRequest.headers.authorization = '';

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'No authentication token provided',
        })
      );
    });
  });

  describe('Invalid authentication scheme', () => {
    it('should return 401 when scheme is not Bearer', async () => {
      mockRequest.headers.authorization = 'Basic sometoken';

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Invalid authentication scheme',
        })
      );
    });

    it('should return 401 when only Bearer is provided without token', async () => {
      mockRequest.headers.authorization = 'Bearer';

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'No authentication token provided',
        })
      );
    });

    it('should return 401 when Bearer has only whitespace', async () => {
      mockRequest.headers.authorization = 'Bearer   ';

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'No authentication token provided',
        })
      );
    });
  });

  describe('Invalid token values', () => {
    it('should return 401 when token is "undefined"', async () => {
      mockRequest.headers.authorization = 'Bearer undefined';

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Invalid authentication token',
        })
      );
    });

    it('should return 401 when token is "null"', async () => {
      mockRequest.headers.authorization = 'Bearer null';

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Invalid authentication token',
        })
      );
    });

    it('should return 401 when token is malformed', async () => {
      mockRequest.headers.authorization = 'Bearer invalid-malformed-token';

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Invalid authentication token',
        })
      );
    });
  });

  describe('Expired or invalid Firebase tokens', () => {
    it('should return 401 when token verification fails', async () => {
      // Use a fake token that will fail verification
      mockRequest.headers.authorization =
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.invalid';

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Invalid authentication token',
        })
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle case-insensitive Bearer scheme', async () => {
      mockRequest.headers.authorization = 'bearer sometoken';

      await authenticate(mockRequest, mockResponse, mockNext);

      // Should still process (and fail on invalid token, not scheme)
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });

    it('should handle multiple spaces between Bearer and token', async () => {
      const testUser = await createTestUser(testUserId, 'test@example.com', 'Test User');
      const auth = getAuth();
      const token = await auth.createCustomToken(testUser.uid);

      mockRequest.headers.authorization = `Bearer    ${token}`;

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockRequest.user).toBeDefined();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
