/**
 * @file backend/src/tactical/api/timetravel.ts
 * @description Time-travel API endpoints for tactical combat
 */

import { Router, type Response } from 'express';
import { z } from 'zod';
import { authenticate, type AuthRequest } from '../../middleware/auth.js';
import { ApiError } from '../../middleware/error.js';

const router = Router();

// In-memory session cache (would be replaced with Redis/Firestore in production)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sessionCache = new Map<string, any>();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate and extract encounter ID from route params
 */
function getEncounterIdParam(req: AuthRequest): string {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, 'Encounter ID required');
  }
  return id;
}

// ============================================================================
// Request Schemas
// ============================================================================

const RestoreStateSchema = z.object({
  historyIndex: z.number().int().nonnegative(),
});

// ============================================================================
// GET /api/tactical/encounter/:id/history - Get combat history
// ============================================================================

router.get('/encounter/:id/history', authenticate, async (req: AuthRequest, res: Response) => {
  const id = getEncounterIdParam(req);

  const session = sessionCache.get(id);
  if (!session) {
    throw new ApiError(404, `Encounter session not found: ${id}`);
  }

  const history = session.getHistory();

  res.json({
    success: true,
    data: { history },
  });
});

// ============================================================================
// POST /api/tactical/encounter/:id/restore - Restore to previous state
// ============================================================================

router.post('/encounter/:id/restore', authenticate, async (req: AuthRequest, res: Response) => {
  const id = getEncounterIdParam(req);
  const { historyIndex } = RestoreStateSchema.parse(req.body);

  const session = sessionCache.get(id);
  if (!session) {
    throw new ApiError(404, `Encounter session not found: ${id}`);
  }

  const restoredState = await session.restoreState(historyIndex);

  res.json({
    success: true,
    data: { state: restoredState },
  });
});

// ============================================================================
// POST /api/tactical/encounter/:id/fork - Fork from a previous state
// ============================================================================

router.post('/encounter/:id/fork', authenticate, async (req: AuthRequest, res: Response) => {
  const id = getEncounterIdParam(req);
  const { historyIndex } = RestoreStateSchema.parse(req.body);

  const session = sessionCache.get(id);
  if (!session) {
    throw new ApiError(404, `Encounter session not found: ${id}`);
  }

  const forkedState = await session.forkFromState(historyIndex);

  res.json({
    success: true,
    data: { state: forkedState },
  });
});

export default router;
export { sessionCache };
