# Unified Entity Model: Character vs. Monster

> **Objective**: Analyze the structural disparities between `Monster` and `Character` data models and propose a unified strategy for the `CharacterSheet` to consume and represent them consistently.

## The Core Problem

The system currently treats **Characters** and **Monsters** as fundamentally different data shapes, despite them behaving identically in the tactical engine (they both move, attack, save, and take damage).

- **Characters**: Highly structured. Defined by **relations** (`Race`, `Class`, `Background`) and **derivation rules** (Stats + Proficiency Bonus = Skill Mod).
- **Monsters**: Highly unstructured. Defined by **flat JSON blobs** (`proficiencies`, `actions`, `special_abilities`) that mirror the SRD text directly.

This dichotomy creates massive friction when:

1.  Trying to create a unified `CharacterSheet`.
2.  Running the Tactical Engine (which needs deterministic numbers, not "Multiattack: two scimitar attacks").
3.  Polymorphing a Character into a Monster (features don't map).

## The "Unified Sheet" Goal

We aim to create a `CharacterSheet` that is the **Single Source of Truth** for the gameplay engine. It must ingest either a `Character` blueprint OR a `Monster` blueprint and normalize them into a standard set of capabilities.

## Study Topics

This study is broken down into 10 key domains where unification is required:

1.  **[Proficiencies](./01-proficiencies.md)**: From "Stealth +5" strings to structured Skill/Save tags.
2.  **[Senses](./02-senses.md)**: Unifying Passive Perception and specific visions (Darkvision, Blindsight).
3.  **[Languages](./03-languages.md)**: Strings vs. Relation IDs.
4.  **[Actions & Attacks](./04-actions-and-attacks.md)**: The hardest problem. Structured Actions vs. Text Blocks.
5.  **[Special Abilities](./05-special-abilities.md)**: Traits vs. Features.
6.  **[Power Scaling](./06-power-scaling.md)**: CR vs. Level & Proficiency Bonus.
7.  **[Vitality](./07-vitality.md)**: Fixed HP vs. Hit Dice Derivation.
8.  **[Gear](./08-gear.md)**: Inventory Items vs. Natural Weapons.
9.  **[The Blueprint Pattern](./09-blueprint-pattern.md)**: How relations feed the Sheet.
10. **[Dynamic Computation](./10-dynamic-computation.md)**: The Engine's role in real-time derivation.

---

_This study is a living document intended to guide the architectural refactoring of the Daicer backend._
