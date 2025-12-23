# Map System: Current State Analysis

## Overview

The current map system in Daicer is characterized by the "Three-Headed Monster" architecture. There is no single source of truth for the instantiated 3D world state. Instead, map data is regenerated, parsed, and rendered independently in three distinct contexts, leading to visual inconsistencies, data loss, and "Black Map" bugs.

## Architecture

```mermaid
flowchart TB
    subgraph Shared
        SharedGen[Shared Generator\n(simple-gen.ts)]
        SharedTypes[Shared Types\n(ChunkDTO)]
    end

    subgraph Backend
        Service[Terrain Service]
        GQL[GraphQL API]
        REST[REST API]
    end

    subgraph Frontend_Game[Frontend: Gameplay]
        GameScreen[GameplayScreen.tsx]
        GameLoader[chunkLoader.ts]
        GameRender[TerrainExplorer.tsx]
    end

    subgraph Frontend_Preview[Frontend: Preview]
        PreviewScreen[TerrainGenerationScreen.tsx]
        PreviewState[Local State]
    end

    subgraph Admin_Plugin[Admin Plugin]
        AdminModal[MapModal/index.tsx]
        AdminHook[useMapGenerator]
    end

    SharedGen --> Service
    Service --> GQL
    Service --> REST

    GQL --> GameScreen
    GameScreen -- parse --> GameLoader
    GameLoader --> GameRender

    REST --> PreviewScreen
    PreviewScreen -- parse --> PreviewState
    PreviewState --> GameRender

    REST --> AdminModal
    AdminModal -- parse --> AdminHook
    AdminHook --> GameRender
```

## The Three Fragmentation Points

### 1. Gameplay (`GameplayScreen.tsx`)

- **Source**: Fetches data via GraphQL (`generateTerrain`).
- **State**: Maintains a complex `grid3D` state array in memory.
- **Parsing**: Uses `chunkLoader.ts` to convert `ChunkDTO` into `GridTile`.
- **Issues**:
  - Recently patched to handle `blockType` correctly.
  - Heavily dependent on `InfiniteChunksProvider` for dynamic loading.
  - **Critical Failure**: If the initial load fails or parses incorrectly, the user sees a "Black Map" (void).
  - **Persistence**: Temporary. If you reload, it re-fetches or potentially regenerates if not cached reliably by the backend.

### 2. Preview/Lobby (`TerrainGenerationScreen.tsx`)

- **Source**: Fetches data via REST (`/api/terrain/generate`).
- **State**: Maintains various local states (`biomeData`, `grid`, `grid3D`) inside the component.
- **Parsing**: Has its **own** inline parsing logic (lines 48-116) that duplicates `chunkLoader.ts` logic but often diverges.
- **Issues**:
  - **Logic Divergence**: The parsing loop here must be manually kept in sync with `chunkLoader.ts`. If one changes, the preview looks different from the game.
  - **Memory**: Loads the entire map into memory at once, which will crash for Large/Epic map sizes.
  - **No Infinite Loading**: Renders the whole static grid.

### 3. Admin Explorer (`MapModal/index.tsx`)

- **Source**: Fetches data via REST or internal service calls (depending on context).
- **State**: Uses `useMapGenerator` hook which has its own parsing logic.
- **Issues**:
  - Used for debugging but often shows "Green Roads" (missing structure data) because it didn't align with the latest `ChunkDTO` specs until recently patched.
  - Completely separate codebase from the Frontend, meaning shared types must be carefully imported or duplicated.

## Data Flow & Duplication Current Status

| Feature             | Gameplay            | Stats                  | Admin               |
| :------------------ | :------------------ | :--------------------- | :------------------ |
| **Data Source**     | GraphQL             | REST                   | REST                |
| **Parser**          | `chunkLoader.ts`    | **Inline Custom Loop** | `useMapGenerator`   |
| **Structure Logic** | `blockType` + biome | `blockType` + biome    | `blockType` + biome |
| **Persistence**     | Volatile (Session)  | Volatile (Session)     | None (On-demand)    |
| **Rendering**       | `TerrainExplorer`   | `TerrainExplorer`      | `TerrainExplorer`   |

### Key Issues Identified

1.  **Parser Duplication**: The logic to convert `ChunkDTO` (network format) to `GridTile` (render format) exists in 3 places.
    - `frontend/src/contexts/infinite-chunks/services/chunkLoader.ts`
    - `frontend/src/components/terrain/TerrainGenerationScreen.tsx` (Inline)
    - `backend/src/plugins/terrain-explorer/admin/src/hooks/useMapGenerator.ts` (implied)

2.  **Lack of Persistence**:
    - The map is "Generated" deterministically from a seed, but modifications are not saved easily.
    - If we want to burn down a forest or build a wall, we have no way to store that delta efficiently.
    - We rely on `room.history` for events, but not for the terrain state itself.

3.  **Entity Disconnection**:
    - Players and Creatures float "above" the map. They are not part of the grid.
    - We cannot query "What is at x,y?" purely from the backend without regenerating the chunk for that coordinate.

4.  **Performance Check**:
    - The Preview screen builds a `newGrid3D` array of size `1024x1024x7` for large maps.
    - `1024 * 1024 * 7 * ObjectSize` ≈ `7.3 million` objects.
    - This creates massive GC pressure and browser lag.

## Conclusion

The current state is functional for "Read-Only" generated terrain but fragile due to code duplication and lack of a unified state manager. It cannot support dynamic world changes (terraforming) or efficient large-scale persistence in its current form.
