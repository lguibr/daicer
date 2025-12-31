# Combat Engine Roadmap

## Overview

The Combat Engine handles the deterministic resolution of physical conflict, including attack rolls, damage calculation, and turn-based state validation.

## 🟢 Alpha (MVP) _(Implemented)_

**Focus**: Basic Attack Resolution.

- **Actions**: `resolveAttack` handles To-Hit vs AC and Damage calculation.
- **Validation**: Range checks (Melee/Ranged) and Line of Sight (Simple Boolean).
- **State**: Track `hasUsedAction`, `hasUsedBonusAction`.
- **Damage**: Standard damage types.
- **Crit**: 2x Dice logic implemented.

## 🟡 Beta

**Focus**: Tactical Depth & Reactions.

- **Reactions**: Implementation of Reaction ActionType (e.g., Attack of Opportunity, Prepared Action).
- **Resistances/Immunities**: Engine checks Target features for Damage modifiers (Half/Zero/Double).
- **Conditions**: Mechanics for Prone (Advantage/Disadvantage injection), Restrained, Paralyzed (Auto-Crit).
- **Grappling**: Full contest logic (Athletics vs Acrobatics) rather than simplified Stunned.

## 🔵 V1 (Release)

**Focus**: Complex Simulation.

- **Cover**: Raycasting to determine 1/2, 3/4, or Full Cover modifiers (+2/+5 AC).
- **Legendary Actions**: Queue system to inject actions at end of other creatures' turns.
- **Lair Actions**: Initiative count 20 triggers.
- **Mounted Combat**: Dual-token logic.
- **Vehicle Combat**: Ship/Wagon generic entity actions.
