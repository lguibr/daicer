# Leveling & Progression Roadmap

## Overview

Leveling handles the deterministic growth of a character, including stat increases, feature acquisition, and resource expansion.

## 🟢 Alpha (MVP) _(Implemented)_

**Focus**: Quantitative Growth.

- **HP**: Deterministic Average gain + CON mod.
- **Slots**: Standard Full Caster table support.
- **Proficiency**: Auto-recalculation based on total level.
- **Spells**: Simple "Add All" or manual selection (MVP simplification).

## 🟡 Beta

**Focus**: Choice & Qualitative Features.

- **Multiclassing**: Logic to handle separate Class Levels vs Character Level (Proficiency).
- **Subclasses**: Feature injection based on Subclass selection at appropriate levels (3rd, etc.).
- **Feats vs ASI**: Logic to enforce Choice (Stat bump vs Feat add).
- **Known Spells**: Validation of "Spells Known" limits (e.g., Sorcerer/Bard constraints).

## 🔵 V1 (Release)

**Focus**: Full Build Automation.

- **Retraining**: Logic to swap spells/features on level up (e.g., Eldritch Invocations).
- **Epic Boons**: Post-20 progression support.
- **Training Awards**: Handling non-XP progression (Milestone/Story awards).
