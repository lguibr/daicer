/**
 * Authentication API endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { ApiError } from '@/middleware/error';
import { authMiddleware } from '@/middleware/auth';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * POST /api/auth/refresh
 * Refresh Firebase ID token
 *
 * Firebase ID tokens expire after 1 hour. This endpoint allows clients to
 * refresh their token using a custom refresh token stored in Firestore.
 *
 * Note: Firebase handles token refresh automatically via the Firebase SDK
 * on the client side. This endpoint is for advanced use cases or custom auth flows.
 */
router.post('/refresh', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.uid;
    const auth = getAuth();
    const firestore = getFirestore();

    logger.info('Token refresh requested', { userId });

    // Verify user still exists and is not disabled
    const userRecord = await auth.getUser(userId);
    if (userRecord.disabled) {
      throw new ApiError(403, 'User account is disabled');
    }

    // Get user's refresh token metadata from Firestore
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new ApiError(404, 'User not found');
    }

    const userData = userDoc.data();
    const lastRefresh = userData?.lastTokenRefresh;

    // Create a new custom token for the user
    // In production, you would use Firebase's built-in refresh token mechanism
    // This is mainly for testing/debugging purposes
    const customToken = await auth.createCustomToken(userId);

    // Update last refresh timestamp
    await firestore.collection('users').doc(userId).update({
      lastTokenRefresh: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    logger.info('Token refreshed successfully', { userId, lastRefresh });

    res.json({
      success: true,
      data: {
        customToken,
        message: 'Token refreshed. Exchange this custom token for an ID token using Firebase Auth.',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/revoke
 * Revoke all refresh tokens for the current user
 * Useful for "logout from all devices" functionality
 */
router.post('/revoke', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.uid;
    const auth = getAuth();
    const firestore = getFirestore();

    logger.info('Token revocation requested', { userId });

    // Revoke all refresh tokens for this user
    await auth.revokeRefreshTokens(userId);

    // Update Firestore metadata
    await firestore.collection('users').doc(userId).update({
      tokensRevokedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    logger.info('All tokens revoked successfully', { userId });

    res.json({
      success: true,
      data: {
        message: 'All refresh tokens have been revoked. Please sign in again.',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/session
 * Get current session information
 */
router.get('/session', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.uid;
    const auth = getAuth();

    // Get user record
    const userRecord = await auth.getUser(userId);

    // Get token validation time (when tokens were last revoked)
    const tokensValidAfterTime = userRecord.tokensValidAfterTime
      ? new Date(userRecord.tokensValidAfterTime).toISOString()
      : null;

    res.json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        metadata: {
          creationTime: userRecord.metadata.creationTime,
          lastSignInTime: userRecord.metadata.lastSignInTime,
          lastRefreshTime: userRecord.metadata.lastRefreshTime,
        },
        tokensValidAfterTime,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
