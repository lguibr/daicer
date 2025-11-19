import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { Response } from 'express';
import { authenticate, type AuthRequest } from '../auth';
import { ApiError } from '../error';
import * as firebase from '@/config/firebase';

type DecodedIdToken = {
  uid: string;
  email?: string | null;
  name?: string | null;
};

describe('authenticate middleware', () => {
  const verifyIdToken = jest.fn<(token: string) => Promise<DecodedIdToken>>();
  const getFirebaseAuthSpy = jest.spyOn(firebase, 'getFirebaseAuth');

  beforeEach(() => {
    verifyIdToken.mockReset();
    getFirebaseAuthSpy.mockReset();
    getFirebaseAuthSpy.mockReturnValue({
      verifyIdToken,
    } as unknown as ReturnType<typeof firebase.getFirebaseAuth>);
  });

  it('attaches decoded user on valid bearer token', async () => {
    verifyIdToken.mockResolvedValue({
      uid: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
    });
    const req = {
      headers: { authorization: 'Bearer valid-token' },
    } as unknown as AuthRequest;
    const next = jest.fn();

    await authenticate(req, {} as Response, next);

    expect(verifyIdToken).toHaveBeenCalledWith('valid-token', true);
    expect(req.user).toEqual({
      uid: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      role: 'free',
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('accepts lowercase bearer scheme', async () => {
    verifyIdToken.mockResolvedValue({
      uid: 'user-123',
    });

    const req = {
      headers: { authorization: 'bearer valid-token' },
    } as unknown as AuthRequest;
    const next = jest.fn();

    await authenticate(req, {} as Response, next);

    expect(verifyIdToken).toHaveBeenCalledWith('valid-token', true);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects requests without an authorization header', async () => {
    const req = { headers: {}, query: {} } as unknown as AuthRequest;
    const next = jest.fn();

    await authenticate(req, {} as Response, next);

    expect(getFirebaseAuthSpy).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    const firstCall = next.mock.calls.at(0);
    expect(firstCall).toBeDefined();
    const [error] = firstCall as [ApiError];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('No authentication token provided');
    expect(error.statusCode).toBe(401);
  });

  it('rejects non-bearer authorization schemes', async () => {
    const req = {
      headers: { authorization: 'Basic abc123' },
      query: {},
    } as unknown as AuthRequest;
    const next = jest.fn();

    await authenticate(req, {} as Response, next);

    expect(getFirebaseAuthSpy).not.toHaveBeenCalled();
    const firstCall = next.mock.calls.at(0);
    expect(firstCall).toBeDefined();
    const [error] = firstCall as [ApiError];
    expect(error.message).toBe('Invalid authentication scheme');
  });

  it('rejects empty bearer tokens', async () => {
    const req = {
      headers: { authorization: 'Bearer    ' },
      query: {},
    } as unknown as AuthRequest;
    const next = jest.fn();

    await authenticate(req, {} as Response, next);

    expect(getFirebaseAuthSpy).not.toHaveBeenCalled();
    const firstCall = next.mock.calls.at(0);
    expect(firstCall).toBeDefined();
    const [error] = firstCall as [ApiError];
    expect(error.message).toBe('No authentication token provided');
  });

  it('rejects literal undefined bearer tokens', async () => {
    const req = {
      headers: { authorization: 'Bearer undefined' },
    } as unknown as AuthRequest;
    const next = jest.fn();

    await authenticate(req, {} as Response, next);

    expect(getFirebaseAuthSpy).not.toHaveBeenCalled();
    const firstCall = next.mock.calls.at(0);
    expect(firstCall).toBeDefined();
    const [error] = firstCall as [ApiError];
    expect(error.message).toBe('Invalid authentication token');
  });

  it('rejects literal null bearer tokens', async () => {
    const req = {
      headers: { authorization: 'Bearer null' },
    } as unknown as AuthRequest;
    const next = jest.fn();

    await authenticate(req, {} as Response, next);

    expect(getFirebaseAuthSpy).not.toHaveBeenCalled();
    const firstCall = next.mock.calls.at(0);
    expect(firstCall).toBeDefined();
    const [error] = firstCall as [ApiError];
    expect(error.message).toBe('Invalid authentication token');
  });

  it('rejects when Firebase verification fails', async () => {
    verifyIdToken.mockRejectedValue(new Error('invalid token'));
    const req = {
      headers: { authorization: 'Bearer bad-token' },
    } as unknown as AuthRequest;
    const next = jest.fn();

    await authenticate(req, {} as Response, next);

    expect(verifyIdToken).toHaveBeenCalledWith('bad-token', true);
    const firstCall = next.mock.calls.at(0);
    expect(firstCall).toBeDefined();
    const [error] = firstCall as [ApiError];
    expect(error.message).toBe('Invalid authentication token');
  });
});
