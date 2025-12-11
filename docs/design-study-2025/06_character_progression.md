# Design Study 06: Character Progression & Exploration

Leveling up should not just be about killing monsters. This study integrates the enhanced map system with character growth (XP, Skills) to reward exploration and spatial problem-solving.

## Discovery XP

We introduce **Exploration Milestones**.

- **Mechanism**: Specific Structures or Zones trigger XP awards upon first entry.
- **Implementation**: A hidden trigger volume (similar to `StructurePlacement`).
- **Feedback**: "You have discovered the _Sunken Crypt_. +100 XP."

## Skill Usage in the Environment

The map provides context for Skill Checks, making them meaningful rather than abstract dice rolls.

### Athletics & Acrobatics

- **Climbing**: Scaling a `Castle Wall` (Difficulty determined by block type: Rough Stone DC 10, Smooth Glass DC 25).
- **Jumping**: Clearing a 10ft chasm in a dungeon.
- **Success**: The character moves to the target tile.
- **Failure**: The character falls (takes damage, ends up on lower Z-level).

### Stealth & Perception

- **Hiding**: Requires `LightLevel < X` or `Cover`. The map's lighting system (Study 02/09) feeds directly into this.
- **Spotting**: Hidden doors or traps are actual entities on the map with `isVisible: false`. A passive Perception check against the Entity's DC reveals it (`isVisible: true`).

## Spatial Puzzles

Using the 3D grid to create gameplay challenges.

- **Levers and Doors**: Pulling a lever at `(x, y, z)` opens a Gate at `(x2, y2, z2)`.
- **Flow**: Diverting a water stream (changing `water` tiles) to flood a room or power a wheel.

```mermaid
graph LR
    PlayerAction[Player Pulls Lever] --> StateUpdate[Update Lever State]
    StateUpdate --> Signal[Send Signal 'OPEN_GATE_1']
    Signal --> GateEntity[Gate Entity]
    GateEntity --> Animation[Open Animation]
    GateEntity --> NavUpdate[Update NavMesh (Walkable)]
    Animation --> Feedback[Player sees Gate Open]
```

## Proficiency Integration

- **Mason's Tools**: A character with this proficiency might identify weak points in a wall (`GridTile` metadata `weak: true`).
- **Navigator's Tools**: exploring the `Road Network` (Study 02) grants advantage on survival checks or prevents getting lost in the "Wilderness" zones.

## Persistent World Impact

High-level characters change the world.

- **Building**: A player buys a `Lot` in town (Study 02) and builds a stronghold. The `StructureStamper` is invoked at runtime to modify the chunk permanently.
- **Consequences**: Clearing a dungeon stops monster spawns in that chunk, changing the `SafetyLevel` of the area.

[Next: Natural Language Engine](07_natural_language_engine.md)
[Back: Tactical Combat System](05_tactical_combat_system.md)
