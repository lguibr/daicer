# Design Study 04: Movement and Physics

This document outlines the mechanics of moving through the complex 3D world defined in the previous studies. It bridges the gap between raw grid data and the "Game Loop".

## The Movement Graph

While the world is stored as a Grid, movement logic should operate on a **Navigation Graph (NavGraph)**.

### Why a Graph?

- **Variable Costs**: Mud costs more than Paved Road.
- **Verticality**: Stairs are "edges" between Z-nodes.
- **Logic**: A "Locked Door" is a temporary disconnection between two nodes.

```mermaid
graph LR
    NodeA[Tile 1,1 (z=0)] -- Cost 1 --> NodeB[Tile 1,2 (z=0)]
    NodeB -- Cost 5 (Difficult) --> NodeC[Tile 1,3 (z=0)]
    NodeC -- Cost 2 (Stairs) --> NodeD[Tile 1,3 (z=1)]
```

## Velocity and Turns

DAICER is a turn-based system, but we want it to feel dynamic.

- **Movement Budget**: Each entity has `Speed` (e.g., 30ft).
- **Grid Scale**: 1 Tile = 5ft.
- **Action Cost**: Moving 1 tile costs 5ft of movement.

### Complex Moves

- **Jumping**: Moving 2 tiles horizontally over a gap. Requires `Athletics` check if gap > X.
- **Climbing**: Using a `Ladder` tile costs 2ft per 1ft moved.
- **Falling**: Involuntary movement downwards (+ damage).

## Chat-Driven Movement ("I move North")

When a user says "I move north", the NLP engine (Study 07) produces an intent. The Physics system validates and executes it.

**Algorithm**:

1.  **Get Start Node**: Entity's current `(x, y, z)`.
2.  **Determine Target**: "North" implies `(x, y-1, z)`.
3.  **Check Connectivity**: Is there a valid edge?
    - _Wall_? invalid.
    - _Locked Door_? Invalid (Feedback: "The door is locked").
    - _Cliff_? Prompt user: "It's a steep drop. Jump down?"
4.  **Calculate Cost**: Apply terrain modifiers.
5.  **Deduct Budget**: `CurrentMovement -= Cost`.
6.  **Apply**: Update Entity Position.

## Physics in a "Text" Game

We need "Narrative Physics".

- **Knockback**: An explosion pushes an entity 10ft. The system must calculate the new tile, check for collisions (wall damage), and check for edges (falling).
- **Destruction**: A mechanism to destroy terrain (e.g., `Wall` -> `Rubble`). This updates the NavGraph dynamically (Wall edge removed, Rubble edge added with high cost).

## Pathfinding (A* and HPA*)

For NPCs and "Auto-move" commands ("Go to the tavern"), we need pathfinding.

- **Local A\***: Good for short distances within loaded chunks.
- **Hierarchical Pathfinding (HPA\*)**:
  - Divide world into large Sectors (e.g., 8x8 chunks).
  - Pre-calculate connectivity between Sectors (Entrance A to Exit B).
  - Pathfind across Sectors first, then refine locally.
  - This allows an NPC to walk from a Village to a Dungeon 2km away efficiently.

[Next: Tactical Combat System](05_tactical_combat_system.md)
[Back: Multi-Level Architecture](03_multi_level_architecture.md)
