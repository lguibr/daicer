# Class Mechanics Roadmap

## Overview

Class Mechanics covers the unique implementation of the 12+ Core Classes and their specific resource loops.

## 🟢 Alpha (MVP) _(Implemented)_

**Focus**: Broad Archetypes.

- **Resources**: Generic `ResourcePool` support (can track Ki, Rage, Sorcery Points).
- **Features**: Flattened simple features (e.g., "Sneak Attack", "Second Wind") that rely on LLM or manual tracking.

## 🟡 Beta

**Focus**: Class-Specific Engines.

- **Barbarian**: Rage damage bonus injection, Resistance toggles.
- **Rogue**: Sneak Attack validation (Ally adjacency or Advantage check).
- **Monk**: Ki Point expenditures for Step of the Wind/Flurry of Blows (Bonus Action generation).
- **Paladin**: Divine Smite slot consumption trigger on Hit.
- **Sorcerer**: Metamagic point conversion logic (Points <-> Slots).

## 🔵 V1 (Release)

**Focus**: Subclass Specializations.

- **Druid**: Wild Shape stat block replacement (Swap CharacterSheet stats with Beast stats temporarily).
- **Artificer**: Infusion logic (Modifying Item/Equipment stats dynamically).
- **Warlock**: Invocations automated logic (e.g., Devil's Sight modifying Vision rendering).
- **Cleric**: Channel Divinity varying effects resolution.
