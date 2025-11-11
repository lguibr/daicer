/**
 * Game Data API endpoints
 * Provides access to D&D 5e SRD data for the frontend
 * Now powered by Firestore with caching
 */

import { Router } from 'express';
import {
  getAlignments,
  getAbilities,
  getSkills,
  getRaces,
  getClasses,
  getBackgrounds,
  getLanguages,
  getMagicSchools,
  getConditions,
  getDamageTypes,
  getEquipmentCategories,
  getEquipment,
  getWeaponProperties,
} from '@/services/game-data';
import {
  generateCharacterFromArchetype,
  getAvailableArchetypes,
  getArchetypeInfo,
} from '@/services/character-templates';
import { successResponse } from '@/utils/response';

const router = Router();

/**
 * GET /api/game-data/alignments
 * Get all character alignments
 */
router.get('/alignments', async (_req, res) => {
  try {
    const data = await getAlignments();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alignments' });
  }
});

/**
 * GET /api/game-data/abilities
 * Get all ability scores
 */
router.get('/abilities', async (_req, res) => {
  try {
    const data = await getAbilities();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch abilities' });
  }
});

/**
 * GET /api/game-data/skills
 * Get all skills
 */
router.get('/skills', async (_req, res) => {
  try {
    const data = await getSkills();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

/**
 * GET /api/game-data/races
 * Get all player races
 */
router.get('/races', async (_req, res) => {
  try {
    const data = await getRaces();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch races' });
  }
});

/**
 * GET /api/game-data/classes
 * Get all character classes
 */
router.get('/classes', async (_req, res) => {
  try {
    const data = await getClasses();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

/**
 * GET /api/game-data/backgrounds
 * Get all character backgrounds
 */
router.get('/backgrounds', async (_req, res) => {
  try {
    const data = await getBackgrounds();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch backgrounds' });
  }
});

/**
 * GET /api/game-data/languages
 * Get all languages
 */
router.get('/languages', async (_req, res) => {
  try {
    const data = await getLanguages();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

/**
 * GET /api/game-data/magic-schools
 * Get all schools of magic
 */
router.get('/magic-schools', async (_req, res) => {
  try {
    const data = await getMagicSchools();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch magic schools' });
  }
});

/**
 * GET /api/game-data/conditions
 * Get all combat conditions
 */
router.get('/conditions', async (_req, res) => {
  try {
    const data = await getConditions();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conditions' });
  }
});

/**
 * GET /api/game-data/damage-types
 * Get all damage types
 */
router.get('/damage-types', async (_req, res) => {
  try {
    const data = await getDamageTypes();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch damage types' });
  }
});

/**
 * GET /api/game-data/equipment-categories
 * Get all equipment categories
 */
router.get('/equipment-categories', async (_req, res) => {
  try {
    const data = await getEquipmentCategories();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch equipment categories' });
  }
});

/**
 * GET /api/game-data/equipment
 * Get all equipment items
 */
router.get('/equipment', async (_req, res) => {
  try {
    const data = await getEquipment();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

/**
 * GET /api/game-data/weapon-properties
 * Get all weapon properties
 */
router.get('/weapon-properties', async (_req, res) => {
  try {
    const data = await getWeaponProperties();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weapon properties' });
  }
});

/**
 * GET /api/game-data/character-templates
 * Get list of available pre-made character templates
 */
router.get('/character-templates', async (_req, res) => {
  try {
    const archetypes = getAvailableArchetypes();
    const templates = archetypes.map((key) => ({
      id: key,
      ...getArchetypeInfo(key),
    }));
    res.json(successResponse(templates));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch character templates' });
  }
});

/**
 * GET /api/game-data/character-templates/:archetype
 * Generate a complete character from a template
 */
router.get('/character-templates/:archetype', async (req, res) => {
  try {
    const { archetype } = req.params;
    const character = generateCharacterFromArchetype(archetype);
    res.json(successResponse(character));
  } catch (error) {
    res.status(404).json({ error: 'Template not found' });
  }
});

export default router;
