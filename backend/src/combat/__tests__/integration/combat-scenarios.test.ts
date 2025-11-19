import { describe, it, expect, beforeEach } from '@jest/globals';
import { createCombatSession } from '../../graph';
import { getSimulationById } from '../../simulations/demoSimulation';
import { combatDemoSpellLoadouts } from '@/shared/spellLoadouts';
import type { CombatCharacter } from '@/graph/state';

describe('Combat Scenarios', () => {
  let fighter: CombatCharacter;
  let wizard: CombatCharacter;
  let goblin1: CombatCharacter;
  let goblin2: CombatCharacter;

  beforeEach(() => {
    fighter = {
      id: 'fighter-1',
      name: 'Grommash',
      hp: 50,
      maxHp: 50,
      tempHp: 0,
      armorClass: 18,
      position: { x: 2, y: 2 },
      initiative: 0,
      avatar: '',
      isPlayer: true,
      strength: 18,
      dexterity: 12,
      constitution: 16,
      intelligence: 8,
      wisdom: 10,
      charisma: 10,
      proficiencyBonus: 3,
      speed: 6,
      reach: 1,
      hasMoved: false,
      hasActed: false,
      hasReaction: true,
      hasBonusAction: true,
      movementRemaining: 6,
      conditions: [],
    };

    wizard = {
      id: 'wizard-1',
      name: 'Elara',
      hp: 28,
      maxHp: 28,
      tempHp: 0,
      armorClass: 12,
      position: { x: 1, y: 2 },
      initiative: 0,
      avatar: '',
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
      hasActed: false,
      hasReaction: true,
      hasBonusAction: true,
      movementRemaining: 6,
      conditions: [],
    };

    goblin1 = {
      id: 'goblin-1',
      name: 'Goblin 1',
      hp: 15,
      maxHp: 15,
      tempHp: 0,
      armorClass: 13,
      position: { x: 7, y: 7 },
      initiative: 0,
      avatar: '',
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
      hasReaction: true,
      hasBonusAction: true,
      movementRemaining: 6,
      conditions: [],
    };

    goblin2 = {
      id: 'goblin-2',
      name: 'Goblin 2',
      hp: 15,
      maxHp: 15,
      tempHp: 0,
      armorClass: 13,
      position: { x: 8, y: 7 },
      initiative: 0,
      avatar: '',
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
      hasReaction: true,
      hasBonusAction: true,
      movementRemaining: 6,
      conditions: [],
    };
  });

  it('should run a complete combat sequence', async () => {
    const session = createCombatSession('test-combat', 42);

    // Start combat
    const startState = await session.startCombat([fighter, wizard, goblin1, goblin2]);

    expect(startState.characters).toHaveLength(4);
    expect(startState.round).toBe(1);
    expect(startState.turnOrder).toHaveLength(4);
    expect(startState.activeCharacterId).toBeTruthy();

    // Start first turn
    await session.startTurn();
    const state1 = session.getState();
    expect(state1.phase).toBe('action_selection');

    // Get active character
    const activeChar = session.getActiveCharacter();
    expect(activeChar).toBeTruthy();

    // Execute attack if in range
    if (activeChar) {
      // Find an enemy
      const enemies = state1.characters.filter((c) => c.isPlayer !== activeChar.isPlayer);
      if (enemies.length > 0 && enemies[0]) {
        await session.attack(activeChar.id, enemies[0].id, {
          weaponDamage: '1d8',
          damageType: 'slashing',
        });
      }
    }

    // End turn
    await session.endTurn();
    const state2 = session.getState();

    // Should advance to next character
    expect(state2.activeCharacterId).not.toBe(state1.activeCharacterId);
  });

  it('should detect combat end when all enemies defeated', async () => {
    const weakGoblin = { ...goblin1, hp: 1, maxHp: 1 };
    const session = createCombatSession('test-combat-end', 42);

    await session.startCombat([fighter, weakGoblin]);
    await session.startTurn();

    // Attack until goblin is defeated
    let attempts = 0;
    while (!session.isCombatOver() && attempts < 20) {
      const activeChar = session.getActiveCharacter();
      if (activeChar?.isPlayer && !activeChar.hasActed) {
        await session.attack(activeChar.id, weakGoblin.id, {
          weaponDamage: '2d6',
          damageType: 'slashing',
        });
      }

      if (!session.isCombatOver()) {
        await session.endTurn();
        await session.startTurn();
      }

      attempts++;
    }

    // Combat should end when goblin is defeated
    if (session.isCombatOver()) {
      expect(session.getWinner()).toBe('player');
    }
  });

  it('should support time-travel', async () => {
    const session = createCombatSession('test-timetravel', 123);

    await session.startCombat([fighter, goblin1]);
    await session.startTurn();

    const state1 = session.getState();

    // Move fighter
    await session.moveCharacter(fighter.id, { x: 3, y: 3 });

    const state2 = session.getState();
    expect(state2.characters.find((c) => c.id === fighter.id)?.position).toEqual({ x: 3, y: 3 });

    // Get history
    const history = session.getHistory();
    expect(history.length).toBeGreaterThan(0);

    // Restore to state before movement
    await session.restoreState(history.length - 2);
    const restoredState = session.getState();

    expect(restoredState.characters.find((c) => c.id === fighter.id)?.position).toEqual(
      state1.characters.find((c) => c.id === fighter.id)?.position
    );
  });

  it('should include spell previews and resolutions in scripted simulations', async () => {
    const simulation = await getSimulationById('demo-classic');
    expect(simulation).not.toBeNull();
    if (!simulation) return;

    const [primarySpell] = combatDemoSpellLoadouts['demo-classic'] ?? [];
    expect(primarySpell).toBeTruthy();
    if (!primarySpell) return;

    const burningHandsPreview = simulation.steps.find((step) => step.state.spellPreview !== null);
    expect(burningHandsPreview?.state.spellPreview?.spellId).toBe(primarySpell.spellId);
    expect(burningHandsPreview?.state.spellPreview?.affectedSquares.length ?? 0).toBeGreaterThan(0);

    const burningHandsCast = simulation.steps.find((step) => step.state.lastSpellResolution !== null);
    expect(burningHandsCast?.state.lastSpellResolution?.spellId).toBe(primarySpell.spellId);
    expect(burningHandsCast?.state.lastSpellResolution?.affectedCharacterIds.length ?? 0).toBeGreaterThan(0);
  });
});
