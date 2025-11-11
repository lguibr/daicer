/**
 * D&D 5e movement rules
 * Handles grid movement, reach calculations, difficult terrain, and position validation
 */

import type { CombatCharacter } from '@/graph/state';
import { hasCondition, canMove } from '../state';

export interface Position {
  x: number;
  y: number;
}

export interface MovementContext {
  character: CombatCharacter;
  fromPosition: Position;
  toPosition: Position;
  characters: CombatCharacter[];
  gridWidth: number;
  gridHeight: number;
  difficultTerrainSquares?: Position[];
}

export interface MovementValidationResult {
  isValid: boolean;
  reason?: string;
  movementCost: number;
  path?: Position[];
}

/**
 * Calculate Chebyshev distance (grid distance allowing diagonals)
 */
export function calculateDistance(pos1: Position, pos2: Position): number {
  return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
}

/**
 * Calculate Euclidean distance (straight-line)
 */
export function calculateEuclideanDistance(pos1: Position, pos2: Position): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if position is within grid bounds
 */
export function isValidPosition(pos: Position, gridWidth: number, gridHeight: number): boolean {
  return pos.x >= 0 && pos.x < gridWidth && pos.y >= 0 && pos.y < gridHeight;
}

/**
 * Check if position is occupied by any character
 */
export function isPositionOccupied(pos: Position, characters: CombatCharacter[], excludeCharacterId?: string): boolean {
  return characters.some(
    (c) => c.hp > 0 && c.id !== excludeCharacterId && c.position.x === pos.x && c.position.y === pos.y
  );
}

/**
 * Get character at position
 */
export function getCharacterAtPosition(pos: Position, characters: CombatCharacter[]): CombatCharacter | undefined {
  return characters.find((c) => c.hp > 0 && c.position.x === pos.x && c.position.y === pos.y);
}

/**
 * Check if position is difficult terrain
 */
export function isDifficultTerrain(pos: Position, difficultTerrainSquares: Position[] = []): boolean {
  return difficultTerrainSquares.some((dt) => dt.x === pos.x && dt.y === pos.y);
}

/**
 * Calculate movement cost for a character
 */
export function calculateMovementSpeed(character: CombatCharacter): number {
  let { speed } = character;

  // Exhaustion level 2: speed halved
  const exhaustionLevel = character.conditions.find((c) => c.type === 'exhaustion')?.level ?? 0;
  if (exhaustionLevel >= 2) {
    speed = Math.floor(speed / 2);
  }

  // Grappled or restrained: movement affected
  if (hasCondition(character, 'grappled')) {
    // Grappled: speed becomes 0
    speed = 0;
  }

  // Prone: crawling costs extra movement
  if (hasCondition(character, 'prone')) {
    speed = Math.floor(speed / 2);
  }

  return speed;
}

/**
 * Find all reachable squares from a starting position
 */
export function findReachableSquares(
  startPos: Position,
  movementRemaining: number,
  characters: CombatCharacter[],
  gridWidth: number,
  gridHeight: number,
  characterId?: string,
  difficultTerrainSquares: Position[] = []
): Position[] {
  const reachable: Position[] = [];
  const queue: { pos: Position; cost: number }[] = [{ pos: startPos, cost: 0 }];
  const visited = new Set<string>([`${startPos.x},${startPos.y}`]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    const { pos, cost } = current;

    // Explore all 8 adjacent squares (including diagonals)
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        if (dx === 0 && dy === 0) {
          // eslint-disable-next-line no-continue
          continue;
        }

        const nextPos = { x: pos.x + dx, y: pos.y + dy };
        const posKey = `${nextPos.x},${nextPos.y}`;

        if (visited.has(posKey)) {
          // eslint-disable-next-line no-continue
          continue;
        }
        if (!isValidPosition(nextPos, gridWidth, gridHeight)) {
          // eslint-disable-next-line no-continue
          continue;
        }

        // Calculate movement cost
        let moveCost = 1;

        // Difficult terrain costs extra movement
        if (isDifficultTerrain(nextPos, difficultTerrainSquares)) {
          moveCost = 2; // Costs 1 extra foot per foot
        }

        // Another creature's space is difficult terrain
        if (isPositionOccupied(nextPos, characters, characterId)) {
          moveCost = 2;
        }

        const nextCost = cost + moveCost;

        if (nextCost <= movementRemaining) {
          visited.add(posKey);

          // Can't end movement on an occupied square
          if (!isPositionOccupied(nextPos, characters, characterId)) {
            reachable.push(nextPos);
            queue.push({ pos: nextPos, cost: nextCost });
          }
        }
      }
    }
  }

  return reachable;
}

/**
 * Validate a movement attempt
 */
export function validateMovement(context: MovementContext): MovementValidationResult {
  const {
    character,
    fromPosition,
    toPosition,
    characters,
    gridWidth,
    gridHeight,
    difficultTerrainSquares = [],
  } = context;

  // Check if character can move
  if (!canMove(character)) {
    return {
      isValid: false,
      reason: 'Character cannot move (incapacitated, grappled, or no movement remaining)',
      movementCost: 0,
    };
  }

  // Check if target position is valid
  if (!isValidPosition(toPosition, gridWidth, gridHeight)) {
    return {
      isValid: false,
      reason: 'Target position is outside grid bounds',
      movementCost: 0,
    };
  }

  // Check if target position is occupied
  if (isPositionOccupied(toPosition, characters, character.id)) {
    return {
      isValid: false,
      reason: 'Target position is occupied',
      movementCost: 0,
    };
  }

  // Calculate movement cost
  const distance = calculateDistance(fromPosition, toPosition);
  let movementCost = distance;

  // Apply difficult terrain multiplier
  if (isDifficultTerrain(toPosition, difficultTerrainSquares)) {
    movementCost *= 2;
  }

  // Check if character has enough movement
  if (movementCost > character.movementRemaining) {
    return {
      isValid: false,
      reason: `Insufficient movement (need ${movementCost}, have ${character.movementRemaining})`,
      movementCost,
    };
  }

  return {
    isValid: true,
    movementCost,
  };
}

/**
 * Check if attacker is within reach of defender
 */
export function isWithinReach(attackerPos: Position, defenderPos: Position, reach: number = 1): boolean {
  return calculateDistance(attackerPos, defenderPos) <= reach;
}

/**
 * Get all adjacent positions (for reach = 1)
 */
export function getAdjacentPositions(pos: Position, gridWidth: number, gridHeight: number): Position[] {
  const adjacent: Position[] = [];

  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      if (dx === 0 && dy === 0) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const adjPos = { x: pos.x + dx, y: pos.y + dy };
      if (isValidPosition(adjPos, gridWidth, gridHeight)) {
        adjacent.push(adjPos);
      }
    }
  }

  return adjacent;
}

/**
 * Get all positions within reach
 */
export function getPositionsWithinReach(
  pos: Position,
  reach: number,
  gridWidth: number,
  gridHeight: number
): Position[] {
  const positions: Position[] = [];

  for (let x = 0; x < gridWidth; x += 1) {
    for (let y = 0; y < gridHeight; y += 1) {
      const testPos = { x, y };
      if (calculateDistance(pos, testPos) <= reach && !(pos.x === x && pos.y === y)) {
        positions.push(testPos);
      }
    }
  }

  return positions;
}

/**
 * Check if movement provokes opportunity attacks
 */
export function checksOpportunityAttacks(
  fromPos: Position,
  toPos: Position,
  movingCharacter: CombatCharacter,
  allCharacters: CombatCharacter[]
): Array<{ attacker: CombatCharacter; trigger: string }> {
  const opportunityAttackers: Array<{ attacker: CombatCharacter; trigger: string }> = [];

  // Find hostile characters that can make opportunity attacks
  const hostileCharacters = allCharacters.filter(
    (c) => c.hp > 0 && c.id !== movingCharacter.id && c.isPlayer !== movingCharacter.isPlayer && c.hasReaction
  );

  for (const hostile of hostileCharacters) {
    const wasInReach = isWithinReach(fromPos, hostile.position, hostile.reach);
    const isInReach = isWithinReach(toPos, hostile.position, hostile.reach);

    // Opportunity attack triggered when leaving reach
    if (wasInReach && !isInReach) {
      opportunityAttackers.push({
        attacker: hostile,
        trigger: `${movingCharacter.name} left ${hostile.name}'s reach`,
      });
    }
  }

  return opportunityAttackers;
}
