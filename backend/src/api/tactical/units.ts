/**
 * @file backend/src/api/tactical/units.ts
 * @description Tactical encounter management API endpoints
 */

import { Router, type Response } from 'express';
import { z } from 'zod';
import { authenticate, type AuthRequest } from '@/middleware/auth';
import { ApiError } from '@/middleware/error';
import { DiceRoller } from '@/combat/dice';
import { getArenaById } from '@/tactical/arenas/generator';
import {
  createTacticalUnit,
  getAbilityModifier,
  resetTurnResources,
  addLogEntry,
  type TacticalEncounter,
  type TacticalUnit,
} from '@/tactical/types/unit';
import { createGridManager } from '@/tactical/services/gridManager';
import { generateArenaFromWorld } from '@/services/world-gen/tacticalBridge';

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

const GridPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const router = Router();

// In-memory store for tactical encounters (temporary - would move to Firestore)
const encountersStore = new Map<string, TacticalEncounter>();

// ============================================================================
// Request Schemas
// ============================================================================

const CreateEncounterSchema = z.object({
  arenaId: z.string(),
});

const AddUnitSchema = z.object({
  name: z.string(),
  hp: z.number().positive(),
  maxHp: z.number().positive(),
  armorClass: z.number().positive(),
  position: GridPositionSchema,
  allegiance: z.enum(['player', 'enemy', 'neutral']),
  avatar: z.string().optional(),
  attributes: z
    .object({
      strength: z.number(),
      dexterity: z.number(),
      constitution: z.number(),
      intelligence: z.number(),
      wisdom: z.number(),
      charisma: z.number(),
    })
    .optional(),
  proficiencyBonus: z.number().optional(),
  speed: z.number().optional(),
  reach: z.number().optional(),
});

const UpdateUnitPositionSchema = z.object({
  position: GridPositionSchema,
});

const GenerateArenaSchema = z.object({
  worldSeed: z.number(),
  worldX: z.number(),
  worldY: z.number(),
  name: z.string().optional(),
});

// ============================================================================
// Arena Management
// ============================================================================

/**
 * GET /api/tactical/arenas - Get all available arenas
 */
router.get('/arenas', (_req, res) => {
  const arenas = [
    { id: 'tavern-brawl', name: 'Tavern Brawl' },
    { id: 'dungeon-corridor', name: 'Dungeon Corridor' },
    { id: 'forest-clearing', name: 'Forest Clearing' },
    { id: 'ruined-castle', name: 'Ruined Castle' },
    { id: 'open-arena', name: 'Open Arena' },
  ];

  res.json({ success: true, data: { arenas } });
});

/**
 * POST /api/tactical/arenas/generate - Generate arena from world coordinates
 */
router.post('/arenas/generate', authenticate, async (req: AuthRequest, res: Response) => {
  const { worldSeed, worldX, worldY, name } = GenerateArenaSchema.parse(req.body);

  const arena = await generateArenaFromWorld(worldSeed, worldX, worldY, name);

  res.json({
    success: true,
    data: { arena },
  });
});

// ============================================================================
// POST /api/tactical/encounter - Create new encounter
// ============================================================================

router.post('/encounter', authenticate, async (req: AuthRequest, res: Response) => {
  const { arenaId } = CreateEncounterSchema.parse(req.body);

  // Validate arena exists
  const arena = getArenaById(arenaId);
  if (!arena) {
    throw new ApiError(404, `Arena not found: ${arenaId}`);
  }

  // Create encounter
  const encounterId = `enc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();

  const encounter: TacticalEncounter = {
    id: encounterId,
    arenaId,
    createdAt: now,
    updatedAt: now,
    units: [],
    round: 0,
    turnOrder: [],
    activeUnitId: null,
    phase: 'setup',
    isCombatOver: false,
    log: [],
    diceRollerSeed: Math.floor(Math.random() * 1000000),
  };

  encountersStore.set(encounterId, encounter);

  addLogEntry(encounter, {
    type: 'system',
    message: `Tactical encounter created in ${arena.name}`,
  });

  res.json({
    success: true,
    data: {
      encounterId,
      arena: {
        id: arena.id,
        name: arena.name,
        description: arena.description,
        width: arena.width,
        height: arena.height,
        theme: arena.theme,
      },
    },
  });
});

// ============================================================================
// GET /api/tactical/encounter/:id - Get encounter state
// ============================================================================

router.get('/encounter/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const id = getEncounterIdParam(req);

  const encounter = encountersStore.get(id);
  if (!encounter) {
    throw new ApiError(404, `Encounter not found: ${id}`);
  }

  const arena = getArenaById(encounter.arenaId);
  if (!arena) {
    throw new ApiError(500, `Arena not found: ${encounter.arenaId}`);
  }

  res.json({
    success: true,
    data: {
      encounter,
      arena,
    },
  });
});

// ============================================================================
// POST /api/tactical/encounter/:id/units - Add unit to encounter
// ============================================================================

router.post('/encounter/:id/units', authenticate, async (req: AuthRequest, res: Response) => {
  const id = getEncounterIdParam(req);
  const unitData = AddUnitSchema.parse(req.body);

  const encounter = encountersStore.get(id);
  if (!encounter) {
    throw new ApiError(404, `Encounter not found: ${id}`);
  }

  if (encounter.phase !== 'setup') {
    throw new ApiError(400, 'Cannot add units after combat has started');
  }

  // Validate position is valid
  const gridManager = createGridManager(encounter.arenaId);
  if (!gridManager.isValidMovement(unitData.position)) {
    throw new ApiError(400, 'Invalid position: blocked or out of bounds');
  }

  // Check position not occupied
  const occupied = encounter.units.some(
    (u) => u.position.x === unitData.position.x && u.position.y === unitData.position.y
  );
  if (occupied) {
    throw new ApiError(400, 'Position already occupied');
  }

  // Create unit
  const unitId = `unit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const unit = createTacticalUnit({
    id: unitId,
    ...unitData,
  });

  encounter.units.push(unit);
  encounter.updatedAt = Date.now();

  addLogEntry(encounter, {
    type: 'system',
    actorId: unit.id,
    actorName: unit.name,
    message: `${unit.name} joined the encounter at (${unit.position.x}, ${unit.position.y})`,
  });

  res.json({
    success: true,
    data: { unit },
  });
});

// ============================================================================
// PATCH /api/tactical/encounter/:id/units/:unitId - Update unit position
// ============================================================================

router.patch('/encounter/:id/units/:unitId', authenticate, async (req: AuthRequest, res: Response) => {
  const id = getEncounterIdParam(req);
  const { unitId } = req.params;
  if (!unitId) {
    throw new ApiError(400, 'Unit ID required');
  }

  const { position } = UpdateUnitPositionSchema.parse(req.body);

  const encounter = encountersStore.get(id);
  if (!encounter) {
    throw new ApiError(404, `Encounter not found: ${id}`);
  }

  if (encounter.phase !== 'setup') {
    throw new ApiError(400, 'Cannot move units in setup phase - use command system during combat');
  }

  const unit = encounter.units.find((u) => u.id === unitId);
  if (!unit) {
    throw new ApiError(404, `Unit not found: ${unitId}`);
  }

  // Validate position
  const gridManager = createGridManager(encounter.arenaId);
  if (!gridManager.isValidMovement(position)) {
    throw new ApiError(400, 'Invalid position: blocked or out of bounds');
  }

  // Check position not occupied
  const occupied = encounter.units.some(
    (u) => u.id !== unitId && u.position.x === position.x && u.position.y === position.y
  );
  if (occupied) {
    throw new ApiError(400, 'Position already occupied');
  }

  const oldPos = { ...unit.position };
  unit.position = position;
  encounter.updatedAt = Date.now();

  addLogEntry(encounter, {
    type: 'system',
    actorId: unit.id,
    actorName: unit.name,
    message: `${unit.name} moved from (${oldPos.x}, ${oldPos.y}) to (${position.x}, ${position.y})`,
  });

  res.json({
    success: true,
    data: { unit },
  });
});

// ============================================================================
// DELETE /api/tactical/encounter/:id/units/:unitId - Remove unit
// ============================================================================

router.delete('/encounter/:id/units/:unitId', authenticate, async (req: AuthRequest, res: Response) => {
  const id = getEncounterIdParam(req);
  const { unitId } = req.params;
  if (!unitId) {
    throw new ApiError(400, 'Unit ID required');
  }

  const encounter = encountersStore.get(id);
  if (!encounter) {
    throw new ApiError(404, `Encounter not found: ${id}`);
  }

  if (encounter.phase !== 'setup') {
    throw new ApiError(400, 'Cannot remove units after combat has started');
  }

  const unitIndex = encounter.units.findIndex((u) => u.id === unitId);
  if (unitIndex === -1) {
    throw new ApiError(404, `Unit not found: ${unitId}`);
  }

  // Get unit before removing it
  const removedUnit = encounter.units[unitIndex];
  if (!removedUnit) {
    throw new ApiError(500, 'Unit data corrupted');
  }

  encounter.units.splice(unitIndex, 1);
  encounter.updatedAt = Date.now();

  addLogEntry(encounter, {
    type: 'system',
    actorId: removedUnit.id,
    actorName: removedUnit.name,
    message: `${removedUnit.name} was removed from the encounter`,
  });

  res.json({
    success: true,
    data: { removedUnit },
  });
});

// ============================================================================
// POST /api/tactical/encounter/:id/start - Roll initiative and start combat
// ============================================================================

router.post('/encounter/:id/start', authenticate, async (req: AuthRequest, res: Response) => {
  const id = getEncounterIdParam(req);

  const encounter = encountersStore.get(id);
  if (!encounter) {
    throw new ApiError(404, `Encounter not found: ${id}`);
  }

  if (encounter.phase !== 'setup') {
    throw new ApiError(400, 'Combat already started or complete');
  }

  if (encounter.units.length === 0) {
    throw new ApiError(400, 'Cannot start combat with no units');
  }

  // Roll initiative for all units
  const diceRoller = new DiceRoller({ seed: encounter.diceRollerSeed });
  const initiativeRolls: Array<{ unitId: string; unit: TacticalUnit; initiative: number }> = [];

  for (const unit of encounter.units) {
    const modifier = getAbilityModifier(unit.dexterity);
    const roll = diceRoller.rollInitiative(modifier, `${unit.name} initiative`);
    const initiative = roll.finalResult;
    unit.initiative = initiative;

    initiativeRolls.push({ unitId: unit.id, unit, initiative });

    addLogEntry(encounter, {
      type: 'initiative',
      actorId: unit.id,
      actorName: unit.name,
      message: `${unit.name} rolled initiative: ${roll.rawRolls[0]} + ${modifier} = ${initiative}`,
      details: { roll: roll.rawRolls[0], modifier, total: initiative },
    });
  }

  // Sort by initiative (highest first), ties broken by dexterity
  initiativeRolls.sort((a, b) => {
    if (b.initiative !== a.initiative) {
      return b.initiative - a.initiative;
    }
    return b.unit.dexterity - a.unit.dexterity;
  });

  encounter.turnOrder = initiativeRolls.map((r) => r.unitId);
  encounter.activeUnitId = encounter.turnOrder[0] ?? null;
  encounter.round = 1;
  encounter.phase = 'in_progress';
  encounter.updatedAt = Date.now();

  // Reset turn resources for first unit
  const firstUnit = encounter.units.find((u) => u.id === encounter.activeUnitId);
  if (firstUnit) {
    resetTurnResources(firstUnit);
  }

  addLogEntry(encounter, {
    type: 'turn',
    actorId: encounter.activeUnitId ?? undefined,
    actorName: firstUnit?.name,
    message: `Round ${encounter.round} begins! ${firstUnit?.name}'s turn.`,
  });

  res.json({
    success: true,
    data: {
      encounter,
      initiativeOrder: initiativeRolls.map((r) => ({
        unitId: r.unitId,
        name: r.unit.name,
        initiative: r.initiative,
      })),
    },
  });
});

// ============================================================================
// GET /api/tactical/arenas - List available arenas
// ============================================================================

router.get('/arenas', authenticate, async (_req: AuthRequest, res: Response) => {
  const { getArenaSummaries } = await import('@/tactical/arenas/generator');
  const arenas = getArenaSummaries();

  res.json({
    success: true,
    data: { arenas },
  });
});

export default router;
