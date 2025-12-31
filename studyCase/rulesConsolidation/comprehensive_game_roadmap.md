# Comprehensive Game Roadmap

This document outlines the evolutionary path for the `@daicer/engine` Rules Consolidation. It integrates the specific architectural constraints of our **Voxel Engine** and **Deterministic Core**.

It aggregates the detailed milestones from the following domain-specific roadmaps:

- [⚔️ Combat Engine](./combat/roadmap.md)
- [✨ Magic System](./spells/roadmap.md)
- [🛌 Resting & State](./resting/roadmap.md)
- [📈 Leveling & Progression](./leveling/roadmap.md)
- [🛡️ Class Mechanics](./classes/roadmap.md)
- [🧬 Race Mechanics](./races/roadmap.md)
- [🌍 Traveling & Exploration](./traveling/roadmap.md)

---

## 🟢 Phase 1: Alpha (MVP) _(Implemented)_

**Goal**: Playable "Vertical Slice" on the Voxel Grid covering the core loop (Move, Attack, Cast, Rest).
**Architecture**: Server-Authoritative `ActionDispatcher` validating inputs against `CharacterSheet`.

### ⚔️ Combat ([Details](./combat/roadmap.md))

- **Actions**: `resolveAttack` handling To-Hit/AC/Damage via deterministic `DiceRoll` logic.
- **Grid Validation**: Euclidean distance checks on the Voxel Grid for Melee (5ft) and Ranged.
- **LoS**: Simple 3D Raycast (Center-to-Center) to validate target visibility through Voxel geometry.
- **Economy**: Turn-state tracking (`hasUsedAction`, `hasUsedBonusAction`) reset on Turn Start.

### ✨ Magic ([Details](./spells/roadmap.md))

- **Slots**: `SpellSlotsSchema` management with explicit deduction usage.
- **Geometry**: `isPointInCone` / `isPointInRadius` utilities for AOE shapes on the Grid.
- **Resolution**: Returns `DC` and `SlotConsumed` for the Narrator to describe; engine does not auto-apply damage yet.

### 🛌 Resting ([Details](./resting/roadmap.md))

- **Short Rest**: Transactional Hit Dice spending (`spend_hit_dice`) and Warlock slot resets.
- **Long Rest**: Full state reset (HP, Slots, Half HD) based on `DateTime` duration logic.
- **Conditions**: Simple string-based array on `CharacterSheet`.

### 🌍 Traveling ([Details](./traveling/roadmap.md))

- **Voxel Movement**: `validateMove` ensuring entities adhere to per-turn Speed limits on the 3D Grid.
- **Coordinates**: Absolute `x,y,z` positioning within the single unified Map.

---

## 🟡 Phase 2: Beta (Feature Parity)

**Goal**: Full SRD Mechanical Parity, leveraging the generic Entity Model.
**Architecture**: Enhanced `EntityAdapter` to handle reactive traits and complex conditions.

### ⚔️ Combat

- **Reactions**: Architecture for "Interrupt Actions" (e.g., Attack of Opportunity triggers on Voxel exit).
- **Resistances**: Engine queries Target's `features` for "Damage Modification" tags (Half/Zero).
- **Conditions**: `ConditionSchema` actively modifying `resolveAttack` math (e.g., _Prone_ adds Disadvantage).
- **Grappling**: Contested Skill Checks (Athletics vs Acrobatics) invoking the Skill engine.

### ✨ Magic

- **Upcasting**: Logic to dynamically scale `ActionDefinition` damage/targets when a higher level slot is consumed.
- **Components**: Inventory checks for specific items (Diamond) vs Generic Component Pouch.
- **Concentration**: Engine state `concentratingOn` (SpellID); auto-trigger CON saves on damage interruption.

### 🛌 Resting

- **Expiry**: `TurnManager` hooks to decrement Condition Duration at Start/End of Turn.
- **Exhaustion**: 6-Tier penalty application (Speed reduction applied to `validateMove`).

### 📈 Leveling ([Details](./leveling/roadmap.md))

- **Multiclassing**: Calculating Proficiency Bonus based on Total Level vs Class Level for Features.
- **Feats**: Injection of "Feat Features" into the flattened `structuredActions` list.

---

## 🔵 Phase 3: V1 (Release - Full Simulation)

**Goal**: Deep Voxel Simulation and Automation of complex 5e edge cases.
**Architecture**: Fully optimized `ChunkManager` and `PhysicsEngine` integration.

### ⚔️ Combat

- **Cover**: Advanced Raycasting against Voxel Geometry to determine 1/2 (+2 AC) or 3/4 (+5 AC) cover dynamically.
- **Verticality**: Fall damage calculation based on Z-axis deltas.
- **Lair Actions**: Turn Scheduler injection for Initiative Count 20.

### ✨ Magic

- **Physics Interaction**: Spells that alter Voxel Types (e.g., _Wall of Stone_ placement, _Grease_ creating slippery terrain).
- **Teleportation**: `validateTeleport` checking Voxel occupancy and destination safety (solid block check).
- **Summoning**: Engine-native instantiation of new Entities (Tokens) linked to the Caster.

### 🌍 Traveling

- **Global Grid**: Seamless zooming/loading of Chunks for macro-scale travel (no separate Hex map).
- **Weather**: Global modifiers (Snow/Rain) altering Voxel traversal costs (Difficult Terrain injection).
