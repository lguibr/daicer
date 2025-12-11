# Design Study 01: Architecture Overview

This design study outlines the comprehensive plan for the next generation of the DAICER game engine, focusing on advanced procedural generation, 3D verticality, tactical movement, and natural language integration.

## Index of Study Documents

| ID     | Title                                                      | Description                                                                                      |
| :----- | :--------------------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| **01** | **Architecture Overview**                                  | High-level vision, module connectivity, and system goals (this document).                        |
| **02** | [Advanced World Generation](02_advanced_world_gen.md)      | Algorithms for road networks, district zoning, and structure stamping.                           |
| **03** | [Multi-Level Architecture](03_multi_level_architecture.md) | Data structures for verticality (z-levels), stairs, doors, and sub-chunk connections.            |
| **04** | [Movement & Physics](04_movement_and_physics.md)           | Graph-based movement, velocity, terrain costs, and turn-based spatial logic.                     |
| **05** | [Tactical Combat System](05_tactical_combat_system.md)     | 3D line-of-sight, cover mechanics, range calculations, and tactical grids.                       |
| **06** | [Character Progression](06_character_progression.md)       | Integrating map exploration with leveling, XP from discovery, and spatial puzzles.               |
| **07** | [Natural Language Engine](07_natural_language_engine.md)   | Translating chat inputs ("Run up the stairs") into precise game actions and map state changes.   |
| **08** | [Data Persistence Schema](08_data_persistence_schema.md)   | Firestore schema optimization for graph-heavy data, caching strategies, and state serialization. |
| **09** | [Visual Feedback & UX](09_visual_feedback_ux.md)           | Rendering 3D verticality on a 2.5D grid, visual cues for up/down, and user interface.            |
| **10** | [Game Master Tools](10_game_master_tools.md)               | Configuration panels, manual overrides, and "God Mode" map editing tools.                        |

## System Goals

1.  **Immersive Verticality**: Break free from the flat plane. Implement true multi-story buildings, dungeons with vertical shafts, and rooftop traversal.
2.  **Meaningful Roads & Connectivity**: Roads should not just be painted tiles; they must form a graph that influences pathfinding speed and connects "Points of Interest" (POIs).
3.  **NLP-Driven Gameplay**: The map is the visual feedback for the chat input. "I walk north" should mechanically move the token on the grid, abiding by movement speed and terrain costs.
4.  **Configurable Density**: DMs must be able to slide a bar from "Rural" to "Metropolis" and see the procedural engine react instantly.

## High-Level Architecture

The system moves from a pure "Infinite Grid" logic to a **Hybrid Grid-Graph System**.

```mermaid
graph TD
    UserInput["User Chat Input"] --> NLP[NLP Engine]
    NLP --> ActionIntent{Intent}

    ActionIntent -- "Move/Act" --> GameLoop[Game Loop]
    ActionIntent -- "Query" --> QueryEngine[Query Engine]

    GameLoop --> Physics[Movement & Physics]
    Physics --> MapGraph[Map Graph (NavMesh)]
    MapGraph --> MapService[Map Service (Grid Data)]

    MapService --> WorldGen[World Generator]
    WorldGen --> Structures[Structure Stamper 2.0]
    WorldGen --> Roads[Road Network Gen]

    MapService -- "State Updates" --> Firestore[(Firestore)]
    MapService -- "Visual Update" --> Frontend[Frontend Renderer]

    subgraph "Spatial Awareness"
        Physics
        MapGraph
    end

    subgraph "Generation"
        WorldGen
        Structures
        Roads
    end
```

### Module Dependencies

- **World Gen** feeds the **Map Service**.
- **Map Service** provides the raw data (Voxels/Tiles) to the **Map Graph**.
- **Map Graph** abstracts tiles into nodes (Rooms, Hallways, Road Segments) for high-level logic.
- **NLP Engine** queries the **Map Graph** to understand context ("The door" refers to the closest door node).

## The "Not Generating" Problem

Current analysis of `grid-chunk-generator.ts` and `structure-stamper.ts` reveals:

- **Roads**: Currently, `stampStructureOnChunk` blindly paints `road` tiles if a structure template has them. There is no creating a connected road _network_ between structures.
- **Density**: Placements are static or random lists. No coherence or clustering logic exists (e.g., "Town Center" vs "Outskirts").
- **Verticality**: `structure-stamper.ts` only looks at `tiles[0]` (Surface). It ignores other floors defined in `Structure`.

This study proposes a complete overhaul of these pipelines to support the new requirements.
