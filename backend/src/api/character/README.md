# Character System Architecture

This directory contains the logic for the **Character** entity, which serves as the blueprint for player avatars. However, the system relies on a dual-entity model to separate "library data" from "active game state".

## Core Concept: Blueprint vs. Instance

The most important distinction in this module is between a **Character** and a **CharacterSheet**.

### 1. Character (The Blueprint)

- **Location**: `api::character.character`
- **Purpose**: Represents a template or a "saved character" in a player's library.
- **Mutability**: Rarely changes automatically. Users edit this when they want to update the "canonical" version of their character.
- **Lifecycle**: Persists across multiple games. A single Character can be instantiated into multiple Rooms.
- **Key Fields**:
  - `baseStats`: The rolled or standard array stats (Strength, dexterity, etc.).
  - `equipment`: The "starting layout" or "default loadout" of items.
  - `user`: The owner of the blueprint.

### 2. Character Sheet (The Instance)

- **Location**: `api::character-sheet.character-sheet`
- **Purpose**: Represents a living, breathing entity inside a specific Game Room.
- **Mutability**: Highly volatile. HP changes, items are looted/dropped, position updates every turn.
- **Lifecycle**: Created when a player "joins" a room with a Character. Deleted or archived when the campaign ends.
- **Key Fields**:
  - `currentHp` / `maxHp`: Tracks damage.
  - `stats`: The _effective_ stats (Base + Modifiers + Level ups).
  - `inventory`: The actual current items held.
  - `position`: X, Y, Z coordinates in the Voxel world.
  - `room`: The context this instance exists within.
  - `character`: Reference back to the original blueprint (optional, e.g., for Monsters).

---

## Data Modeling

### Stats (`game.stats` component)

Stats are stored as a reusable component because they appear in multiple places (Character base stats, Sheet current stats, Monster stats).

| Field          | Type    | Default | Description                     |
| :------------- | :------ | :------ | :------------------------------ |
| `strength`     | Integer | 10      | Muscle, athleticism             |
| `dexterity`    | Integer | 10      | Agility, reflexes               |
| `constitution` | Integer | 10      | Health, stamina                 |
| `intelligence` | Integer | 10      | Knowledge, reasoning            |
| `wisdom`       | Integer | 10      | Perception, intuition           |
| `charisma`     | Integer | 10      | Personality, influence          |
| `speed`        | Integer | 30      | Movement speed in feet per turn |

### Inventory (`game.inventory-item` component)

Inventory is modeled as a repeatable component. This allows flexible "bags of holding" or complex equipment slots without hardcoding columns.

- **Relation**: Each entry links to an `api::equipment.equipment` generic item (e.g., "Longsword").
- **Quantity**: Integer tracker (for stacking potions, arrows, etc.).
- **Slot**: Enum defining where the item is currently held.
  - `backpack` (Default)
  - `main_hand`, `off_hand`
  - `armor`, `head`, `feet`, `hands`, `neck`, `cloak`
  - `ring_1`, `ring_2`, `accessory`
- **IsEquipped**: Boolean flag to quickly toggle active state.

## Sub-Systems

### Image Generation

The `Character` entity holds three image references:

1.  **Portrait**: Small avatar (Chat, Turn order).
2.  **Upper Body**: Medium shot (Character sheet header).
3.  **Full Body**: Full reference (Details, Tokens).

These are typically generated via the AI subsystem based on the `appearance` JSON and `backstory` text.

### Ownership & Permissions

- A **Character** belongs to a `User` (plugin::users-permissions).
- A **CharacterSheet** is typically controlled by the internal game logic or the DM, but linked to a User via the parent Character or session context.
