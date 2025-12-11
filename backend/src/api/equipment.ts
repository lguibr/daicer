/**
 * Equipment API Routes
 * REST endpoints for equipment management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate as authenticateToken } from '../middleware/auth';
import { getAllEquipment, getItemByIndex, getStartingGold } from '../services/equipment/equipmentService';
import { getStartingPack } from '../services/equipment/startingPacks';
import {
  getPlayerEquipment,
  addItemToInventory,
  removeItemFromInventory,
  equipItem,
  unequipItem,
  applyStartingPack,
} from '../services/equipment/playerInventory';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const itemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  weight: z.number().optional(),
  value: z
    .object({
      amount: z.number(),
      currency: z.string(),
    })
    .optional(),
  quantity: z.number().int().min(1),
  slot: z.string().optional(),
});

const equipSchema = z.object({
  itemId: z.string().min(1),
  slot: z.string().min(1),
});

const unequipSchema = z.object({
  slot: z.string().min(1),
});

const startingPackSchema = z.object({
  pack: z.string().min(1),
  characterClass: z.string().min(1),
});

/**
 * GET /api/equipment/items
 * Get all equipment items
 */
router.get('/items', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const items = getAllEquipment();
    return res.json({ items });
  } catch (error) {
    logger.error('[EquipmentAPI] Error getting items:', error);
    return res.status(500).json({ error: 'Failed to get equipment items' });
  }
});

/**
 * GET /api/equipment/items/:index
 * Get specific equipment item
 */
router.get('/items/:index', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { index } = req.params;
    const item = getItemByIndex(index || '');

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    return res.json({ item });
  } catch (error) {
    logger.error('[EquipmentAPI] Error getting item:', error);
    return res.status(500).json({ error: 'Failed to get equipment item' });
  }
});

/**
 * GET /api/equipment/packs/:className
 * Get starting pack for a class
 */
router.get('/packs/:className', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { className } = req.params;
    const pack = getStartingPack(className || '');

    if (!pack) {
      return res.status(404).json({ error: 'Starting pack not found for this class' });
    }

    return res.json({ pack });
  } catch (error) {
    logger.error('[EquipmentAPI] Error getting starting pack:', error);
    return res.status(500).json({ error: 'Failed to get starting pack' });
  }
});

/**
 * GET /api/equipment/starting-gold/:className
 * Get starting gold for a class
 */
router.get('/starting-gold/:className', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { className } = req.params;
    const gold = getStartingGold(className || '');
    return res.json({ startingGold: gold });
  } catch (error) {
    logger.error('[EquipmentAPI] Error getting starting gold:', error);
    return res.status(500).json({ error: 'Failed to get starting gold' });
  }
});

// === Player Inventory Management Routes ===

/**
 * GET /api/equipment/:roomId/:playerId
 * Get player inventory and equipped items
 */
router.get('/:roomId/:playerId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { roomId, playerId } = req.params;
    const equipment = await getPlayerEquipment(roomId || '', playerId || '');
    return res.json({ success: true, data: equipment });
  } catch (error) {
    logger.error('[EquipmentAPI] Error getting player equipment:', error);
    if (error instanceof Error && error.message === 'Player not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Failed to get player equipment' });
  }
});

/**
 * POST /api/equipment/:roomId/:playerId/item
 * Add item to player inventory
 */
router.post('/:roomId/:playerId/item', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { roomId, playerId } = req.params;
    const validation = itemSchema.safeParse(req.body.item);

    if (!validation.success) {
      return res.status(400).json({ success: false, error: 'Invalid item data', details: validation.error.issues });
    }

    const equipment = await addItemToInventory(roomId || '', playerId || '', validation.data);
    return res.status(201).json({ success: true, data: equipment });
  } catch (error) {
    logger.error('[EquipmentAPI] Error adding item:', error);
    if (error instanceof Error && error.message === 'Player not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Failed to add item' });
  }
});

/**
 * DELETE /api/equipment/:roomId/:playerId/item/:itemId
 * Remove item from player inventory
 */
router.delete('/:roomId/:playerId/item/:itemId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { roomId, playerId, itemId } = req.params;
    const equipment = await removeItemFromInventory(roomId || '', playerId || '', itemId || '');
    return res.json({ success: true, data: equipment });
  } catch (error) {
    logger.error('[EquipmentAPI] Error removing item:', error);
    if (
      error instanceof Error &&
      (error.message === 'Player not found' || error.message === 'Item not found in inventory')
    ) {
      return res.status(404).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Failed to remove item' });
  }
});

/**
 * POST /api/equipment/:roomId/:playerId/equip
 * Equip item from inventory
 */
router.post('/:roomId/:playerId/equip', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { roomId, playerId } = req.params;
    const validation = equipSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ success: false, error: 'Invalid request data', details: validation.error.issues });
    }

    const { itemId, slot } = validation.data;
    const equipment = await equipItem(roomId || '', playerId || '', itemId, slot);
    return res.json({ success: true, data: equipment });
  } catch (error) {
    logger.error('[EquipmentAPI] Error equipping item:', error);
    if (
      error instanceof Error &&
      (error.message === 'Player not found' || error.message === 'Item not found in inventory')
    ) {
      return res.status(404).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Failed to equip item' });
  }
});

/**
 * POST /api/equipment/:roomId/:playerId/unequip
 * Unequip item from slot
 */
router.post('/:roomId/:playerId/unequip', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { roomId, playerId } = req.params;
    const validation = unequipSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ success: false, error: 'Invalid request data', details: validation.error.issues });
    }

    const { slot } = validation.data;
    const equipment = await unequipItem(roomId || '', playerId || '', slot);

    if (!equipment) {
      return res.status(500).json({ error: 'Failed to unequip item' });
    }

    return res.json({ success: true, data: equipment });
  } catch (error) {
    logger.error('[EquipmentAPI] Error unequipping item:', error);
    if (
      error instanceof Error &&
      (error.message === 'Player not found' || error.message === 'No item equipped in that slot')
    ) {
      return res.status(404).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Failed to unequip item' });
  }
});

/**
 * POST /api/equipment/:roomId/:playerId/starting-pack
 * Apply starting equipment pack
 */
router.post('/:roomId/:playerId/starting-pack', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { roomId, playerId } = req.params;
    const validation = startingPackSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ success: false, error: 'Invalid request data', details: validation.error.issues });
    }

    const { pack } = validation.data; // characterClass removed if unused or mismatch
    // Verify applyStartingPack arguments: (roomId, playerId, packId)
    const equipment = await applyStartingPack(roomId || '', playerId || '', pack);

    return res.json({ success: true, data: equipment });
  } catch (error) {
    logger.error('[EquipmentAPI] Error applying starting pack:', error);
    if (
      error instanceof Error &&
      (error.message === 'Player not found' || error.message.includes('Starting pack not found'))
    ) {
      return res
        .status(error.message.includes('Starting pack') ? 400 : 404)
        .json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Failed to apply starting pack' });
  }
});

export default router;
