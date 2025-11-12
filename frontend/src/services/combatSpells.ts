import { apiRequest } from './api';
import type { CombatCharacter, CombatState } from '../types/combat';
import type { GridPosition, SpellPreviewSnapshot, SpellResolutionSnapshot } from '../types/spells';

export type SpellDirectionInput = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface SpellTargetInput {
  type?: 'point' | 'direction';
  x?: number;
  y?: number;
  direction?: SpellDirectionInput;
}

export type SpellScenarioCharacter = Pick<
  CombatCharacter,
  'id' | 'name' | 'hp' | 'armorClass' | 'isPlayer' | 'position'
> &
  Partial<Omit<CombatCharacter, 'id' | 'name' | 'hp' | 'armorClass' | 'isPlayer' | 'position'>>;

export interface SpellScenarioRequest {
  spellId: string;
  casterId: string;
  characters: SpellScenarioCharacter[];
  grid?: {
    width?: number;
    height?: number;
  };
  target?: SpellTargetInput;
  obstacles?: GridPosition[];
  seed?: number;
  confirmFriendlyFire?: boolean;
}

export interface SpellPreviewResponse {
  combatState: CombatState;
  preview: SpellPreviewSnapshot | null;
}

export interface SpellCastResponse {
  combatState: CombatState;
  preview: SpellPreviewSnapshot | null;
  resolution: SpellResolutionSnapshot | null;
  blocked: boolean;
}

function mapCharacterPayload(character: SpellScenarioCharacter) {
  return {
    id: character.id,
    name: character.name,
    hp: character.hp,
    maxHp: character.maxHp ?? character.hp,
    tempHp: character.tempHp ?? 0,
    armorClass: character.armorClass,
    position: character.position,
    initiative: character.initiative ?? 0,
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
  };
}

function mapTargetPayload(target?: SpellTargetInput) {
  if (!target) return undefined;

  if (target.type === 'direction' || typeof target.direction === 'number') {
    return {
      type: 'direction',
      direction: target.direction ?? 6,
    };
  }

  if (typeof target.x === 'number' && typeof target.y === 'number') {
    return {
      type: 'point',
      x: target.x,
      y: target.y,
    };
  }

  return undefined;
}

export async function previewSpellScenario(request: SpellScenarioRequest): Promise<SpellPreviewResponse> {
  const payload = {
    spellId: request.spellId,
    casterId: request.casterId,
    characters: request.characters.map(mapCharacterPayload),
    grid: request.grid,
    target: mapTargetPayload(request.target),
    obstacles: request.obstacles,
    seed: request.seed,
  };

  return apiRequest<SpellPreviewResponse>('/api/combat/spell/preview', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function castSpellScenario(request: SpellScenarioRequest): Promise<SpellCastResponse> {
  const payload = {
    spellId: request.spellId,
    casterId: request.casterId,
    characters: request.characters.map(mapCharacterPayload),
    grid: request.grid,
    target: mapTargetPayload(request.target),
    obstacles: request.obstacles,
    seed: request.seed,
    confirmFriendlyFire: request.confirmFriendlyFire ?? false,
  };

  return apiRequest<SpellCastResponse>('/api/combat/spell/cast', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
