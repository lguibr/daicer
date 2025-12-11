# Design Study 10: Game Master Tools and Configuration

This final study focuses on the human controller (The User/DM). The procedural engine is powerful, but it needs fine-grained control and manual override capabilities.

## Configuration Panel

The "Room Settings" (exposed in previous tasks) is just the surface. We need a **"World Forge"** panel.

### Generation Sliders (Real-time Preview?)

- **Urbanization**: `0.0 (Wild)` <-> `1.0 (Metropolis)`
- **Verticality Bias**: `Flat` <-> `Vertical (Towers/Canyons)`
- **Road Complexity**: `Sparse` <-> `Dense Grid`
- **Chaos**: `Orderly (Grid)` <-> `Chaotic (Favela/Organic)`

## God Mode (The Map Editor)

The DM must be able to edit the generated world.

- **Brush Tool**: Paint `Biome` (Turn Desert -> Forest).
- **Structure Placer**: Drag & Drop a "Wizard Tower" template onto a chunk.
- **Voxel Carver**: Manually dig caves or raise mountains (modifying the `Tile` data directly).

**Implementation**:
This bypasses the `Seed`. This writes to the `Delta Layer` (Study 08).
`ChunkDelta` records: `tile_5_5_0: "lava"`.

## Debugging and Visualization

DM Tools should allow seeing the "Invisible".

- **Toggle NavMesh**: See the graph overlay (Study 04) to debug movement issues.
- **Toggle Spawns**: See where monsters _would_ spawn.
- **Toggle Zones**: Visual overlay of Commercial/Residential zones (Study 02).

## Scripting and Triggers

For advanced users, a "Trigger Editor":

- **Condition**: `Entity(Type=Player)` enters `Region(Gatehouse)`.
- **Action**: `Spawn(Guard, Count=3)`.
- **Action**: `Chat(System, "Halt! Who goes there?")`.

This allows the DM to build dynamic encounters without coding, using a visual logic builder.

## Conclusion of Study

This 10-part study outlines a massive leap forward for the DAICER engine.

- **From**: Flat, disconnected, randomly noisy chunks.
- **To**: A coherent, vertical, connected, lived-in world with deep tactical gameplay and natural language control.

**Action Plan**:

1.  Implement **Data Persistence (08)** changes (Delta layers).
2.  Refactor **World Gen (02)** to include Road Graphs.
3.  Update **Multi-Level Architecture (03)** in the Backend.
4.  Build the **Frontend Visuals (09)** to render this new depth.

[Back: Visual Feedback & UX](09_visual_feedback_ux.md)
[Return to Index](01_architecture_overview.md)
