import { type Request, type Response, Router } from 'express';
import { explorationService } from '@/services/explorationService';

const router = Router();

/**
 * GET /api/explore/chunk/:x/:y/:z
 * Returns a procedurally generated chunk at world coordinates
 * Public endpoint for prototype
 */
router.get('/chunk/:x/:y/:z', async (req: Request, res: Response) => {
    try {
        const x = parseInt(req.params.x, 10);
        const y = parseInt(req.params.y, 10);
        const z = parseInt(req.params.z, 10);

        if (isNaN(x) || isNaN(y) || isNaN(z)) {
            return res.status(400).json({ error: 'Invalid coordinates' });
        }

        // Z-level validation (-3 to +3)
        if (z < -3 || z > 3) {
            return res.status(400).json({ error: 'Z-level must be between -3 and +3' });
        }

        const chunk = await explorationService.generateChunk(x, y, z);

        return res.json({
            success: true,
            data: {
                x,
                y,
                z,
                chunk,
            },
        });
    } catch (error) {
        console.error('[Explore] Chunk generation error:', error);
        return res.status(500).json({
            error: 'Failed to generate chunk',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * POST /api/explore/reveal
 * Track explored areas for a session
 * Body: { sessionId: string, position: { x, y, z }, radius: number }
 */
router.post('/reveal', async (req: Request, res: Response) => {
    try {
        const { sessionId, position, radius } = req.body;

        if (!sessionId || !position || typeof radius !== 'number') {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const { x, y, z } = position;
        if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
            return res.status(400).json({ error: 'Invalid position' });
        }

        const explored = explorationService.revealArea(sessionId, x, y, z, radius);

        return res.json({
            success: true,
            data: {
                explored: Array.from(explored),
            },
        });
    } catch (error) {
        console.error('[Explore] Reveal error:', error);
        return res.status(500).json({
            error: 'Failed to reveal area',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
