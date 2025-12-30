# 10. Dynamic Computation: The Engine's Role

## The Concept

The `CharacterSheet` should be a **State Container**, not a Logic Engine.
The `@daicer/engine` package is the **Logic Engine**.

### The Loop

1.  **State**: `Sheet` contains `{ stats: { str: 16 }, specificBonuses: [{ type: 'check', stat: 'str', val: 1 }] }`
2.  **Request**: Frontend asks "What is my Athletics Check?"
3.  **Compute**: `Engine.getSkill(sheet, 'athletics')`.
    - Base: Str (3).
    - Prof: Yes (2).
    - Bonuses: +1.
    - Result: +6.

## The Disparity

- **Characters**: rely heavily on this computation (Standard D&D Math).
- **Monsters**: rely on **Hardcoded Overrides**. A Monster might have Str 10 (+0) but a Stealth of +8 (Arbitrary).

## Unification Strategy

The Engine must support **Values vs. Overrides**.

```typescript
interface ComputedStat {
  base: number; // Derived from Attribute
  added: number; // Sum of modifiers
  override?: number; // If set, ignore base/added (Monster Logic)
  final: number; // The actual value used
}
```

1.  **For Monsters**:
    - When parsing `proficiencies`, if the math doesn't align (`Stat + PB != Value`), we check an `override` flag or simply treat the monster's value as the "Source of Truth" for that specific skill.
2.  **For Characters**:
    - Almost always use `base + added`. Overrides are rare (e.g., Gauntlets of Ogre Power setting STR to 19).

## The "Dice & Calculation" Philosophy

**Core Mandate**: We prioritize **Calculation** and **Dice Formulas** over static averages.

- **Monsters are not static images**: They are dynamic entities.
- **Attack Rolls**: We do not trust the static `+5` in the text. We calculate `STR (+3) + PB (+2)`.
  - _Exception_: If the text says `+8` (impossible math), we treat it as a "Magic Bonus" or "Special Training" trait that adds `+3`.
- **Damage**: We do not use the average "Hit: 5 slashing damage". We use `1d6 + 2`.
  - The UI may show "5 (1d6+2)", but the **Action Button** rolls the dice.
