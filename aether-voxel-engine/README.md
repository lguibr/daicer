# 🎲 DAICER MAP ENGINE

**A high-performance, deterministic, infinite procedural voxel world generation engine for TypeScript & React.**

![Version](https://img.shields.io/badge/version-3.5.0-blue.svg)
![TypeScript](https://img.shields.io/badge/language-TypeScript-3178C6.svg)
![React](https://img.shields.io/badge/framework-React-61DAFB.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📖 Overview

**Daicer** is a framework-agnostic procedural generation library designed for RPGs, strategy games, and dungeon crawlers. It features a sophisticated multi-layer voxel system, deterministic civilization generation, and a high-performance Canvas 2D renderer.

Unlike simple noise map generators, Daicer produces **gameplay-ready terrain**:
*   **7 Vertical Layers**: From deep bedrock caverns (`z: -3`) to floating sky structures (`z: +3`).
*   **Coherent Civilizations**: Procedurally places Cities, Castles, Towers, and Dungeons connected by roads.
*   **Fog of War**: Built-in recursive shadowcasting for visibility and exploration.
*   **Physics & Navigation**: A* Pathfinding and collision logic baked in.

---

## ✨ Key Features

### 🌍 Infinite World Generation
*   **Chunk-based Architecture**: Infinite scrolling on the X/Y axis (32x32 chunks).
*   **Deterministic PRNG**: Using `Alea` and `FastNoise` algorithms. The same seed *always* produces the same world.
*   **Biomes**: Dynamic biome determination based on elevation, moisture, and temperature.

### 🏰 Structural Logic
*   **Civilization Engine**: Automata-based generation of structures.
*   **Structure Types**:
    *   **Cities**: sprawling plazas and housing clusters.
    *   **Castles**: Walled fortresses with central keeps.
    *   **Towers**: Multi-story vertical challenges.
    *   **Dungeons**: Multi-floor underground mazes with alternating stair logic.
*   **Road Network**: Uses Bresenham algorithms to carve paths between structures, building bridges over water.

### 👁️ Visibility & Physics
*   **Recursive Shadowcasting**: True FOV calculation that stops at walls.
*   **Exploration Memory**: Distinguishes between "Visible" (currently seen) and "Explored" (seen previously, now fogged).
*   **A* Pathfinding**: Calculate walkable paths across chunks instantly.

### ⚛️ React Integration
*   **`<MapRenderer />`**: A heavily optimized HTML5 Canvas component handling the rendering loop, depth sorting, and fog overlays.
*   **Custom Hooks**: Easy integration into existing React rendering lifecycles.

---

## 📦 Installation

*(Assuming local usage within this repository)*

1.  **Install Dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

2.  **Start the Demo**:
    ```bash
    npm start
    ```

---

## 🚀 Usage

Daicer exposes a clean API via `aether.ts`.

### 1. Initialize the Engine

```typescript
import { WorldGenerator, PhysicsEngine, WorldConfig, CHUNK_SIZE } from './aether';

// 1. Configure the World
const config: WorldConfig = {
  seed: 'my-rpg-world',
  chunkSize: CHUNK_SIZE,
  globalScale: 1.0,
  fogRadius: 16,
  structureChance: 0.8,
  // ... other options
};

// 2. Instantiate Generator
const generator = new WorldGenerator(config);

// 3. Instantiate Physics (Optional, for pathfinding/FOV)
const physics = new PhysicsEngine(generator);
```

### 2. Fetch Data (Headless Mode)

You can use the engine without React for server-side validation or non-visual logic.

```typescript
// Get a specific chunk
const chunk = generator.getChunk(0, 0);

// Inspect a specific tile at Z-Level 0 (Surface)
const tile = chunk.tiles[3][10][10]; // Z-index 3 corresponds to Z=0
console.log(tile.biome, tile.block);

// Calculate FOV
const visibleSet = physics.calculateFieldOfView({ x: 10, y: 10, z: 0 }, 16);
```

### 3. React Rendering

Use the provided component to render the world.

```tsx
import { MapRenderer } from './aether';

<MapRenderer
  width={800}
  height={600}
  center={{ x: 0, y: 0, z: 0 }}
  viewZ={0}
  scale={1.0}
  generator={generator}
  visibleTiles={myVisibleSet}
  exploredTiles={myExploredSet}
  onTileClick={(x, y) => console.log('Clicked', x, y)}
/>
```

---

## 🧠 Architecture & Concepts

### The Coordinate System
Daicer uses a standard Cartesian coordinate system with a specific Z-axis limitation optimized for 2.5D gameplay.

*   **X / Y**: Infinite.
*   **Z**: Locked range `[-3, 3]`.
    *   `+3` to `+1`: Sky / Roofs / Towers.
    *   `0`: **Surface** (Ground level).
    *   `-1` to `-3`: Underground / Basements / Dungeons.

### Data Model
*   **Chunk**: A 32x32x7 volume of tiles.
*   **Tile**: The atomic unit containing:
    *   `block`: The material (`BlockType.GRASS`, `BlockType.WALL_STONE`).
    *   `biome`: The environmental context (`BiomeType.DESERT`).
    *   `isWalkable`: Physics flag.
    *   `isTransparent`: Light propagation flag.

### Stair Logic
To ensure navigability between layers, the engine enforces strict stair placement rules:
*   **Towers**: Alternating Up/Down stairs at center/offset positions to prevent falling through floors.
*   **Dungeons**: Safe-zones carved around staircases to prevent spawning inside walls.

---

## ⚙️ Configuration (`WorldConfig`)

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `seed` | string | - | The DNA of the world. Same seed = same world. |
| `globalScale` | number | 1.0 | Zoom level of the underlying noise maps. |
| `seaLevel` | number | -0.1 | Threshold for water generation. |
| `elevationScale` | number | 0.015 | Frequency of terrain height changes. |
| `roughness` | number | 0.5 | Noise persistence (jaggedness). |
| `structureChance` | number | 0.8 | Probability (0-1) of a structure appearing in a region. |
| `structureSpacing` | number | 2 | Minimum chunk distance between structures. |
| `roadDensity` | number | 0.8 | Probability (0-1) of roads connecting neighbors. |
| `fogRadius` | number | 16 | Radius of the player's vision in tiles. |

---

## 🎮 Demo Controls

The included `App.tsx` serves as a full-featured demo.

*   **Left Click**: Inspect a tile. If walkable, calculates a path (Blue Line).
*   **Double Click**: Teleport player to tile. If tile is a Stair, traverses Z-level.
*   **Mouse Wheel**: Zoom In/Out.
*   **UI Buttons**: Switch Z-Levels manually.

---

## 📂 Project Structure

```text
src/
├── aether.ts             # 📚 Public Library Entry Point
├── App.tsx               # 🎮 Demo Application
├── constants.ts          # Color palettes and dimension constants
├── types.ts              # TypeScript Interfaces
├── core/
│   ├── math.ts           # Alea PRNG & FastNoise
│   ├── physics.ts        # Pathfinding & Shadowcasting
│   └── procgen.ts        # World Generation Logic & Civ Engine
└── components/
    ├── MapRenderer.tsx   # Canvas Rendering Component
    ├── TileInspector.tsx # UI Component
    └── WorldConfigForm.tsx # UI Component
```

---

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes.
4.  Open a Pull Request.

---

*Generated by Daicer Map Engine Team.*
