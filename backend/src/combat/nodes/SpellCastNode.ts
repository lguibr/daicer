/**
 * @file backend/src/combat/nodes/SpellCastNode.ts
 * @description Spell preview + casting nodes integrated with LangGraph combat state
 */

import type { CombatState } from '@/graph/state';
import { getAbilityModifier } from '../state';
import {
  calculateAffectedSquares,
  canCauseFriendlyFire,
  getValidTargetSquares,
  hasLineOfSight,
  requiresLineOfSight,
  feetToSquares,
} from '../spell-targeting';
import type { EffectDimensions, GridPosition, SpellData } from '../../types/spells';
import { SpellEffectShape } from '../../types/spells';
import { DiceRoller, DiceRollResult } from '../dice';

export interface SpellTargetInput {
  type?: 'point' | 'direction';
  position?: GridPosition;
  direction?: number;
}

export interface SpellPreviewNodeInput {
  casterId: string;
  spell: SpellData;
  target?: SpellTargetInput;
  obstacles?: GridPosition[];
  gridWidth?: number;
  gridHeight?: number;
}

export interface SpellCastNodeInput extends SpellPreviewNodeInput {
  diceRoller: DiceRoller;
}

interface SpellPreviewSnapshot {
  spellId: string;
  spellName: string;
  casterId: string;
  spellLevel: number;
  school?: string;
  effectShape: SpellEffectShape;
  range?: string;
  casterPosition: GridPosition;
  targetPosition: GridPosition;
  affectedSquares: GridPosition[];
  validTargets: GridPosition[];
  friendlyFireRisk: boolean;
  requiresLineOfSight: boolean;
  lineOfSightBlocked: boolean;
  obstacles?: GridPosition[];
}

interface SpellResolutionSnapshot {
  spellId: string;
  casterId: string;
  affectedCharacterIds: string[];
  summary: string;
  damageRolls: DiceRollResult[];
  savingThrows: DiceRollResult[];
  attackRolls: DiceRollResult[];
  friendlyFireOccurred: boolean;
}

const DIRECTION_VECTORS: Record<number, GridPosition> = {
  1: { x: -1, y: 1 }, // down-left
  2: { x: 0, y: 1 }, // down
  3: { x: 1, y: 1 }, // down-right
  4: { x: -1, y: 0 }, // left
  5: { x: 0, y: 0 }, // center
  6: { x: 1, y: 0 }, // right
  7: { x: -1, y: -1 }, // up-left
  8: { x: 0, y: -1 }, // up
  9: { x: 1, y: -1 }, // up-right
};

const ATTACK_SHAPES = new Set<SpellEffectShape>([
  SpellEffectShape.MELEE_TOUCH,
  SpellEffectShape.RANGED_SINGLE,
  SpellEffectShape.PROJECTILE_STRAIGHT,
]);

function clampPosition(position: GridPosition, gridWidth: number, gridHeight: number): GridPosition {
  return {
    x: Math.max(0, Math.min(gridWidth - 1, position.x)),
    y: Math.max(0, Math.min(gridHeight - 1, position.y)),
  };
}

function parseRangeToFeet(range: unknown): number {
  if (!range) return 0;
  if (typeof range === 'object' && range !== null) {
    const { distance } = range as { distance?: number };
    return typeof distance === 'number' ? distance : 0;
  }

  const rangeStr = String(range).toLowerCase();

  if (rangeStr.includes('self')) return 0;
  if (rangeStr.includes('touch')) return 5;

  const match = rangeStr.match(/(\d+)\s*(foot|feet|ft|meter|meters|m)/);
  if (match && match[1]) {
    const value = Number.parseInt(match[1], 10);
    if (Number.isFinite(value)) {
      if (match[2]?.startsWith('m')) {
        return Math.round(value * 3.28084); // convert meters to feet
      }
      return value;
    }
  }

  return 0;
}

function resolveTargetPosition(
  casterPosition: GridPosition,
  input: SpellTargetInput | undefined,
  gridWidth: number,
  gridHeight: number,
  rangeFeet: number
): GridPosition {
  if (!input) {
    return casterPosition;
  }

  if (input.type === 'direction' && input.direction) {
    const vector = DIRECTION_VECTORS[input.direction] ?? { x: 0, y: 0 };
    const squares = Math.max(1, feetToSquares(rangeFeet || 5));
    const target = {
      x: casterPosition.x + vector.x * squares,
      y: casterPosition.y + vector.y * squares,
    };
    return clampPosition(target, gridWidth, gridHeight);
  }

  if (input.position) {
    return clampPosition(input.position, gridWidth, gridHeight);
  }

  return casterPosition;
}

function coerceEffectDimensions(effectDimensions?: EffectDimensions): EffectDimensions {
  return effectDimensions ?? {};
}

function computeDefaultDamageDice(spellLevel: number): string {
  const diceCount = Math.max(1, spellLevel + 1);
  if (spellLevel >= 5) {
    return `${diceCount}d10`;
  }
  if (spellLevel >= 3) {
    return `${diceCount}d8`;
  }
  return `${diceCount}d6`;
}

function buildSpellPreview(
  state: CombatState,
  input: SpellPreviewNodeInput
): { preview: SpellPreviewSnapshot; casterName: string } | null {
  const gridWidth = input.gridWidth ?? state.gridWidth;
  const gridHeight = input.gridHeight ?? state.gridHeight;
  const caster = state.characters.find((c) => c.id === input.casterId);
  if (!caster) {
    return null;
  }

  const rangeFeet = parseRangeToFeet(input.spell.range);
  const targetPosition = resolveTargetPosition(caster.position, input.target, gridWidth, gridHeight, rangeFeet);

  const affectedSquares = calculateAffectedSquares(
    input.spell.effectShape as SpellEffectShape,
    coerceEffectDimensions(input.spell.effectDimensions),
    caster.position,
    targetPosition,
    gridWidth,
    gridHeight
  );

  const validTargets = getValidTargetSquares(
    input.spell.effectShape as SpellEffectShape,
    caster.position,
    rangeFeet,
    gridWidth,
    gridHeight
  );

  const requiresLOS = requiresLineOfSight(input.spell.effectShape as SpellEffectShape);
  const obstacles = input.obstacles ?? [];
  const lineOfSightBlocked = requiresLOS ? !hasLineOfSight(caster.position, targetPosition, obstacles) : false;

  const preview: SpellPreviewSnapshot = {
    spellId: input.spell.id,
    spellName: input.spell.name,
    casterId: caster.id,
    spellLevel: Number(input.spell.level ?? 0),
    school: input.spell.school,
    effectShape: input.spell.effectShape as SpellEffectShape,
    range: typeof input.spell.range === 'string' ? input.spell.range : undefined,
    casterPosition: caster.position,
    targetPosition,
    affectedSquares,
    validTargets,
    friendlyFireRisk: canCauseFriendlyFire(input.spell.effectShape as SpellEffectShape),
    requiresLineOfSight: requiresLOS,
    lineOfSightBlocked,
    obstacles: obstacles.length ? obstacles : undefined,
  };

  return { preview, casterName: caster.name };
}

export function spellPreviewNode(state: CombatState, input: SpellPreviewNodeInput): Partial<CombatState> {
  const previewResult = buildSpellPreview(state, input);
  if (!previewResult) {
    return {
      log: [
        ...state.log,
        {
          id: `log-spell-preview-error-${Date.now()}`,
          timestamp: Date.now(),
          message: `Spell preview failed: caster not found`,
          type: 'info' as const,
          relatedRolls: [],
        },
      ],
    };
  }

  const { preview, casterName } = previewResult;

  const logEntry =
    preview.affectedSquares.length === 0
      ? `${casterName} studies ${preview.spellName}, but no squares are affected with the current target.`
      : `${casterName} previews ${preview.spellName} hitting ${preview.affectedSquares.length} squares.`;

  return {
    spellPreview: preview,
    log: [
      ...state.log,
      {
        id: `log-spell-preview-${Date.now()}`,
        timestamp: Date.now(),
        message: logEntry,
        type: 'info' as const,
        relatedRolls: [],
      },
    ],
  };
}

export function spellCastNode(state: CombatState, input: SpellCastNodeInput): Partial<CombatState> {
  const previewResult = buildSpellPreview(state, input);
  if (!previewResult) {
    return {
      log: [
        ...state.log,
        {
          id: `log-spell-cast-error-${Date.now()}`,
          timestamp: Date.now(),
          message: `Spell cast failed: caster not found`,
          type: 'info' as const,
          relatedRolls: [],
        },
      ],
    };
  }

  const { preview, casterName } = previewResult;
  const caster = state.characters.find((c) => c.id === preview.casterId);
  if (!caster) {
    return {
      log: [
        ...state.log,
        {
          id: `log-spell-cast-error-${Date.now()}`,
          timestamp: Date.now(),
          message: `Spell cast failed: caster not found`,
          type: 'info' as const,
          relatedRolls: [],
        },
      ],
    };
  }

  const affectedCharacters = state.characters.filter((char) =>
    preview.affectedSquares.some((sq) => sq.x === char.position.x && sq.y === char.position.y && char.hp > 0)
  );

  const spellLevel = Number(input.spell.level ?? 0);
  const damageDice = computeDefaultDamageDice(spellLevel);
  const abilityMod = getAbilityModifier(caster.intelligence ?? 10);
  const spellAttackBonus = caster.proficiencyBonus + abilityMod;
  const spellSaveDC = 8 + caster.proficiencyBonus + abilityMod;

  const historyBefore = input.diceRoller.getHistory().length;
  const attackRolls: DiceRollResult[] = [];
  const savingThrows: DiceRollResult[] = [];
  const damageRolls: DiceRollResult[] = [];

  const updatedCharacters = state.characters.map((character) => {
    if (character.id === caster.id) {
      return {
        ...character,
        hasActed: true,
      };
    }

    if (!affectedCharacters.some((affected) => affected.id === character.id)) {
      return character;
    }

    if (ATTACK_SHAPES.has(preview.effectShape)) {
      const attackRoll = input.diceRoller.rollAttack(
        spellAttackBonus,
        'normal',
        `${preview.spellName} spell attack`,
        `spell-${preview.spellId}-${character.id}`
      );
      attackRolls.push(attackRoll);

      if (attackRoll.finalResult < character.armorClass) {
        return character;
      }

      const damageRoll = input.diceRoller.rollDamage(
        damageDice,
        abilityMod,
        `${preview.spellName} damage`,
        `spell-${preview.spellId}-${character.id}`
      );
      damageRolls.push(damageRoll);

      return {
        ...character,
        hp: Math.max(0, character.hp - damageRoll.finalResult),
      };
    }

    // Area spells use saving throws
    const saveAbilityMod = getAbilityModifier(character.dexterity ?? 10);
    const saveRoll = input.diceRoller.rollSavingThrow(
      saveAbilityMod,
      'normal',
      `${character.name} saves vs ${preview.spellName}`
    );
    savingThrows.push(saveRoll);

    const damageRoll = input.diceRoller.rollDamage(
      damageDice,
      abilityMod,
      `${preview.spellName} damage`,
      `spell-${preview.spellId}-${character.id}`
    );
    damageRolls.push(damageRoll);

    const succeeded = saveRoll.finalResult >= spellSaveDC;
    const damageTaken = succeeded ? Math.floor(damageRoll.finalResult / 2) : damageRoll.finalResult;

    return {
      ...character,
      hp: Math.max(0, character.hp - damageTaken),
    };
  });

  const aliveCharacters = updatedCharacters.filter((c) => c.hp > 0);
  const isPlayerTeamAlive = aliveCharacters.some((c) => c.isPlayer);
  const isEnemyTeamAlive = aliveCharacters.some((c) => !c.isPlayer);
  const isCombatOver = !isPlayerTeamAlive || !isEnemyTeamAlive;
  let winner: 'player' | 'enemy' | null = null;
  if (isCombatOver) {
    winner = isPlayerTeamAlive ? 'player' : 'enemy';
  }

  const historyAfter = input.diceRoller.getHistory();
  const newDiceHistory = historyAfter.slice(historyBefore);
  const diceHistory = newDiceHistory.length > 0 ? [...state.diceHistory, ...newDiceHistory] : [...state.diceHistory];

  const friendlyFireOccurred = affectedCharacters.some(
    (character) => character.isPlayer === caster.isPlayer && character.id !== caster.id
  );

  const resolution: SpellResolutionSnapshot = {
    spellId: preview.spellId,
    casterId: preview.casterId,
    affectedCharacterIds: affectedCharacters.map((c) => c.id),
    summary: `${casterName} casts ${preview.spellName}, affecting ${affectedCharacters.length} creatures.`,
    damageRolls,
    savingThrows,
    attackRolls,
    friendlyFireOccurred,
  };

  const logs = [
    ...state.log,
    {
      id: `log-spell-cast-${Date.now()}`,
      timestamp: Date.now(),
      message: resolution.summary,
      type: 'attack' as const,
      relatedRolls: [...attackRolls, ...savingThrows, ...damageRolls].map((roll) => roll.id),
    },
  ];

  if (friendlyFireOccurred) {
    logs.push({
      id: `log-spell-friendly-${Date.now()}`,
      timestamp: Date.now(),
      message: `⚠️ Friendly fire risk realized! Allies were caught in the effect.`,
      type: 'info' as const,
      relatedRolls: [],
    });
  }

  if (isCombatOver && winner) {
    logs.push({
      id: `log-spell-victory-${Date.now()}`,
      timestamp: Date.now(),
      message: `🏆 The ${winner} team prevails after spell impact!`,
      type: 'victory' as const,
      relatedRolls: [],
    });
  }

  return {
    characters: updatedCharacters,
    log: logs,
    diceHistory,
    spellPreview: null,
    lastSpellResolution: resolution,
    isCombatOver,
    winner,
    phase: isCombatOver ? 'combat_end' : 'action_selection',
  };
}
