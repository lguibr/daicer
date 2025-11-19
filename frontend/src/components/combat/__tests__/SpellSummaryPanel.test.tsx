import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SpellSummaryPanel } from '../SpellSummaryPanel';
import type { SpellData, SpellPreviewSnapshot, SpellResolutionSnapshot } from '../../../types/spells';
import { SpellEffectShape } from '../../../types/spells';
import type { CombatCharacter, DiceRollResult } from '../../../types/combat';
import type { CombatDemoSpellScript } from 'daicer/backend/src/shared/spellLoadouts';

const mockSpell: SpellData = {
  id: 'fireball',
  name: 'Fireball',
  level: 3,
  school: 'evocation',
  imageUrl: null,
  castingTime: '1 action',
  range: '150 feet',
  components: {
    verbal: true,
    somatic: true,
    material: 'a tiny ball of bat guano and sulfur',
  },
  duration: 'Instantaneous',
  description: 'A bright streak flashes from your pointing finger to a point you choose.',
  isRitual: false,
  effectShape: SpellEffectShape.SPHERE,
  effectDimensions: { radius: 4 },
  higherLevels: 'The damage increases by 1d6 for each slot level above 3rd.',
};

const mockPreview: SpellPreviewSnapshot = {
  spellId: 'fireball',
  spellName: 'Fireball',
  casterId: 'player-wizard',
  spellLevel: 3,
  school: 'evocation',
  effectShape: SpellEffectShape.SPHERE,
  range: '150 feet',
  casterPosition: { x: 3, y: 6 },
  targetPosition: { x: 7, y: 5 },
  affectedSquares: [
    { x: 6, y: 5 },
    { x: 7, y: 5 },
    { x: 7, y: 6 },
    { x: 8, y: 5 },
  ],
  validTargets: [],
  friendlyFireRisk: true,
  requiresLineOfSight: true,
  lineOfSightBlocked: false,
  obstacles: [],
};

const mockDiceRoll = (id: string, description: string, finalResult: number): DiceRollResult => ({
  id,
  timestamp: Date.now(),
  rollType: 'damage',
  diceType: 'd6',
  numberOfDice: 8,
  rawRolls: [5, 5, 6, 4, 2, 6, 3, 1],
  modifier: 3,
  advantageType: 'normal',
  finalResult,
  description,
});

const mockResolution: SpellResolutionSnapshot = {
  spellId: 'fireball',
  casterId: 'player-wizard',
  affectedCharacterIds: ['enemy-goblin-1', 'enemy-goblin-2'],
  summary: 'Fireball detonates amid the goblins.',
  damageRolls: [mockDiceRoll('damage-1', 'Fireball damage', 28)],
  savingThrows: [
    {
      id: 'save-1',
      timestamp: Date.now(),
      rollType: 'save',
      diceType: 'd20',
      numberOfDice: 1,
      rawRolls: [12],
      modifier: 2,
      advantageType: 'normal',
      finalResult: 14,
      description: 'Goblin 1 Dexterity save',
    },
  ],
  attackRolls: [],
  friendlyFireOccurred: false,
};

const mockCaster: CombatCharacter = {
  id: 'player-wizard',
  name: 'Lyra the Bright',
  hp: 22,
  maxHp: 22,
  tempHp: 0,
  armorClass: 14,
  position: { x: 3, y: 6 },
  initiative: 15,
  avatar: 'player-wizard',
  isPlayer: true,
  strength: 8,
  dexterity: 14,
  constitution: 12,
  intelligence: 18,
  wisdom: 14,
  charisma: 12,
  proficiencyBonus: 3,
  speed: 6,
  reach: 1,
  hasMoved: false,
  hasActed: true,
  hasReaction: true,
  hasBonusAction: true,
  movementRemaining: 6,
  conditions: [],
};

const mockTargets: CombatCharacter[] = [
  {
    id: 'enemy-goblin-1',
    name: 'Goblin Skirmisher',
    hp: 4,
    maxHp: 22,
    tempHp: 0,
    armorClass: 15,
    position: { x: 7, y: 5 },
    initiative: 12,
    avatar: 'enemy-goblin-1',
    isPlayer: false,
    strength: 8,
    dexterity: 14,
    constitution: 10,
    intelligence: 10,
    wisdom: 8,
    charisma: 8,
    proficiencyBonus: 2,
    speed: 6,
    reach: 1,
    hasMoved: true,
    hasActed: true,
    hasReaction: false,
    hasBonusAction: false,
    movementRemaining: 0,
    conditions: [],
  },
  {
    id: 'enemy-goblin-2',
    name: 'Goblin Sneak',
    hp: 0,
    maxHp: 18,
    tempHp: 0,
    armorClass: 15,
    position: { x: 8, y: 5 },
    initiative: 10,
    avatar: 'enemy-goblin-2',
    isPlayer: false,
    strength: 8,
    dexterity: 14,
    constitution: 10,
    intelligence: 10,
    wisdom: 8,
    charisma: 8,
    proficiencyBonus: 2,
    speed: 6,
    reach: 1,
    hasMoved: false,
    hasActed: false,
    hasReaction: false,
    hasBonusAction: false,
    movementRemaining: 0,
    conditions: [],
  },
];

const mockScript: CombatDemoSpellScript = {
  spellId: 'fireball',
  casterId: 'player-wizard',
  description: 'Lyra hurls a Fireball toward the clustered goblins.',
  target: { type: 'point', x: 7, y: 5 },
};

describe('SpellSummaryPanel', () => {
  it('renders spell details, preview info, resolution, and loadout entries', () => {
    render(
      <SpellSummaryPanel
        spell={mockSpell}
        preview={mockPreview}
        resolution={mockResolution}
        caster={mockCaster}
        affectedCharacters={mockTargets}
        loadout={[{ script: mockScript, spell: mockSpell }]}
        activeSpellId="fireball"
      />
    );

    expect(screen.getByText(/Level 3 · evocation · 150 feet/i)).toBeInTheDocument();
    expect(
      screen.getByText((content, element) => element?.textContent === 'Cast by Lyra the Bright')
    ).toBeInTheDocument();
    expect(screen.getByText(/4 squares affected/i)).toBeInTheDocument();
    expect(screen.getByText(/2 targets affected/i)).toBeInTheDocument();
    expect(screen.getByText(/HP 4\/22/i)).toBeInTheDocument();
    expect(screen.getByText(/HP 0\/18/i)).toBeInTheDocument();
    expect(screen.getByText(/Fireball damage/i)).toBeInTheDocument();
    expect(screen.getByText(/Dexterity save/i)).toBeInTheDocument();
    expect(screen.getByText(/Friendly fire risk/i)).toBeInTheDocument();

    const activeChip = screen.getByTitle(/Lyra hurls a Fireball toward the clustered goblins/i);
    expect(activeChip).toHaveClass('border-aurora-400');
  });
});
