/**
 * Game Data API endpoints
 * Provides access to D&D 5e SRD data for the frontend
 */

import { Router } from 'express';
import {
  ALIGNMENTS,
  ABILITIES,
  SKILLS,
  RACES,
  CLASSES,
  BACKGROUNDS,
  LANGUAGES,
  MAGIC_SCHOOLS,
  CONDITIONS,
  DAMAGE_TYPES,
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_ITEMS,
  WEAPON_PROPERTIES,
} from '@/game-data/index';
import { successResponse } from '@/utils/response';

const router = Router();

/**
 * GET /api/game-data/alignments
 * Get all character alignments
 */
router.get('/alignments', (_req, res) => {
  res.json(successResponse(ALIGNMENTS));
});

/**
 * GET /api/game-data/abilities
 * Get all ability scores
 */
router.get('/abilities', (_req, res) => {
  res.json(successResponse(ABILITIES));
});

/**
 * GET /api/game-data/skills
 * Get all skills
 */
router.get('/skills', (_req, res) => {
  res.json(successResponse(SKILLS));
});

/**
 * GET /api/game-data/races
 * Get all player races
 */
router.get('/races', (_req, res) => {
  res.json(successResponse(RACES));
});

/**
 * GET /api/game-data/classes
 * Get all character classes
 */
router.get('/classes', (_req, res) => {
  res.json(successResponse(CLASSES));
});

/**
 * GET /api/game-data/backgrounds
 * Get all character backgrounds
 */
router.get('/backgrounds', (_req, res) => {
  res.json(successResponse(BACKGROUNDS));
});

/**
 * GET /api/game-data/languages
 * Get all languages
 */
router.get('/languages', (_req, res) => {
  res.json(successResponse(LANGUAGES));
});

/**
 * GET /api/game-data/magic-schools
 * Get all schools of magic
 */
router.get('/magic-schools', (_req, res) => {
  res.json(successResponse(MAGIC_SCHOOLS));
});

/**
 * GET /api/game-data/conditions
 * Get all combat conditions
 */
router.get('/conditions', (_req, res) => {
  res.json(successResponse(CONDITIONS));
});

/**
 * GET /api/game-data/damage-types
 * Get all damage types
 */
router.get('/damage-types', (_req, res) => {
  res.json(successResponse(DAMAGE_TYPES));
});

/**
 * GET /api/game-data/equipment-categories
 * Get all equipment categories
 */
router.get('/equipment-categories', (_req, res) => {
  res.json(successResponse(EQUIPMENT_CATEGORIES));
});

/**
 * GET /api/game-data/equipment
 * Get all equipment items
 */
router.get('/equipment', (_req, res) => {
  res.json(successResponse(EQUIPMENT_ITEMS));
});

/**
 * GET /api/game-data/weapon-properties
 * Get all weapon properties
 */
router.get('/weapon-properties', (_req, res) => {
  res.json(successResponse(WEAPON_PROPERTIES));
});

export default router;
