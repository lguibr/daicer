import { describe, it, expect, beforeEach } from 'vitest';
import { resolveSpell, validateSpellCast } from '../src/rules/magic';
import { createCharacterSheet, createSpellAction } from './factories';
import { ActionType } from '../src/rules/actions';

describe('Magic System: SOTA Coverage', () => {
  let caster: any;
  let target: any;

  const fireball = createSpellAction('fireball', 3, false);
  fireball.range = '150 feet';

  const coneOfCold = createSpellAction('cone-of-cold', 5, false);
  coneOfCold.range = 'Self (60-foot cone)';

  const fly = createSpellAction('fly', 3, true);

  const firebolt = createSpellAction('firebolt', 0, false);

  beforeEach(() => {
    caster = createCharacterSheet({
      name: 'Wizard',
      attributes: { Intelligence: 16 } as any,
      spellbook: {
        spellcastingAbility: 'intelligence',
        spellSaveDc: 15,
        spellAttackBonus: 7,
        slots: [
          { level: 1, max: 4, current: 4 },
          { level: 2, max: 3, current: 3 },
          { level: 3, max: 2, current: 2 },
          { level: 5, max: 1, current: 1 },
        ],
        concentratingOn: null,
      } as any,
      structuredActions: [fireball, coneOfCold, fly, firebolt],
    });

    target = createCharacterSheet({ name: 'Target' });
  });

  // --- Validation ---
  describe('validateSpellCast', () => {
    const invoke = (intentOverride = {}, posOverride = {}) =>
      validateSpellCast(
        caster,
        { type: ActionType.CastSpell, actionId: 'fireball', ...intentOverride } as any,
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 0, z: 0 } // Target pos
      );

    it('Validates known spell with slots', () => {
      const res = invoke();
      expect(res.valid).toBe(true);
    });

    it('Invalidates if Intent is not CastSpell', () => {
      const res = invoke({ type: ActionType.Attack });
      expect(res.valid).toBe(false);
      expect(res.reason).toMatch(/Invalid Intent/i);
    });

    it('Invalidates if Spell not Known', () => {
      const res = invoke({ actionId: 'wish' });
      expect(res.valid).toBe(false);
      expect(res.reason).toMatch(/not found/i);
    });

    it('Invalidates if No Slots of Level', () => {
      caster.spellbook.slots[2].current = 0; // Empty level 3 slots
      const res = invoke();
      expect(res.valid).toBe(false);
      expect(res.reason).toMatch(/No Level 3 spell slots/i);
    });

    it('Validates Cantrip even if "slots" empty (Cantrips dont use slots check logic)', () => {
      // Logic in magic.ts: if level > 0 check slots.
      const res = invoke({ actionId: 'firebolt' });
      expect(res.valid).toBe(true);
    });

    it('Invalidates Range: Target too far', () => {
      // Fireball 150.
      const res = validateSpellCast(
        caster,
        { type: ActionType.CastSpell, actionId: 'fireball' } as any,
        { x: 0, y: 0, z: 0 },
        { x: 200, y: 0, z: 0 }
      );
      expect(res.valid).toBe(false);
      expect(res.reason).toMatch(/out of range/i);
    });

    it('Validates Range: Target within range', () => {
      const res = validateSpellCast(
        caster,
        { type: ActionType.CastSpell, actionId: 'fireball' } as any,
        { x: 0, y: 0, z: 0 },
        { x: 150, y: 0, z: 0 }
      );
      expect(res.valid).toBe(true);
    });
  });

  // --- Resolution ---
  describe('resolveSpell', () => {
    const invoke = (intentOverride = {}) =>
      resolveSpell(caster, {
        type: ActionType.CastSpell,
        actionId: 'fireball',
        spellId: 'spell-fireball',
        ...intentOverride,
      } as any);

    it('Deducts spell slot (Level 3)', () => {
      const res = invoke();
      expect(res.slotConsumed).toBe(3);
      const slot = caster.spellbook.slots.find((s) => s.level === 3);
      expect(slot.current).toBe(1); // 2->1
    });

    it('Does NOT deduct slot for Cantrip (Level 0)', () => {
      const res = invoke({ actionId: 'firebolt', spellId: 'spell-firebolt' });
      expect(res.slotConsumed).toBe(0);
      const slot1 = caster.spellbook.slots.find((s) => s.level === 1);
      expect(slot1.current).toBe(4);
    });

    it('Detects AoE (Cone)', () => {
      const res = invoke({ actionId: 'cone-of-cold' });
      expect(res.isAoE).toBe(true);
    });

    it('Detects non-AoE (if simpler spell)', () => {
      // fly is touch/range single target usually
      const res = invoke({ actionId: 'fly' });
      // My factory says '60 feet'.
      // Regex: /cone|sphere|line|cylinder|radius/i
      expect(res.isAoE).toBe(false);
    });

    it('Calculates DC correctly (from sheet override)', () => {
      const res = invoke();
      expect(res.saveDC).toBe(15);
    });

    it('Sets Concentration (New)', () => {
      const res = invoke({ actionId: 'fly' });
      expect(res.newConcentrationId).toBe('fly');
      expect(caster.spellbook.concentratingOn).toBe('fly');
    });

    it('Breaks Concentration (Existing)', () => {
      caster.spellbook.concentratingOn = 'haste';
      const res = invoke({ actionId: 'fly' });
      expect(res.brokenConcentrationId).toBe('haste');
      expect(res.newConcentrationId).toBe('fly');
    });

    it('Does NOT Break Concentration for Instantaneous Spell', () => {
      caster.spellbook.concentratingOn = 'haste';
      const res = invoke({ actionId: 'fireball' }); // Instant
      expect(res.brokenConcentrationId).toBeUndefined();
      expect(caster.spellbook.concentratingOn).toBe('haste');
    });

    it('Throws on Action Not Found', () => {
      expect(() => invoke({ actionId: 'missing' })).toThrow(/not found/);
    });

    it('Throws on Invalid Intent', () => {
      expect(() => resolveSpell(caster, { type: ActionType.Attack, actionId: 'fireball' } as any)).toThrow(
        /Invalid intent/
      );
    });

    it('Upcasting: Logic consumes higher slot if passed? (Future Proof)', () => {
      // Logic in magic.ts uses `intent.level ?? spell.level`.
      // If I say "Cast Fireball at Level 5".
      const res = invoke({ actionId: 'fireball', level: 5 });
      expect(res.slotConsumed).toBe(5);
      const slot5 = caster.spellbook.slots.find((s) => s.level === 5);
      expect(slot5.current).toBe(0); // 1->0
      // Did not consume lvl 3
      const slot3 = caster.spellbook.slots.find((s) => s.level === 3);
      expect(slot3.current).toBe(2);
    });
  });
});
