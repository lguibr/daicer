---
trigger: always_on
---

# 🎮 04. Game Engine (The Core)

## Core Philosophy: Lawful Engine, Interpretive LLM

The game relies on a strict separation between **Ground Truth (Engine)** and **Narrative (LLM)**.

## 1. Deterministic Computation (The Body)

- **The Engine acts as the definitive physics and rules system.**
- All mechanics (Combat, Movement, Skill Checks, Save Throws) are computed by **deterministic TypeScript code**.
- **No Hallucination**: The engine never guesses. It calculates `1d8 + 3 = 6` exactly.
- **Location**: `@daicer/engine`.

## 2. LLM Interpretation (The Soul)

- **The LLM acts as the Dungeon Master / Narrator.**
- It receives the **Engine Result**.
- It **generates Lore/Roleplay** based _strictly_ on that result.
- **Constraint**: The LLM cannot change the result. If the engine says "Miss", the LLM describes a miss.

## 3. Data Flow

`User Input` -> `LLM Intent` -> `Engine Execution` -> `State Update` -> `LLM Narration`

## 4. Debug Mode

- Developers must be able to trigger Engine Actions directly (bypassing the LLM) to verify deterministic mechanics.
