/**
 * User management API endpoints
 */

import { Router } from 'express';
import type { Response } from 'express';
import { authenticate, type AuthRequest } from '@/middleware/auth';
import { createUser, getUser } from '@/services/firestore';

const router = Router();

/**
 * Get or create current user profile
 * @route GET /api/users/me
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
