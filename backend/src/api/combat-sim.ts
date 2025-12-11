import { Router, type Request, type Response } from 'express';
import { getSimulationById, listSimulations } from '@/combat/simulations/demoSimulation';
import { createCombatSession } from '@/combat/graph';
import { getSpellByIdOrThrow } from '@/combat/spell-catalog';
import type { CombatCharacter } from '@/graph/state';
import { logger } from '@/utils/logger';

const router = Router();

router.get('/simulations', (_req: Request, res: Response) => {
  try {
    const scenarios = listSimulations();
    res.json({
      success: true,
      data: scenarios,
    });
  } catch (error) {
    logger.error('Failed to list combat simulations', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list combat simulations',
    });
  }
});

router.get('/simulations/:simulationId', async (req: Request, res: Response) => {
  try {
    const { simulationId } = req.params;

    if (!simulationId) {
      res.status(400).json({
        success: false,
        error: 'Simulation ID is required',
      });
      return;
    }

    const simulation = await getSimulationById(simulationId);

    if (!simulation) {
      res.status(404).json({
        success: false,
        error: 'Simulation not found',
      });
      return;
    }

    res.json({
      success: true,
      data: simulation,
    });
  } catch (error) {
    logger.error('Failed to generate combat simulation', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate combat simulation',
    });
  }
});

interface SpellTargetPayload {
  type?: 'point' | 'direction';
  x?: number;
  y?: number;
  direction?: number;
}

interface SpellCharacterPayload
  extends Partial<Omit<CombatCharacter, 'position' | 'id' | 'name' | 'hp' | 'armorClass' | 'isPlayer'>> {
  id: string;
  name: string;
  hp: number;
  armorClass: number;
  position: { x: number; y: number };
  isPlayer: boolean;
}

interface SpellScenarioPayload {
  spellId: string;
  casterId: string;
  characters: SpellCharacterPayload[];
  grid?: {
    width?: number;
    height?: number;
  };
  target?: SpellTargetPayload;
  obstacles?: Array<{ x: number; y: number }>;
  seed?: number;
  confirmFriendlyFire?: boolean;
}

function parseTarget(payload?: SpellTargetPayload):
  | {
      type?: 'point' | 'direction';
      position?: { x: number; y: number };
      direction?: number;
    }
  | undefined {
  if (!payload) return undefined;

  if (payload.type === 'direction' || typeof payload.direction === 'number') {
    return {
      type: 'direction',
      direction: Number(payload.direction ?? 6),
    };
  }

  if (typeof payload.x === 'number' && typeof payload.y === 'number') {
    return {
      type: 'point',
      position: { x: payload.x, y: payload.y },
    };
  }

  return undefined;
}

function parseObstacles(raw?: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> | undefined {
  if (!raw) return undefined;
  return raw
    .map((obstacle) => {
      if (typeof obstacle.x !== 'number' || typeof obstacle.y !== 'number') {
        return null;
      }
      return { x: obstacle.x, y: obstacle.y };
    })
    .filter((value): value is { x: number; y: number } => value !== null);
}

function normalizeCharacters(characters: SpellCharacterPayload[]): CombatCharacter[] {
  return characters.map((character) => ({
    id: character.id,
    name: character.name,
    hp: character.hp,
    maxHp: character.maxHp ?? character.hp,
    tempHp: character.tempHp ?? 0,
    armorClass: character.armorClass,
    position: { ...character.position, z: (character.position as any).z ?? 0 },
    initiative: character.initiative ?? 0,
    initiativeBonus: 0,
    attackBonus: 0,
    avatar: character.avatar ?? '',
    isPlayer: character.isPlayer,
    strength: character.strength ?? 10,
    dexterity: character.dexterity ?? 10,
    constitution: character.constitution ?? 10,
    intelligence: character.intelligence ?? 10,
    wisdom: character.wisdom ?? 10,
    charisma: character.charisma ?? 10,
    proficiencyBonus: character.proficiencyBonus ?? 2,
    speed: character.speed ?? 6,
    reach: character.reach ?? 1,
    hasMoved: character.hasMoved ?? false,
    hasActed: character.hasActed ?? false,
    hasReaction: character.hasReaction ?? true,
    hasBonusAction: character.hasBonusAction ?? true,
    movementRemaining: character.movementRemaining ?? character.speed ?? 6,
    conditions: character.conditions ?? [],
    deathSaves: character.deathSaves,
  }));
}

router.post('/spell/preview', async (req: Request<unknown, unknown, SpellScenarioPayload>, res: Response) => {
  try {
    const { spellId, casterId, characters, grid, target, obstacles, seed } = req.body;

    if (!spellId || !casterId) {
      res.status(400).json({ success: false, error: 'spellId and casterId are required' });
      return;
    }

    if (!Array.isArray(characters) || characters.length === 0) {
      res.status(400).json({ success: false, error: 'characters array is required' });
      return;
    }

    const normalizedCharacters = normalizeCharacters(characters);
    if (!normalizedCharacters.some((character) => character.id === casterId)) {
      res.status(400).json({ success: false, error: 'casterId must reference a character in the scenario' });
      return;
    }

    const spell = getSpellByIdOrThrow(spellId);

    const session = createCombatSession(`spell-preview-${Date.now()}`, seed);
    await session.startCombat(normalizedCharacters);

    const gridWidth = grid?.width ?? session.getState().gridWidth;
    const gridHeight = grid?.height ?? session.getState().gridHeight;
    session.setGridDimensions(gridWidth, gridHeight);

    const previewState = await session.previewSpell({
      casterId,
      spell,
      target: parseTarget(target),
      obstacles: parseObstacles(obstacles),
      gridWidth,
      gridHeight,
    });

    res.json({
      success: true,
      data: {
        combatState: previewState,
        preview: previewState.spellPreview,
      },
    });
  } catch (error) {
    logger.error('Failed to preview spell scenario', error);
    res.status(500).json({ success: false, error: 'Failed to preview spell scenario' });
  }
});

router.post('/spell/cast', async (req: Request<unknown, unknown, SpellScenarioPayload>, res: Response) => {
  try {
    const { spellId, casterId, characters, grid, target, obstacles, seed, confirmFriendlyFire } = req.body;

    if (!spellId || !casterId) {
      res.status(400).json({ success: false, error: 'spellId and casterId are required' });
      return;
    }

    if (!Array.isArray(characters) || characters.length === 0) {
      res.status(400).json({ success: false, error: 'characters array is required' });
      return;
    }

    const normalizedCharacters = normalizeCharacters(characters);
    if (!normalizedCharacters.some((character) => character.id === casterId)) {
      res.status(400).json({ success: false, error: 'casterId must reference a character in the scenario' });
      return;
    }

    const spell = getSpellByIdOrThrow(spellId);

    const session = createCombatSession(`spell-cast-${Date.now()}`, seed);
    await session.startCombat(normalizedCharacters);

    const gridWidth = grid?.width ?? session.getState().gridWidth;
    const gridHeight = grid?.height ?? session.getState().gridHeight;
    session.setGridDimensions(gridWidth, gridHeight);

    const previewState = await session.previewSpell({
      casterId,
      spell,
      target: parseTarget(target),
      obstacles: parseObstacles(obstacles),
      gridWidth,
      gridHeight,
    });

    if (previewState.spellPreview?.friendlyFireRisk && confirmFriendlyFire !== true) {
      res.json({
        success: true,
        data: {
          blocked: true,
          preview: previewState.spellPreview,
          combatState: previewState,
        },
      });
      return;
    }

    const castState = await session.castSpell({
      casterId,
      spell,
      target: parseTarget(target),
      obstacles: parseObstacles(obstacles),
      gridWidth,
      gridHeight,
    });

    res.json({
      success: true,
      data: {
        blocked: false,
        combatState: castState,
        preview: previewState.spellPreview,
        resolution: castState.lastSpellResolution,
      },
    });
  } catch (error) {
    logger.error('Failed to resolve spell scenario', error);
    res.status(500).json({ success: false, error: 'Failed to resolve spell scenario' });
  }
});

export default router;
