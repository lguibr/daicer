# Rules Consolidation: MVP Scope Specification

Based on the design analysis and Q&A, this document defines the functional scope for the Rules Consolidation MVP.

## Core Architecture

- **Philosophy:** Deterministic Engine (Math/Dice/State) + LLM (Narrator/Interpreter).
- **Source of Truth:** `CharacterSheet`.
- **State Aggregation:** `CharacterSheet` aggregates all derived stats.
- **Action Registry:** `structuredActions` on the sheet is a **flattened list** containing all available actions (Attacks, Spells, Features, Racial Traits).

## 1. Combat Mechanics

| Feature                | MVP Status      | Implementation Detail                                                      |
| :--------------------- | :-------------- | :------------------------------------------------------------------------- |
| **Actions**            | ✅ Supported    | Identified by LLM as Tools. Flattened on Sheet.                            |
| **Multiattack**        | ✅ Supported    | Specialized logic: Unique Attack Roll, but individual Damage/Save per hit. |
| **Bonus Actions**      | ✅ Supported    | Tracked via `hasUsedBonusAction` state per turn.                           |
| **Crit/Hit**           | ✅ Supported    | Engine calculates; LLM receives raw dice data for narration.               |
| **Improvised Actions** | ✅ Supported    | Fallback to Proficiency Skill Check or Raw Attribute Check.                |
| **Grappling**          | ⚠ Simplified   | Applies "Stunned" condition.                                               |
| **Line of Sight**      | ✅ Supported    | Simple check. Returns error if blocked.                                    |
| **Reactions**          | ❌ Out of Scope | No Shield spell, AoO, etc.                                                 |
| **Legendary Actions**  | ⚠ Simplified   | Treated as normal actions in turn order.                                   |

## 2. Magic & Spells

| Feature            | MVP Status      | Implementation Detail                                   |
| :----------------- | :-------------- | :------------------------------------------------------ |
| **Spellbook**      | ✅ Supported    | Relation to Spells. Usage tracking computed separately. |
| **Spell Slots**    | ✅ Supported    | Dedicated Component (not JSON) on Sheet.                |
| **Concentration**  | ✅ Supported    | Damage auto-triggers CON Save.                          |
| **Ritual Casting** | ✅ Supported    | Enforces +10min (Time/Turn tracking).                   |
| **AoE Validation** | ✅ Supported    | 2D Shapes (Cone, Square, Line, Circle) vs Walls.        |
| **Saving Throws**  | ✅ Supported    | Loop through targets; individual calc per entity.       |
| **Upcasting**      | ❌ Out of Scope | Standard levels only.                                   |
| **Custom Scripts** | ❌ Out of Scope | No custom logic for weird spells.                       |

## 3. Features & Traits

| Feature            | MVP Status      | Implementation Detail                                     |
| :----------------- | :-------------- | :-------------------------------------------------------- |
| **Class Features** | ✅ Supported    | Passive/Toggleable triggers for LLM.                      |
| **Racial Traits**  | ✅ Supported    | Auto-logic (e.g., Halfling Luck rerolls 1s).              |
| **Limited Uses**   | ✅ Supported    | Tracked via "Latest Turn/Rest" timestamp vs current time. |
| **Conditions**     | ✅ Supported    | Duration tracked in Rounds/Turns.                         |
| **Resistances**    | ❌ Out of Scope | Todo.                                                     |
| **Multiclassing**  | ❌ Out of Scope | Single class only.                                        |
| **Subclasses**     | ❌ Out of Scope | Base class features only.                                 |

## 4. Resting

| Feature             | MVP Status      | Implementation Detail                             |
| :------------------ | :-------------- | :------------------------------------------------ |
| **Short Rest**      | ✅ Supported    | Restore resources + Spend Hit Dice (Transaction). |
| **Long Rest**       | ✅ Supported    | Reset via DateTime logic. No 24h lockout.         |
| **Ambush Snapshot** | ✅ Supported    | State saved before rest begins.                   |
| **Sleeping**        | ⚠ Simplified   | Perception checks / 2.                            |
| **Exhaustion**      | ❌ Out of Scope | Not tracked.                                      |
| **Environment**     | ❌ Out of Scope | No cold/heat interruptions.                       |

## 5. Leveling & Progression

| Feature            | MVP Status      | Implementation Detail                              |
| :----------------- | :-------------- | :------------------------------------------------- |
| **XP**             | ✅ Supported    | Awarded per monster kill.                          |
| **HP on Level Up** | ✅ Supported    | Auto-rolled (deterministic dice).                  |
| **New Spells**     | ⚠ Simplified   | Character learns _ALL_ available spells for level. |
| **Feats**          | ✅ Supported    | Validated and auto-added.                          |
| **Equipment**      | ✅ Supported    | Starter packs on character instantiation.          |
| **ASI**            | ❌ Out of Scope | No stat increases.                                 |

## 6. Inventory

| Feature         | MVP Status      | Implementation Detail           |
| :-------------- | :-------------- | :------------------------------ |
| **AC Calc**     | ✅ Supported    | Dynamic (Armor + Shield + DEX). |
| **Currency**    | ✅ Supported    | Simple Object.                  |
| **Encumbrance** | ❌ Out of Scope | Infinite carry.                 |
| **Consumables** | ❌ Out of Scope | No potions/scrolls.             |
| **Ammunition**  | ❌ Out of Scope | Infinite ammo.                  |
| **Attunement**  | ❌ Out of Scope | No limit/tracking.              |
| **Looting**     | ❌ Out of Scope | No body looting.                |
