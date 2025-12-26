# Room API

## Purpose

The `room` module is the central orchestrator of the game session. It acts as the container for players, characters, and the game state loop. It manages the lifecycle of a game from the Lobby to the End Game.

## Architecture

The `Room` entity is the parent object for all gameplay interactions.

- **Turn Service**: Orchestrates the "Game Loop". It collects player Intent, prompts the DM AI (LLM), executes deterministic Tools, and updates the World History.
- **Action Registry**: Examples of deterministic logic (Dice Rolling, Movement, Damage Application) that the DM AI can invoke.
- **Phase Management**: Controls the flow (Lobby -> Character Creation -> Gameplay).

## Key Entities

- **Room (`schema.json`)**:

  - `phase`: Current state of the game (lobby, combat, etc).
  - `turnData`: Ephemeral state for the current pending turn (actions queue).
  - `history`: Log of past turns and narratives.
  - `character_sheets`: Usage of the CharacterSheet instances in this specific adventure.

- **Services**:
  - `turn-service.ts`: The "Game Loop" engine. Handles `resolveTurnWithLLM` and `processTurn`.
  - `action-registry.ts`: The "Toolbox" for the DM Agent.

## Usage

The Room API is primarily accessed via GraphQL for fetching state, and via Socket Events (or Custom Controllers) for submitting actions.

### Turn Cycle

1. **Accumulate**: Players submit actions via `addAction`.
2. **Lock**: Room enters `processing` phase.
3. **Resolve**: `processTurn` triggers the LLM.
4. **Execute**: LLM selects Tools -> Action Registry executes them deterministically.
5. **Update**: Room history is updated, phase returns to `idle`.

## Dependencies

- **Upstream**: Relies on `user-permissions` (Owner), `character-sheet` (Actors).
- **Downstream**: Used by `socket` lifecycle for real-time updates.
- **Internal**: Uses `utils/llm` for AI resolution.
