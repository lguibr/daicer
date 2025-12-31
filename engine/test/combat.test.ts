import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveAttack, resolveGrapple, validateAttack } from '../src/rules/combat';
import { createCharacterSheet, createMeleeAction, createRangedAction, createAction } from './factories';
import { ConditionType } from '../src/rules/conditions';
import { ActionType } from '../src/rules/actions';
import * as diceModule from '../src/rules/dice';

// Mock dice
vi.mock('../src/rules/dice', async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, roll: vi.fn() };
});

describe('Combat Engine: SOTA Coverage', () => {
  // Setup
  const melee = createMeleeAction('sword', '1d8', 'slashing');
  const reachWeapon = createMeleeAction('halberd', '1d10', 'slashing');
  reachWeapon.reach = 10;

  const bow = createRangedAction('bow');

  // Sheets
  let attacker;
  let target;

  beforeEach(() => {
    vi.clearAllMocks();
    attacker = createCharacterSheet({
      name: 'Attacker',
      attributes: { Strength: 16, Dexterity: 16 } as any,
      structuredActions: [melee, reachWeapon, bow],
    });
    target = createCharacterSheet({
      name: 'Target',
      armorClass: 15,
      hp: 30,
      maxHp: 30,
    });
  });

  // --- Validation Section ---
  describe('validateAttack', () => {
    it('allows melee within 5ft', () => {
      const res = validateAttack(
        attacker,
        target,
        { type: ActionType.Attack, actionId: 'sword', targetId: target.id },
        { attacker: { x: 0, y: 0, z: 0 }, target: { x: 1, y: 0, z: 0 } } // ~5ft
      );
      expect(res.valid).toBe(true);
    });

    it('rejects melee beyond reach (10ft)', () => {
      const res = validateAttack(
        attacker,
        target,
        { type: ActionType.Attack, actionId: 'sword', targetId: target.id },
        { attacker: { x: 0, y: 0, z: 0 }, target: { x: 2, y: 0, z: 0 } } // ~10ft (1 unit = 5ft usually? No, engine units are usually grid units or ft?
        // Engine uses "euclidean" on raw coords.
        // Wait, map renderer sends grid coords?
        // In `geometry.ts`, distance is raw euclidean.
        // Assuming coords are in FEET for this test? Or Grid?
        // If Grid, reach 5 means 1 square?
        // Standard 5e engine usually assumes Feet for internal calculations.
        // Let's assume coords are FEET.
      );
      // If coords are feet: (0,0) -> (2,0) is distance 2 feet. Valid.
      // If coords are Grid: (0,0) -> (2,0) is 2 squares = 10 feet.
      // Let's assume             // Invalid case: 6 feet.
      const res2 = validateAttack(
        attacker,
        target,
        { type: ActionType.Attack, actionId: 'sword', targetId: target.id },
        { attacker: { x: 0, y: 0, z: 0 }, target: { x: 6, y: 0, z: 0 } }
      );
      expect(res2.valid).toBe(false);
      expect(res2.reason).toMatch(/out of range/i);
    });

    it('allows reach weapon at 10ft', () => {
      const res = validateAttack(
        attacker,
        target,
        { type: ActionType.Attack, actionId: 'halberd', targetId: target.id },
        { attacker: { x: 0, y: 0, z: 0 }, target: { x: 10, y: 0, z: 0 } }
      );
      expect(res.valid).toBe(true);
    });
  });

  // --- Resolution Section ---
  describe('resolveAttack', () => {
    const invoke = (intentOverride = {}) =>
      resolveAttack(attacker, target, {
        type: ActionType.Attack,
        actionId: 'sword',
        targetId: target.id,
        ...intentOverride,
      });

    it('Hits regular AC', () => {
      vi.mocked(diceModule.roll)
        .mockReturnValueOnce({ total: 16, rolls: [16] } as any)
        .mockReturnValueOnce({ total: 5, rolls: [5] } as any);
      const res = invoke();
      expect(res.hit).toBe(true);
      expect(res.damageTotal).toBe(5);
    });

    it('Misses regular AC', () => {
      vi.mocked(diceModule.roll).mockReturnValueOnce({ total: 10, rolls: [10] } as any);
      const res = invoke();
      expect(res.hit).toBe(false);
      expect(res.damageTotal).toBe(0);
    });

    it('Critical Hit (Natural 20)', () => {
      vi.mocked(diceModule.roll)
        .mockReturnValueOnce({ total: 25, rolls: [20] } as any)
        .mockReturnValueOnce({ total: 10, rolls: [4, 4] } as any);
      const res = invoke();
      expect(res.isCritical).toBe(true);
      expect(res.damageDetails[0].diceString).toMatch(/2d8/); // Doubled dice
    });

    it('Critical Miss (Natural 1)', () => {
      vi.mocked(diceModule.roll).mockReturnValueOnce({ total: -1, rolls: [1] } as any);
      const res = invoke();
      expect(res.isCriticalFail).toBe(true);
      expect(res.hit).toBe(false);
    });

    // --- Condition Interactions ---
    it('Prone Target: Grants Advantage to Melee', () => {
      target.conditions = [{ name: ConditionType.Prone, duration: 1 }];

      // Mock: Roll 1 (Low), Roll 2 (High) -> Should pick High
      vi.mocked(diceModule.roll)
        .mockReturnValueOnce({ total: 5, rolls: [2] } as any) // First d20
        .mockReturnValueOnce({ total: 20, rolls: [15] } as any) // Second d20
        .mockReturnValueOnce({ total: 5, rolls: [5] } as any); // Damage

      const res = invoke();
      // Should be a hit (15+mods > 15)
      expect(res.hit).toBe(true);
    });

    it('Prone Target: Grants Disadvantage to Ranged', () => {
      target.conditions = [{ name: ConditionType.Prone, duration: 1 }];

      // Mock: Roll 1 (High), Roll 2 (Low) -> Should pick Low
      vi.mocked(diceModule.roll)
        .mockReturnValueOnce({ total: 20, rolls: [15] } as any)
        .mockReturnValueOnce({ total: 5, rolls: [2] } as any);

      const res = resolveAttack(attacker, target, { type: ActionType.Attack, actionId: 'bow', targetId: target.id });
      expect(res.hit).toBe(false); // Took the low roll (5)
    });

    it('Paralyzed Target: Auto-Critical on Hit (Melee)', () => {
      target.conditions = [{ name: ConditionType.Paralyzed, duration: 1 }];
      // Assuming implementation flags 'autoCritReceived'
      // Need to verify 'getConditionModifiers' logic for Paralyzed in 'conditions.ts'.
      // If it grants Advantage and criticals.

      // Mock Hit (Advantage implied by Paralyzed usually, but let's just ensure hit roll)
      // Paralyzed grants Advantage + Auto Crit.
      // Logic: 2 Attack Rolls.
      vi.mocked(diceModule.roll)
        .mockReturnValueOnce({ total: 20, rolls: [15] } as any) // Attack 1
        .mockReturnValueOnce({ total: 20, rolls: [15] } as any) // Attack 2
        .mockReturnValueOnce({ total: 10, rolls: [5, 5] } as any); // Dmg

      const res = invoke();
      expect(res.isCritical).toBe(true); // Auto crit logic
    });

    // --- Damage Logic ---
    it('Resistance Checks (Mocked)', () => {
      target.resistances = ['slashing'];
      vi.mocked(diceModule.roll)
        .mockReturnValueOnce({ total: 20, rolls: [15] } as any)
        .mockReturnValueOnce({ total: 10, rolls: [7] } as any);
      // 10 -> 5
      expect(invoke().damageTotal).toBe(5);
    });

    it('Vulnerability Checks', () => {
      target.vulnerabilities = ['slashing'];
      vi.mocked(diceModule.roll)
        .mockReturnValueOnce({ total: 20, rolls: [15] } as any)
        .mockReturnValueOnce({ total: 10, rolls: [7] } as any);
      // 10 -> 20
      expect(invoke().damageTotal).toBe(20);
    });

    it('Immunity Checks', () => {
      target.immunities = ['slashing'];
      vi.mocked(diceModule.roll)
        .mockReturnValueOnce({ total: 20, rolls: [15] } as any)
        .mockReturnValueOnce({ total: 10, rolls: [7] } as any);
      expect(invoke().damageTotal).toBe(0);
    });

    // --- Class Features ---
    it('Sneak Attack: Success (Advantage)', () => {
      // Rogue setup
      const rogue = createCharacterSheet({
        ...attacker,
        features: [{ name: 'Sneak Attack', type: 'passive' } as any],
        structuredActions: [melee],
      }); // Sword is slicing? Not finesse.
      // Wait, sneak requires Finesse.
      const dagger = createMeleeAction('dagger', '1d4', 'piercing');
      dagger.properties = ['finesse'];
      rogue.structuredActions = [dagger];

      vi.mocked(diceModule.roll)
        .mockReturnValueOnce({ total: 20, rolls: [15] } as any) // Atk 1
        .mockReturnValueOnce({ total: 20, rolls: [15] } as any) // Atk 2 (Advantage)
        .mockReturnValueOnce({ total: 4, rolls: [2] } as any) // Weapon
        .mockReturnValueOnce({ total: 4, rolls: [1, 3] } as any); // Sneak

      const res = resolveAttack(rogue, target, {
        type: ActionType.Attack,
        actionId: 'dagger',
        targetId: target.id,
        advantage: true,
      });
      expect(res.damageTotal).toBe(8);
      expect(res.damageDetails.some((d) => d.type === 'precision')).toBe(true);
    });

    it('Sneak Attack: Fail (No Advantage, No Finesse)', () => {
      const rogue = createCharacterSheet({
        ...attacker,
        features: [{ name: 'Sneak Attack', type: 'passive' } as any],
        structuredActions: [melee],
      });
      // Sword, Not Finesse. No Advantage.

      vi.mocked(diceModule.roll)
        .mockReturnValueOnce({ total: 20, rolls: [15] } as any)
        .mockReturnValueOnce({ total: 5, rolls: [5] } as any);

      const res = resolveAttack(rogue, target, { type: ActionType.Attack, actionId: 'sword', targetId: target.id });
      // Should just be weapon damage
      expect(res.damageDetails.some((d) => d.type === 'precision')).toBe(false);
    });

    // --- Edge Cases & Error Handling ---
    it('validateAttack: Invalid Intent Type', () => {
      const res = validateAttack(
        attacker,
        target,
        { type: ActionType.CastSpell, actionId: 'spell', spellId: 's' } as any,
        { attacker: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } }
      );
      expect(res.valid).toBe(false);
      expect(res.reason).toMatch(/Not an attack/i);
    });

    it('validateAttack: Action Not Found', () => {
      const res = validateAttack(
        attacker,
        target,
        { type: ActionType.Attack, actionId: 'missing', targetId: target.id },
        { attacker: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } }
      );
      expect(res.valid).toBe(false);
      expect(res.reason).toMatch(/Action not found/i);
    });

    it('resolveAttack: Throws on Invalid Intent', () => {
      expect(() => resolveAttack(attacker, target, { type: ActionType.CastSpell, actionId: 'spell' } as any)).toThrow(
        /Invalid intent type/
      );
    });

    it('resolveAttack: Throws on Action Not Found', () => {
      expect(() =>
        resolveAttack(attacker, target, { type: ActionType.Attack, actionId: 'missing', targetId: target.id })
      ).toThrow(/Action missing is not a valid/);
    });

    it('Unconscious Target: Auto-Critical on Hit', () => {
      target.conditions = [{ name: ConditionType.Unconscious, duration: 10 }];
      // Unconscious grants Auto Crit (and Advantage via generic flags or logic).
      // Checking standard Auto Crit
      vi.mocked(diceModule.roll)
        .mockReturnValueOnce({ total: 20, rolls: [15] } as any) // Hit
        .mockReturnValueOnce({ total: 10, rolls: [5, 5] } as any) // Dmg 1
        .mockReturnValueOnce({ total: 10, rolls: [5, 5] } as any); // Dmg 2 (Crit)

      const res = invoke();
      expect(res.isCritical).toBe(true);
    });

    test('should include execution trace in result', () => {
      const attacker = createCharacterSheet({
        name: 'Tracer',
        structuredActions: [
          createAction({
            id: 'action-1',
            name: 'Shortsword',
            toHit: 5,
            damage: [{ dice: '1d6', bonus: 3, type: 'piercing' }],
          }),
        ],
      });
      const target = createCharacterSheet({ name: 'Dummy', armorClass: 10 });
      const intent: ActionIntent = { type: ActionType.Attack, actionId: 'action-1' };

      // Mock Roll: Hit (15+5=20 vs 10)
      // Damage: 4+3=7
      vi.mocked(diceModule.roll)
        .mockReturnValueOnce({ total: 20, rolls: [15], bonus: 5, definition: { count: 1, sides: 20, bonus: 5 } }) // Hit
        .mockReturnValueOnce({ total: 7, rolls: [4], bonus: 3, definition: { count: 1, sides: 6, bonus: 3 } }); // Damage

      const result = resolveAttack(attacker, target, intent);

      expect(result.trace).toBeDefined();
      expect(result.trace).toHaveLength(2); // Hit + Damage

      const hitStep = result.trace[0];
      expect(hitStep.type).toBe('roll_to_hit');
      expect(hitStep.total).toBe(20);
      expect(hitStep.outcome).toBe('Hit');

      const dmgStep = result.trace[1];
      expect(dmgStep.type).toBe('roll_damage');
      expect(dmgStep.total).toBe(7);
    });
  });
});
