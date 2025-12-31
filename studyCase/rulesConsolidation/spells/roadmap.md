# Magic System Roadmap

## Overview

The Magic System handles spellcasting validation, slot consumption, and effect resolution (Saving Throws, AoE).

## 🟢 Alpha (MVP) _(Implemented)_

**Focus**: Resource Management & Simple Resolution.

- **Spells**: Validated via `validateSpellCast` (Range, Slots).
- **Slots**: Explicit Slot Consumption logic.
- **Resolution**: Returns Save DC and Slot Consumed.
- **AoE**: Simple Geometry checks (Cone, Sphere) using `utils/geometry.ts`.
- **Rituals**: Time enforcement (+10 min).

## 🟡 Beta

**Focus**: Advanced Magic Rules.

- **Upcasting**: Logic to scale Damage/Targets based on Slot Level used > Base Level.
- **Material Components**: Tracking generic Component Pouch vs Specific Costly Components (consume logic).
- **Concentration**: Engine state tracking for "Concentrating on [Spell ID]", auto-drop on cast new concentration spell.
- **Cantrip Scaling**: Auto-damage scaling (1d10 -> 2d10) based on Character Level.

## 🔵 V1 (Release)

**Focus**: Complete Spell Simulation.

- **Complex Targeting**: "Chain Lightning" style bouncing logic.
- **Summoning**: Engine-native instantiation of temporary Entity tokens.
- **Teleporation checks**: Validating destination voxel occupancy.
- **Counterspell**: Reaction logic to interrupt Cast Intent.
- **Antimagic Fields**: Zone-based negation of `resolveSpell`.
