# 09. The Blueprint Pattern: Relations

## The Problem

We have `monsters` and `characters` (blueprints), and `character-sheets` (runtime instances).
Currently, the `CharacterSheet` tries to link back to the Blueprint for data (`sheet.character.race`), but this breaks if the Blueprint changes (retcon) or if we want to "customize" the instance (e.g., this specific Goblin has +2 STR).

## The Standardized "Unified Sheet" Model

**The Snapshot Pattern**.
When a `CharacterSheet` is spawned, it must **copy** all relevant data from the Blueprint into itself. The Blueprint becomes a "parent reference" only, not a data dependency for calculation.

### Data Flow

```mermaid
graph TD
    A[Monster Blueprint] -->|Spawn Copy| B[CharacterSheet (Instance)]
    C[Character Blueprint] -->|Spawn Copy| B
    B -->|Runtime| D[Engine Calculation]
```

## Unification Strategy

1.  **Monster Spawn**:

    - Copy `hp` -> `maxHp`.
    - Copy `stats` -> `stats`.
    - Flatten `actions` -> `actions` blob (until structured).
    - Flatten `proficiencies` -> `tags`.

2.  **Character Spawn**:
    - Copy `baseStats` -> `stats`.
    - Resolve `Race/Class` -> Apply modifiers -> Store final `stats` and `features`.
    - **Crucial**: If the player levels up, we update the _Blueprint_ and then _Re-Sync_ the Sheet.

**Validation**:
We already implemented "Stat Copying" in the unification task. We must extend this to Proficiencies, Features, and Actions.
