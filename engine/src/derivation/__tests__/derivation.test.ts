import { EntityDeriver } from '../index';
import { DerivationContext } from '../types';

describe('EntityDeriver', () => {
  const baseAttributes = {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  };

  it('calculates modifiers correctly', () => {
    expect(EntityDeriver.calculateModifier(10)).toBe(0);
    expect(EntityDeriver.calculateModifier(12)).toBe(1);
    expect(EntityDeriver.calculateModifier(9)).toBe(-1);
    expect(EntityDeriver.calculateModifier(20)).toBe(5);
  });

  it('derives unarmored defense correctly', () => {
    const context: DerivationContext = {
      attributes: { ...baseAttributes, dex: 14 }, // +2
      level: 1,
      proficiencyBonus: 2,
      equipment: [],
      race: { speed: 30 },
    };
    const derived = EntityDeriver.derive(context);
    expect(derived.ac).toBe(12);
  });

  it('derives armor class with light armor', () => {
    const context: DerivationContext = {
      attributes: { ...baseAttributes, dex: 14 }, // +2
      level: 1,
      proficiencyBonus: 2,
      equipment: [
        {
          name: 'Leather Armor',
          equipment_category: { slug: 'light-armor' },
          armor_class_base: 11,
          armor_class_dex_bonus: true,
        },
      ],
      race: { speed: 30 },
    };
    const derived = EntityDeriver.derive(context);
    expect(derived.ac).toBe(13); // 11 + 2
  });

  it('derives armor class with medium armor (capped)', () => {
    const context: DerivationContext = {
      attributes: { ...baseAttributes, dex: 16 }, // +3
      level: 1,
      proficiencyBonus: 2,
      equipment: [
        {
          name: 'Scale Mail',
          equipment_category: { slug: 'medium-armor' },
          armor_class_base: 14,
          armor_class_dex_bonus: true,
        },
      ],
      race: { speed: 30 },
    };
    const derived = EntityDeriver.derive(context);
    expect(derived.ac).toBe(16); // 14 + 2 (capped)
  });

  it('derives hp correctly at level 1', () => {
    const context: DerivationContext = {
      attributes: { ...baseAttributes, con: 14 }, // +2
      level: 1,
      proficiencyBonus: 2,
      equipment: [],
      hitDie: 10,
      race: { speed: 30 },
    };
    const derived = EntityDeriver.derive(context);
    expect(derived.hp).toBe(12); // 10 + 2
  });

  it('derives hp correctly at higher levels', () => {
    const context: DerivationContext = {
      attributes: { ...baseAttributes, con: 14 }, // +2
      level: 3,
      proficiencyBonus: 2,
      equipment: [],
      hitDie: 10, // avg 6
      race: { speed: 30 },
    };
    const derived = EntityDeriver.derive(context);
    // L1: 10 + 2 = 12
    // L2: 6 + 2 = 8
    // L3: 6 + 2 = 8
    // Total: 28
    expect(derived.hp).toBe(28);
  });

  it('calculates speed with penalties', () => {
    const context: DerivationContext = {
      attributes: { ...baseAttributes, str: 8 },
      level: 1,
      proficiencyBonus: 2,
      equipment: [
        {
          name: 'Chain Mail',
          equipment_category: { slug: 'heavy-armor' },
          str_minimum: 13,
        },
      ],
      race: { speed: 30 },
    };
    const derived = EntityDeriver.derive(context);
    expect(derived.speed.walk).toBe(20); // 30 - 10 penalty
  });
});
