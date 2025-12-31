import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveAttack } from '../src/rules/combat';
import { createCharacterSheet, createMeleeAction } from './factories';
import { ActionType } from '../src/rules/actions';
import * as diceModule from '../src/rules/dice';

vi.mock('../src/rules/dice', async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, roll: vi.fn() };
});

describe('Equipment Actions: SOTA Coverage', () => {
  let char: any;
  let target: any;

  beforeEach(() => {
    vi.clearAllMocks();
    char = createCharacterSheet({ name: 'Fighter', attributes: { Strength: 16 } as any }); // +3
    target = createCharacterSheet({ name: 'Dummy', armorClass: 10 });
  });

  const invoke = (actionId: string) =>
    resolveAttack(char, target, { type: ActionType.Attack, actionId, targetId: target.id });

  it('Resolves Standard Equipment Attack (Longsword 1H)', () => {
    const itemAction = createMeleeAction('longsword-1h', '1d8', 'slashing');
    char.structuredActions = [itemAction];

    // Hit (15), Dmg (5 [2+3])
    vi.mocked(diceModule.roll)
      .mockReturnValueOnce({ total: 15, rolls: [15] } as any)
      .mockReturnValueOnce({ total: 5, rolls: [2] } as any);

    const res = invoke('longsword-1h');
    expect(res.hit).toBe(true);
    expect(res.damageTotal).toBe(5);
    expect(res.damageDetails[0].diceString).toMatch(/1d8/);
  });

  it('Resolves Versatile (Two-Handed) Variant', () => {
    // Simulating the user choosing the "2H" option, which uses the 1d10 profile
    const itemAction = createMeleeAction('longsword-2h', '1d10', 'slashing');
    char.structuredActions = [itemAction];

    // Hit (15), Dmg (6 [3+3])
    vi.mocked(diceModule.roll)
      .mockReturnValueOnce({ total: 15, rolls: [15] } as any)
      .mockReturnValueOnce({ total: 6, rolls: [3] } as any);

    const res = invoke('longsword-2h');
    expect(res.damageDetails[0].diceString).toMatch(/1d10/);
    expect(res.damageTotal).toBe(6);
  });

  it('Resolves Dual Wielding (Offhand)', () => {
    // Simulating Offhand: Usually no Str bonus to damage (unless Feat).
    // Our engine doesn't auto-strip mod yet unless Action says "bonus: 0".
    // Let's assume the Action for Offhand was created without the bonus manually.
    const offhand = createMeleeAction('dagger-off', '1d4', 'piercing');
    offhand.damage[0].bonus = 0; // Manual adjustment for offhand

    char.structuredActions = [offhand];

    // Hit (15), Dmg (2 [2+0])
    vi.mocked(diceModule.roll)
      .mockReturnValueOnce({ total: 15, rolls: [15] } as any)
      .mockReturnValueOnce({ total: 2, rolls: [2] } as any);

    const res = invoke('dagger-off');
    expect(res.damageTotal).toBe(2);
  });
});
