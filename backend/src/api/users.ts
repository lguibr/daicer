/**
 * User management API endpoints
 */

import { Router } from 'express';
import type { Response } from 'express';
import { authenticate, type AuthRequest } from '@/middleware/auth';
import { createUser, getUser } from '@/services/firestore';

const router = Router();

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile, creating it if it doesn't exist
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const { uid, email, name } = req.user!;

  let user = await getUser(uid);

  if (!user) {
    // Create user profile on first login
    user = await createUser(uid, email, name, '');
  }

  res.json({ success: true, data: user });
});

export default router;
