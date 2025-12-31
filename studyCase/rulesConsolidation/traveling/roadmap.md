# Traveling & Exploration Roadmap

## Overview

Traveling covers the macro-scale movement across the infinite **Voxel Grid**, carrying capacity, and exhaustion accumulation during chunk traversal.

## 🟢 Alpha (MVP) _(Implemented)_

**Focus**: Room-Scale Movement.

- **Movement**: Deterministic movement on the Voxel Grid (`x, y, z`) with speed clamping.
- **Vision**: Basic Line of Sight using Voxel raycasting.
- **Transport**: Direct teleport/portal logic between Grid coordinates.

## 🟡 Beta

**Focus**: Overland Mechanics.

- **Encumbrance**: Weight tracking vs STR score reducing Movement Speed (Tiles/Turn).
- **Pace**: Adjusting travel speed (Chunks per Hour) affecting Passive Perception.
- **Foraging**: Survival checks for resources within the current Biome/Chunk.

## 🔵 V1 (Release)

**Focus**: World Simulation.

- **Weather**: Global weather systems updating Voxel properties (e.g., Snow blocks reducing speed).
- **Mounts**: Persistent entities for vastly increased Voxel traversal speed.
- **Global Grid**: Large-scale navigation using the unified coordinate system (no separate Hex map, just zoomed-out Grid views).
