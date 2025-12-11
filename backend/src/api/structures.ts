import { Router } from 'express';
import type { Response } from 'express';
import { authenticate, type AuthRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/async-handler';
import { ApiError } from '@/middleware/error';
import { db } from '@/config/firebase';
import { z } from 'zod';

const router = Router();

// Validation schemas
const StructureSchema = z.object({
  name: z.string().min(1).max(100),
  size: z.enum(['tiny', 'small', 'medium', 'large', 'huge']),
  type: z.enum(['settlement', 'dungeon', 'landmark', 'ruin', 'natural', 'other']),
  description: z.string().max(1000).optional(),
  significance: z.number().int().min(1).max(10).default(5),
});

const UpdateStructureSchema = StructureSchema.partial();

/**
 * POST /api/structures
 * Create a new structure
 */
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.uid;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    let data;
    try {
      data = StructureSchema.parse(req.body);
    } catch (error) {
      throw new ApiError(400, 'Invalid structure data');
    }

    const structure = {
      ...data,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const docRef = await db().collection('user_structures').add(structure);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...structure,
      },
    });
  })
);

/**
 * GET /api/structures/user/:userId
 * Get all structures created by a specific user
 */
router.get(
  '/user/:userId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;

    // Ensure user can only get their own structures
    if (req.user?.uid !== userId) {
      throw new ApiError(403, 'Forbidden: Can only access your own structures');
    }

    const snapshot = await db()
      .collection('user_structures')
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc')
      .get();

    const structures = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ success: true, data: structures });
  })
);

/**
 * GET /api/structures/:id
 * Get a specific structure
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const doc = await db()
      .collection('user_structures')
      .doc(id || '')
      .get();

    if (!doc.exists) {
      throw new ApiError(404, 'Structure not found');
    }

    const structure = { id: doc.id, ...doc.data() };

    // Ensure user can only get their own structure
    const data = doc.data();
    if (data?.userId !== req.user?.uid) {
      throw new ApiError(403, 'Forbidden: Can only access your own structures');
    }

    res.json({ success: true, data: structure });
  })
);

/**
 * PUT /api/structures/:id
 * Update a structure
 */
router.put(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const doc = await db()
      .collection('user_structures')
      .doc(id || '')
      .get();

    if (!doc.exists) {
      throw new ApiError(404, 'Structure not found');
    }

    const structure = doc.data();

    // Ensure user can only update their own structure
    if (structure?.userId !== req.user?.uid) {
      throw new ApiError(403, 'Forbidden: Can only update your own structures');
    }

    let updates;
    try {
      updates = UpdateStructureSchema.parse(req.body);
    } catch (error) {
      throw new ApiError(400, 'Invalid structure data');
    }

    const updatedData = {
      ...updates,
      updatedAt: Date.now(),
    };

    await db()
      .collection('user_structures')
      .doc(id || '')
      .update(updatedData);

    const updatedDoc = await db()
      .collection('user_structures')
      .doc(id || '')
      .get();

    res.json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  })
);

/**
 * DELETE /api/structures/:id
 * Delete a structure
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const doc = await db()
      .collection('user_structures')
      .doc(id || '')
      .get();

    if (!doc.exists) {
      throw new ApiError(404, 'Structure not found');
    }

    const structure = doc.data();

    // Ensure user can only delete their own structure
    if (structure?.userId !== req.user?.uid) {
      throw new ApiError(403, 'Forbidden: Can only delete your own structures');
    }

    await db()
      .collection('user_structures')
      .doc(id || '')
      .delete();

    res.json({ success: true, message: 'Structure deleted successfully' });
  })
);

export default router;
