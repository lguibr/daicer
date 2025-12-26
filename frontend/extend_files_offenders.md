# Frontend Codebase Size Report

## Top Offenders (by line count)

1.  **[CharacterCreation.tsx](file:///Users/lg/lab/daicer/frontend/src/components/room/CharacterCreation.tsx)** - 1438 lines
2.  **[CreateRoom.tsx](file:///Users/lg/lab/daicer/frontend/src/pages/CreateRoom.tsx)** - 779 lines
3.  **[CombatCharacterSheet.tsx](file:///Users/lg/lab/daicer/frontend/src/components/combat/CombatCharacterSheet.tsx)** - 707 lines
4.  **[game-data.ts](file:///Users/lg/lab/daicer/frontend/src/services/game-data.ts)** - 611 lines
5.  **[Assets2D.tsx](file:///Users/lg/lab/daicer/frontend/src/pages/Assets2D.tsx)** - 561 lines
6.  **[DiceRollAnimation.tsx](file:///Users/lg/lab/daicer/frontend/src/components/ui/dice-roll-animation/DiceRollAnimation.tsx)** - 518 lines
7.  **[DiceLoader.tsx](file:///Users/lg/lab/daicer/frontend/src/components/ui/dice-loader/DiceLoader.tsx)** - 487 lines
8.  **[Assets3D.tsx](file:///Users/lg/lab/daicer/frontend/src/pages/Assets3D.tsx)** - 495 lines
9.  **[AssetDetail.tsx](file:///Users/lg/lab/daicer/frontend/src/pages/AssetDetail.tsx)** - 464 lines
10. **[TestSetup.tsx](file:///Users/lg/lab/daicer/frontend/src/pages/TestSetup.tsx)** - 452 lines

_Note: Excludes data files (JSON) and generated files (src/gql/graphql.ts)._

---

## Detailed Analysis & Refactoring Plan

### 1. `CharacterCreation.tsx` (1438 lines)

**Role:** Monitors the complex multi-step wizard for creating a character (UI rendering + State + API).
**Issues:**

- **UI & Logic Entanglement:** Mixes complex rendering of 4+ wizard steps with deep logic for equipment management, state validation, and API syncing.
- **Props Explosion:** The main component passes excessive props to sub-renders or manages them all in one massive state object.
- **Hard to Read:** "handle..." functions for everything from file uploads to gold calculation are scattered.

**Proposed Split Strategy:**

1.  **Custom Hook `useCharacterForm`**:
    - Extract line 58-600+ logic involved in `state` updates.
    - `const { character, updateField, validationErrors } = useCharacterForm(initialState);`
    - This removes ~500 lines of logic from the view.
2.  **`useEquipmentStore` / Logic**:
    - Isolate the logic for buying/equipping items (`handleBuyItem`, `handleEquipItem`) into a specialized hook or helper.
    - The shop logic is complex enough to be its own domain.
3.  **Sub-Components for API**:
    - `handleCreateCharacter` and `handleGenerateAll` are large thunks. Move them to `services/character-creation.ts`.
4.  **Composition Pattern**:
    - Instead of importing `AppearanceSection` etc., and creating them inside the render with massive props, use a Context (`CharacterCreationContext`) at the top level so child steps can consume `updateField` directly without prop drilling.

### 2. `CreateRoom.tsx` (779 lines)

**Role:** Page for setting up a new game room (World settings, Players, AI configuration).
**Issues:**

- Handles form state for different entities (Room, World, Agent).
- Likely contains inline validation and maybe even some inline UI components.

**Proposed Split Strategy:**

1.  **Split by Step**: Similar to Character Creation, if there's a wizard or tabs, separate each into `CreateRoomSettings`, `CreateWorldConfig`.
2.  **Form Hook**: `useCreateRoomForm` to handle the data structure.

### 3. `CombatCharacterSheet.tsx` (707 lines)

**Role:** The in-game view of the character.
**Issues:**

- Renders many different stats (HP, AC, Spells, Inventory).
- Probably has complex conditional rendering logic.

**Proposed Split Strategy:**

1.  **Component Atomization**:
    - `HealthPanel`
    - `InventoryPanel`
    - `SpellbookPanel`
    - `StatsPanel`
    - Each should ideally take only the data it needs (`character.stats`, `character.inventory`).

## Type Tightness Improvements

- **Strict Interfaces**: Define `CharacterDraft` interfaces that are strictly typed and separate from the database `Character` model to handle the "creation in progress" state (where some fields might be partial).
- **Discriminated Unions**: For Wizard steps, use discriminated unions for state (`{ step: 'appearance', data: ... } | { step: 'equipment', data: ... }`) to avoid impossible states.
- **No `any`**: Audit `game-data.ts` and `game.ts` interactions to ensure the backend types (imported via shared types or codegen) are strictly adhered to.
