# Time Frame API

> **Concept**: Map POV Time Framing

This module implements the **Time-Framed State** architecture, a high-concept pattern that replaces the traditional "static room" model with a dynamic, history-aware system. It serves as the backbone for the game's determinism, replayability, and "Time Travel" features.

## Conceptual Overview

In most VTTs (Virtual TableTops), a Room has a single mutable state (the "current" map). In Daicer, a Room is just a container for a history of **Time Frames**.

- **Truth is a Derivation**: The "Truth" of the world at Turn `T` is not a mutable database record but a derived snapshot.
- **Perspective Filtering**: What a player _sees_ is a computed view (POV) of that snapshot, filtered by their character's knowledge, position, and the Fog of War at that specific time.

## Data Model

### `TimeFrame` (Collection Type)

The canonical record of the world state at a discrete moment.

| Field        | Type     | Description                                                                                         |
| :----------- | :------- | :-------------------------------------------------------------------------------------------------- |
| `turnNumber` | Integer  | The sequential index of this frame in the Room's history (0-indexed).                               |
| `timestamp`  | DateTime | When this frame was recorded (real-world time).                                                     |
| `room`       | Relation | The `Room` this frame belongs to (Many-to-One).                                                     |
| `gameEvents` | Relation | The `GameEvent`s that occurred _during_ this turn (Many-to-Many).                                   |
| `gameState`  | JSON     | **The Core Payload**. Contains the full serialized state of the engine (Entities, Fog, Map Config). |

### `Room` (Relation)

The `Room` entity maintains a `currentTimeFrame` relation, which points to the "HEAD" of the history (the latest valid state).

## Service Layer

### `createSnapshot(roomId, gameState)`

**Write Operation**: Called by the Engine/Game Loop at the end of a Turn.

1. Fetches the current turn count for the Room.
2. Serializes the entire engine state into the `gameState` JSON.
3. Creates a new `TimeFrame` record linked to the Room.

### `getPOV(timeFrameId, playerId)`

**Read Operation**: Calculated on-demand.

1. Retrieves the `TimeFrame` by ID.
2. **(Planned)** Applies "Perspective Filtering":
   - Removes entities currently hidden from the requesting `playerId`.
   - Masks map chunks based on the Fog of War state _at that specific turn_.
3. Returns the sanitized `gameState` for the frontend to render.

## Usage

### Frontend "Time Travel"

The Frontend (`TimeFrameContext`) allows players to "scrub" through history.

- **Live Mode**: Subscribes to the `Room` to receive the latest `currentTimeFrame`.
- **History Mode**: User selects a past Turn. The frontend requests that specific `TimeFrame` by ID.
- **Hydration**: The `MapRenderer` is stateless; it simply renders whatever `gameState` is currently piped in from the active Time Frame.
