# Resting & State Roadmap

## Overview

State Management covers the recovery of resources (HP, Slots, Features) and the tracking of temporary effects (Conditions, Buffs).

## 🟢 Alpha (MVP) _(Implemented)_

**Focus**: Core Resource Recovery.

- **Short Rest**: Hit Dice spending logic, Warlock/Monk resource reset (generic 'short-rest' tag).
- **Long Rest**: Full HP, Half Hit Dice, Full Slot reset.
- **Conditions**: Basic list on CharacterSheet.

## 🟡 Beta

**Focus**: Time-Based complexity.

- **Condition Expiry**: Hook to auto-remove conditions at Start/End of Turn or Duration end.
- **Exhaustion**: Implementation of 6-level Exhaustion mechanical penalties (Speed, Checks, Saves, Max HP).
- **Ambush Prevention**: Logic to interrupt Long Rest if danger detected (reset progress).
- **Donning/Doffing Armor**: Time enforcement for changing equipped state.

## 🔵 V1 (Release)

**Focus**: Survival & Environment.

- **Lifestyle Expenses**: Auto-deduction of gold for downtime.
- **Environmental Hazards**: Extreme Cold/Heat requiring CON saves per hour.
- **Disease**: Progressive condition tracks (Incubation -> Symptoms).
- **Downtime Activities**: Crafting, Researching, Training resolution engines.
