# Rules Consolidation: Roadmap Overview

This document outlines the evolutionary path for the `@daicer/engine` Rules Consolidation. It orchestrates the development from the current **Alpha (MVP)** state towards a fully-realized **V1.0** Deterministic Engine.

The consolidation is divided into 7 key domains, each with its own detailed roadmap:

## Domain Roadmaps

1.  **[Combat Engine](./combat/roadmap.md)**: Physical conflict, attacks, damage, and turn management.
2.  **[Magic System](./spells/roadmap.md)**: Spellcasting, slots, AoE resolution, and saving throws.
3.  **[Resting & State](./resting/roadmap.md)**: Resource recovery, condition management, and time-based updates.
4.  **[Leveling & Progression](./leveling/roadmap.md)**: XP, HP growth, proficiency scaling, and feature unlocking.
5.  **[Class Mechanics](./classes/roadmap.md)**: Class-specific unique resources (Ki, Rage, Sorcery Points) and features.
6.  **[Race Mechanics](./races/roadmap.md)**: Racial traits, innate spellcasting, and resistances.
7.  **[Traveling & Exploration](./traveling/roadmap.md)**: Movement, hex-crawl mechanics, and exhaustion.

---

## Evolution Stages

### 🟢 Alpha (MVP) - _Current Status_

- **Goal**: Playable "Vertical Slice" covering 80% of standard gameplay loop.
- **Focus**: Stability, deterministic data structure, core actions (Attack/Spell/Rest).
- **Constraints**: Flattened lists, lack of specialized edge-case logic (e.g., Reactions, Legendary Actions).

### 🟡 Beta - _Next Phase_

- **Goal**: Feature Parity with basic SRD complexity.
- **Focus**: Resistances/Immunities, Reactions (Shield, AoO), Conditions affecting mechanics (e.g., Prone = Advantage).
- **Additions**: Multiclassing support layout, deeper class-specific resource tracking.

### 🔵 V1 (Release) - _Full Engine_

- **Goal**: Full D&D 5e Simulation capability.
- **Focus**: Tactical Depth (Cover, complex AoE), Legendary Actions, Lair Actions, Vehicle Combat.
- **Additions**: Custom scripting engine for homebrew, full automation of all 300+ spells.
