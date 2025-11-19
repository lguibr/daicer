import { describe, it, expect } from '@jest/globals';
import type { CombatState, CombatCharacter } from '@/graph/state';
import { spellPreviewNode, spellCastNode } from '../SpellCastNode';
import { DiceRoller } from '../../dice';
import { SpellEffectShape, TargetingType, AttackType, type SpellData } from '../../../types/spells';
import { createCombatSession } from '../../graph';

function buildCharacter(partial: Partial<CombatCharacter> & Pick<CombatCharacter, 'id' | 'name'>): CombatCharacter {
  return {
    id: partial.id,
    name: partial.name,
    hp: partial.hp ?? 20,
    maxHp: partial.maxHp ?? 20,
    tempHp: partial.tempHp ?? 0,
    armorClass: partial.armorClass ?? 12,
    position: partial.position ?? { x: 5, y: 5 },
    initiative: partial.initiative ?? 0,
    avatar: partial.avatar ?? '',
    isPlayer: partial.isPlayer ?? true,
    strength: partial.strength ?? 10,
    dexterity: partial.dexterity ?? 10,
    constitution: partial.constitution ?? 10,
    intelligence: partial.intelligence ?? 10,
    wisdom: partial.wisdom ?? 10,
    charisma: partial.charisma ?? 10,
    proficiencyBonus: partial.proficiencyBonus ?? 2,
    speed: partial.speed ?? 6,
    reach: partial.reach ?? 1,
    hasMoved: partial.hasMoved ?? false,
    hasActed: partial.hasActed ?? false,
    hasReaction: partial.hasReaction ?? true,
    hasBonusAction: partial.hasBonusAction ?? true,
    movementRemaining: partial.movementRemaining ?? 6,
    conditions: partial.conditions ?? [],
    deathSaves: partial.deathSaves,
  };
}

function buildBaseState(): CombatState {
  const caster = buildCharacter({
    id: 'caster',
    name: 'Arcanist',
    intelligence: 18,
    proficiencyBonus: 3,
    position: { x: 5, y: 5 },
  });

  const ally = buildCharacter({
    id: 'ally',
    name: 'Shieldbearer',
    position: { x: 6, y: 5 },
  });

  const enemy = buildCharacter({
    id: 'enemy',
    name: 'Ogre',
    isPlayer: false,
    hp: 30,
    maxHp: 30,
    position: { x: 8, y: 8 },
    armorClass: 13,
  });

  return {
    sessionId: 'session-spell',
    characters: [caster, ally, enemy],
    activeCharacterId: 'caster',
    turnOrder: ['caster', 'enemy', 'ally'],
    round: 1,
    isCombatOver: false,
    winner: null,
    log: [],
    diceHistory: [],
    gridWidth: 20,
    gridHeight: 20,
    phase: 'action_selection',
    pendingOpportunityAttacks: [],
    diceRollerSeed: 42,
    spellPreview: null,
    lastSpellResolution: null,
  };
}

const fireballSpell: SpellData = {
  id: 'fireball',
  name: 'Fireball',
  level: 3,
  school: 'evocation',
  castingTime: '1 action',
  isRitual: false,
  range: { type: 'feet', distance: 150 },
  targeting: TargetingType.POINT,
  effectShape: SpellEffectShape.SPHERE,
  effectDimensions: { radius: 20 },
  attackType: AttackType.SAVING_THROW,
  components: {
    verbal: true,
    somatic: true,
    material: 'a tiny ball of bat guano and sulfur',
  },
  duration: {
    type: 'instantaneous',
    concentration: false,
  },
  description: 'A bright streak flashes from your pointing finger to a point you choose within range.',
  classes: ['wizard'],
};

describe('SpellCastNode', () => {
  it('creates a spell preview with affected squares', () => {
    const baseState = buildBaseState();

    const previewResult = spellPreviewNode(baseState, {
      casterId: 'caster',
      spell: fireballSpell,
      target: {
        type: 'point',
        position: { x: 8, y: 8 },
      },
    });

    const mergedState: CombatState = {
      ...baseState,
      ...previewResult,
      log: previewResult.log ?? baseState.log,
      spellPreview: previewResult.spellPreview ?? null,
    };

    expect(mergedState.spellPreview).toBeTruthy();
    expect(mergedState.spellPreview?.affectedSquares.length).toBeGreaterThan(0);
    expect(mergedState.spellPreview?.friendlyFireRisk).toBe(true);
  });

  it('casts a spell, updating characters, log, and dice history', () => {
    const baseState = buildBaseState();
    const previewResult = spellPreviewNode(baseState, {
      casterId: 'caster',
      spell: fireballSpell,
      target: {
        type: 'point',
        position: { x: 8, y: 8 },
      },
    });

    const stateAfterPreview: CombatState = {
      ...baseState,
      ...previewResult,
      log: previewResult.log ?? baseState.log,
      spellPreview: previewResult.spellPreview ?? null,
    };

    const roller = new DiceRoller({ seed: 99, enableHistory: true });

    const castResult = spellCastNode(stateAfterPreview, {
      casterId: 'caster',
      spell: fireballSpell,
      target: {
        type: 'point',
        position: { x: 8, y: 8 },
      },
      diceRoller: roller,
    });

    const enemyAfter = castResult.characters?.find((c) => c.id === 'enemy');
    expect(enemyAfter).toBeTruthy();
    expect(enemyAfter?.hp).toBeLessThan(30);

    const casterAfter = castResult.characters?.find((c) => c.id === 'caster');
    expect(casterAfter?.hasActed).toBe(true);

    expect(castResult.diceHistory?.length).toBeGreaterThan(0);
    expect(castResult.lastSpellResolution).toBeTruthy();
    expect(castResult.spellPreview).toBeNull();
    expect(castResult.log?.some((entry) => entry.message.includes('casts Fireball'))).toBe(true);
  });
});

describe('CombatSession spell integration', () => {
  it('records history snapshots for preview and cast actions', async () => {
    const session = createCombatSession('session-history', 321);

    const caster = buildCharacter({
      id: 'caster',
      name: 'Chronomancer',
      intelligence: 18,
      proficiencyBonus: 3,
      position: { x: 4, y: 4 },
    });
    const foe = buildCharacter({
      id: 'foe',
      name: 'Bandit',
      isPlayer: false,
      hp: 18,
      maxHp: 18,
      armorClass: 12,
      position: { x: 8, y: 8 },
    });

    await session.startCombat([caster, foe]);

    const historyStartLen = session.getHistory().length;
    expect(historyStartLen).toBeGreaterThan(0);

    const stateAfterPreview = await session.previewSpell({
      casterId: 'caster',
      spell: fireballSpell,
      target: {
        type: 'point',
        position: { x: 8, y: 8 },
      },
    });

    expect(stateAfterPreview.spellPreview).toBeTruthy();
    const historyAfterPreview = session.getHistory();
    expect(historyAfterPreview.length).toBeGreaterThan(historyStartLen);
    const previewHistoryLength = historyAfterPreview.length;

    const stateAfterCast = await session.castSpell({
      casterId: 'caster',
      spell: fireballSpell,
      target: {
        type: 'point',
        position: { x: 8, y: 8 },
      },
    });

    expect(stateAfterCast.lastSpellResolution).toBeTruthy();
    expect(stateAfterCast.spellPreview).toBeNull();
    expect(stateAfterCast.log.length).toBeGreaterThan(0);
    expect(session.getHistory().length).toBeGreaterThan(previewHistoryLength);
  });
});
