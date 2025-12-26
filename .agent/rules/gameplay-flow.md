---
trigger: always_on
---

# Deterministic Engine & LLM Interpretation

## Core Philosophy: Lawful Engine, Interpretive LLM
The game relies on a strict separation between **Ground Truth (Engine)** and **Narrative (LLM)**.

1. **Deterministic Computation (The Body)**
   - **The Engine acts as the definitive physics and rules system.**
   - All mechanics (Combat, Movement, Skill Checks, Save Throws) are computed by **deterministic TypeScript code** on the backend.
   - This code makes calls to the D&D 5e SRD constraints stored in Strapi (Classes, Monsters, Spells, Equipment).
   - **No Hallucination**: The engine never guesses. It calculates damage = 1d8 + 3 exactly.

2. **LLM Interpretation (The Soul)**
   - **The LLM acts as the Dungeon Master / Narrator.**
   - It receives one user message per turn.
   - It **decodes intent** and calls the appropriate **Deterministic Tool** (e.g., `engine.attack()`, `engine.move()`).
   - It **receives the result** (Success/Fail, Damage dealt, HP remaining).
   - It **generates Lore/Roleplay** based *strictly* on that result (e.g., "The goblin dodges your clumsy swing" vs "You cleave the goblin in two").

## The Data Flow
User Input -> LLM -> **Determine Tool** -> **EXECUTE ENGINE (Deterministic)** -> Engine Result -> **LLM Interpretation** -> Narrative Output

## Grounded Actions & D&D 5e Constraints
The engine is grounded in the database (Strapi). It knows:
- **Character Sheets**: Stats, inventories, current HP.
- **Rules**: Features, Traits, Magic Schools, Damage Types.
- **World**: Turn state, Monster positions.

## Debug Mode
- **Purpose**: To verify deterministic behavior without LLM variability.
- **Mechanism**: A mode where actions can be triggered directly against the engine (bypassing the intent interpreter).
- **Usage**: Developers "act" the actions to ensure the math and logic are perfect before the LLM is allowed to narrate them.
- **Testing**: If the engine says "Hit", the LLM *must* narrate a hit. Debug mode proves the "Hit" mechanics work.
