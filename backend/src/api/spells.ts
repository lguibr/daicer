/**
 * @file backend/src/api/spells.ts
 * @description REST API endpoints for spell data
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { SpellEffectShape } from '../types/spells';
import { getAllSpells } from '../combat/spell-catalog';

const router = Router();

/**
 * GET /api/spells
 * List all spells with optional filtering
 */
router.get('/', (req: Request, res: Response) => {
  try {
    let spells = getAllSpells();

    // Filter by level
    if (req.query.level) {
      const level = parseInt(req.query.level as string, 10);
      spells = spells.filter((s) => s.level === level);
    }

    // Filter by school
    if (req.query.school) {
      const school = (req.query.school as string).toLowerCase();
      spells = spells.filter((s) => s.school === school);
    }

    // Filter by effect shape
    if (req.query.effectShape) {
      const shape = req.query.effectShape as string;
      spells = spells.filter((s) => s.effectShape === shape);
    }

    // Filter by class
    if (req.query.class) {
      const className = req.query.class as string;
      spells = spells.filter((s) => s.classes?.includes(className));
    }

    // Search by name
    if (req.query.name) {
      const search = (req.query.name as string).toLowerCase();
      spells = spells.filter((s) => s.name.toLowerCase().includes(search));
    }

    // Pagination
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const start = (page - 1) * limit;
    const end = start + limit;

    const paginatedSpells = spells.slice(start, end);

    res.json({
      spells: paginatedSpells,
      total: spells.length,
      page,
      limit,
      totalPages: Math.ceil(spells.length / limit),
    });
  } catch (error) {
    console.error('Error fetching spells:', error);
    res.status(500).json({ error: 'Failed to fetch spells' });
  }
});

/**
 * GET /api/spells/:id
 * Get single spell by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const spells = getAllSpells();
    const spell = spells.find((s) => s.id === req.params.id);

    if (!spell) {
      res.status(404).json({ error: 'Spell not found' });
      return;
    }

    res.json(spell);
  } catch (error) {
    console.error('Error fetching spell:', error);
    res.status(500).json({ error: 'Failed to fetch spell' });
  }
});

/**
 * GET /api/spells/search/query
 * Search spells by name or description
 */
router.get('/search/query', (req: Request, res: Response) => {
  try {
    const query = ((req.query.q as string) || '').toLowerCase();

    if (!query) {
      res.json({ spells: [], total: 0 });
      return;
    }

    const spells = getAllSpells();
    const results = spells.filter(
      (s) => s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)
    );

    res.json({
      spells: results,
      total: results.length,
      query,
    });
  } catch (error) {
    console.error('Error searching spells:', error);
    res.status(500).json({ error: 'Failed to search spells' });
  }
});

/**
 * GET /api/spells/shapes/:shape
 * Get all spells with specific effect shape
 */
router.get('/shapes/:shape', (req: Request, res: Response) => {
  try {
    const shape = req.params.shape as SpellEffectShape;
    const spells = getAllSpells();
    const results = spells.filter((s) => s.effectShape === shape);

    res.json({
      shape,
      spells: results,
      total: results.length,
    });
  } catch (error) {
    console.error('Error fetching spells by shape:', error);
    res.status(500).json({ error: 'Failed to fetch spells' });
  }
});

/**
 * GET /api/spells/levels/:level
 * Get all spells of specific level
 */
router.get('/levels/:level', (req: Request, res: Response) => {
  try {
    const { level: levelParam } = req.params;
    if (typeof levelParam !== 'string') {
      res.status(400).json({ error: 'Missing spell level parameter' });
      return;
    }

    const level = Number.parseInt(levelParam, 10);

    if (Number.isNaN(level) || level < 0 || level > 9) {
      res.status(400).json({ error: 'Invalid spell level (must be 0-9)' });
      return;
    }

    const spells = getAllSpells();
    const results = spells.filter((s) => s.level === level);

    res.json({
      level,
      spells: results,
      total: results.length,
    });
  } catch (error) {
    console.error('Error fetching spells by level:', error);
    res.status(500).json({ error: 'Failed to fetch spells' });
  }
});

export default router;
