# Phase 4: UX & Polish (Technical Specification)

**Objective**: Optimize the interface for Mobile/Touch users and handle the data scale constraints (Firestore writes, coordinates) identified in the clarification phase.

## 1. UX Architecture (Mobile First)

```mermaid
graph TD
    Touch[Touch Event] -->|Hit Test| Canvas[Grid Canvas]
    Canvas -->|Screen -> World| Coords[Coordinate Converter]

    Coords -->|Tap (Short)| Select[Select Tile]
    Coords -->|Tap (Long)| Context[Context Menu]

    Select -->|Highlight| Render[Draw Selection Box]
    Select -->|Inject| Chat[Chat Input Reference]

    Context -->|Action| QP[Quick Palette]
    QP -->|'Move Here'| Chat
    QP -->|'Look'| Chat
```

## 2. Input Refinement

### 2.1 "Tap-to-Reference" (QA #65)

On mobile, precise typing of coordinates ("Move to 10,20") is painful.
**Refactor**: `frontend/src/components/world/GridMapRenderer.tsx` & `GameRoom.tsx`

**Logic**:

1.  **Selection State**: Add `selectedTile: Point3D | null` to Frontend State.
2.  **Visual Feedback**: Draw a pulsing yellow border around `selectedTile`.
3.  **Chat Injection**:
    - When a tile is selected, render a "Chip" in the Chat Input: `[@ 10,15,0]`.
    - User types: "I go to " + [Tap Tile] -> "I go to [@ 10,15,0]".
4.  **Parser Update**: The "Intent Parser" (Phase 3) must recognize this `[@ x,y,z]` token as a high-precision coordinate target.

### 2.2 Ghost Pathing

When the user taps a destination, before they confirm:

1.  **Client-Side A\***: Run a quick local pathfinding check (using cached chunks).
2.  **Render Path**: Draw a dotted line showing the proposed movement.
3.  **Cost Preview**: Show "Cost: 15ft" floating above the destination.

## 3. Data Optimization Strategy

### 3.1 Firestore Write Batching (QA #76)

**Constraint**: Firestore limit ~1 write/sec per doc.
**Problem**: 100 Goblins moving = 100 Writes.
**Solution**: **Turn Batching**.

**Entity**: `ActionBatch` (New Collection)
Instead of updating `players/{id}` directly during a turn execution:

1.  **Accumulate**: The DM Agent collects all NPC moves for "Round 1".
2.  **Batch**: Create one `ActionBatch` document:
    ```json
    {
      "turn": 5,
      "updates": [
        { "id": "goblin_1", "pos": { "x": 10, "y": 10 } },
        { "id": "goblin_2", "pos": { "x": 12, "y": 12 } }
      ]
    }
    ```
3.  **Commit**: Write 1 document.
4.  **Client**: Listens to `ActionBatch`. When received, updates local mob positions in bulk.

### 3.2 Infinite Coordinate Management (QA #31, #42)

**Constraint**: "No hard cap" but Floating Point errors exist.
**Safeguard**:

- **Soft Cap**: Warn users if they travel beyond `+/- 1,000,000` (where 64-bit float precision is still fine, but index keys might get huge).
- **Unloading**: Implement aggressive `useEffect` cleanup in `GridMapRenderer` to `delete chunkCache[key]` if `distance(chunk, center) > viewDistance`.

## 4. Polished Visuals (Entropy & Fog)

### 4.1 Fog of War (QA #77)

**Constraint**: "Greyed out" (Visited) vs "Pitch Black" (Unvisited).
**Implementation**:

- `ChunkMetadata` stores `visited: boolean`.
- **Renderer**:
  - If `!visited`: Draw Black Overlay.
  - If `visited && !visible`: Draw Grey Overlay (Saturation 0%, Brightness 50%).
  - If `visible`: Draw Normal.

### 4.2 Error Handling UX

**Constraint**: "Fat Finger Safety" (QA #74).
Since we have "No Undo", we need "Confirmation":

- **Dangerous Acts**: If Intent Parser detects "Attack" or "Jump" (into pit):
  - DM Agent Response: "Are you sure? (Type 'Confirm')"
  - Requires explicit override for high-entropy actions.

## 5. Testing & Validation

### 5.1 Mobile Usability Test

- **Device Simulator**: Use Chrome DevTools "iPhone 12" mode.
- **Task**: "Tap tile (10,10), Type 'Move', Send".
- **Success**: Chat contains correct coordinate reference.

### 5.2 Performance Test

- **Scenario**: "Mass Mobilization".
- **Action**: Move 50 entities effectively simultaneously.
- **Metric**: Total Firestore Writes == 1 (Batch). Frontend Frame Drop < 5fps.
